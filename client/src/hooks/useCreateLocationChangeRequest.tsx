import { Timestamp, addDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef } from 'react';
import { useFirestore } from 'reactfire';

import {
  AdditionalInsured,
  AdditionalInterest,
  AddressWithCoords,
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  LocationChangeRequest,
  Mortgagee,
  Policy,
  PolicyLocation,
  WithId,
  changeReqestsCollection,
} from 'common';
import { useAuth } from 'context';
import { LocationChangeForm, LocationChangeValues, LocationChangeFormProps } from 'elements/forms';
import { useAsyncToast } from './useAsyncToast';
import { formatChanges } from './useCreatePolicyChangeRequest';
import { useDialogForm } from './useDialogForm';

export const useCreateLocationChangeRequest = (policyId: string) => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const toast = useAsyncToast();
  const formRef = useRef<FormikProps<LocationChangeValues>>(null);
  const locationData = useRef<PolicyLocation>();
  const policy = useRef<Policy>();
  const initialVals = useRef<Omit<LocationChangeValues, 'requestEffDate'>>();

  const handleSubmit = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      console.log('on submit: ', values);

      if (!locationData.current || !initialVals.current || !policy.current)
        throw new Error('missing values. please reload.');

      const { requestEffDate: reqEffDateNew, ...newVals } = values;

      const diff = formatChanges<LocationChangeValues, LocationChangeRequest>(
        newVals,
        initialVals.current
      );
      console.log('DIFF: ', diff);

      const requiresEndorsement = hasEndorsementKeys(diff);
      const requiresAmendment = hasAmendmentKeys(diff);

      const common = getCommonTrxJson(
        reqEffDateNew,
        { ...policy.current, id: policyId },
        locationData.current.locationId,
        values,
        user
      );

      const colRef = changeReqestsCollection(firestore, policyId);
      const docIds = [];

      if (requiresEndorsement) {
        let endorsementChanges: LocationChangeRequest['changes'] = {};

        if (diff.effectiveDate && values.effectiveDate)
          endorsementChanges['effectiveDate'] = Timestamp.fromDate(values.effectiveDate);
        if (diff.expirationDate && values.expirationDate)
          endorsementChanges['expirationDate'] = Timestamp.fromDate(values.expirationDate);
        // @ts-ignore
        if (diff.limits && values.limits) endorsementChanges['limits'] = diff.limits; // values.limits;
        if (diff.deductible) endorsementChanges['deductible'] = values.deductible;

        console.log('endorsement changes: ', endorsementChanges);

        const changeRequestData: LocationChangeRequest = {
          ...common,
          trxType: 'endorsement',
          changes: endorsementChanges,
        };

        const endorsementDocRef = await addDoc(colRef, { ...changeRequestData });
        docIds.push(endorsementDocRef.id);
      }

      if (requiresAmendment) {
        let amendmentChanges: LocationChangeRequest['changes'] = {};

        // @ts-ignore
        if (diff.additionalInterests) {
          amendmentChanges['additionalInsureds'] = additionalInterestsToAdditionalInsured(
            values.additionalInterests
          );
          amendmentChanges['mortgageeInterest'] = additionalInterestsToMortgagee(
            values.additionalInterests
          );
        }
        if (diff.externalId) amendmentChanges['externalId'] = values.externalId;

        const changeRequestData: LocationChangeRequest = {
          ...common,
          trxType: 'amendment',
          changes: amendmentChanges,
        };

        const amendmentDocRef = await addDoc(colRef, { ...changeRequestData });
        docIds.push(amendmentDocRef.id);
      }

      return docIds;
    },
    [firestore, policyId, user]
  );

  const dialogForm = useDialogForm<LocationChangeValues, LocationChangeFormProps>({
    formComponent: (
      <LocationChangeForm
        initialValues={{} as LocationChangeValues}
        formRef={formRef}
        onSubmit={handleSubmit}
        policyExpirationDate={policy.current?.expirationDate.toDate() || undefined}
      />
    ),
    formRef,
    formProps: { policyExpirationDate: policy.current?.expirationDate.toDate() },
    onSubmit: handleSubmit,
    onSuccess: () => {},
    onError: (msg: string, err: any) => {
      console.log('error: ', err);
      toast.error(msg);
    },
    dialogOptions: {
      title: 'Policy location change request',
      slotProps: { dialog: { maxWidth: 'md' }, acceptButton: { variant: 'contained' } },
    },
  });

  return useCallback(
    async (loc: PolicyLocation, p: Policy) => {
      locationData.current = loc;
      policy.current = p;

      const ai = convertAdditionalInsuredsToAdditionalInterests(loc.additionalInsureds);
      const m = convertMortgageesToAdditionalInterests(loc.mortgageeInterest);

      let initialValues: Omit<LocationChangeValues, 'requestEffDate'> = {
        limits: loc.limits,
        deductible: loc.deductible,
        effectiveDate: loc.effectiveDate.toDate(),
        expirationDate: loc.expirationDate.toDate(),
        additionalInterests: [...ai, ...m],
        externalId: loc.externalId || '',
      };

      initialVals.current = initialValues;

      await dialogForm({ ...initialValues, requestEffDate: new Date() });
    },
    [dialogForm]
  );
};

function convertAdditionalInsuredsToAdditionalInterests(
  additionalInsureds: AdditionalInsured[]
): AdditionalInterest[] {
  return additionalInsureds.map((ai) => ({
    type: 'additional_insured',
    name: ai.name,
    accountNumber: '',
    address: {
      addressLine1: ai.address?.addressLine1 || '',
      addressLine2: ai.address?.addressLine2 || '',
      city: ai.address?.city || '',
      state: ai.address?.state || '',
      postal: ai.address?.postal || '',
    } as AddressWithCoords,
  }));
}

function convertMortgageesToAdditionalInterests(mortgagees: Mortgagee[]): AdditionalInterest[] {
  return mortgagees.map((m) => ({
    type: 'additional_insured',
    name: m.name,
    accountNumber: m.loanNumber,
    address: {
      addressLine1: m.address?.addressLine1 || '',
      addressLine2: m.address?.addressLine2 || '',
      city: m.address?.city || '',
      state: m.address?.state || '',
      postal: m.address?.postal || '',
    } as AddressWithCoords,
  }));
}

const ENDORSEMENT_KEYS = ['limits', 'deductible', 'effectiveDate', 'expirationDate'];

function hasEndorsementKeys(diff: ChangeRequest['changes']) {
  return !Object.keys(diff).every((k) => ENDORSEMENT_KEYS.indexOf(k) === -1);
}

const AMENDMENT_KEYS = ['additionalInterests', 'externalId'];

function hasAmendmentKeys(diff: ChangeRequest['changes']) {
  return !Object.keys(diff).every((k) => AMENDMENT_KEYS.indexOf(k) === -1);
}

function getCommonTrxJson(
  reqEffDate: Date,
  policy: WithId<Policy>,
  locationId: string,
  formValues: LocationChangeValues,
  user?: any
): Omit<LocationChangeRequest, 'changes' | 'trxType'> {
  return {
    scope: 'location',
    requestEffDate: Timestamp.fromDate(reqEffDate),
    policyId: policy.id,
    locationId,
    formValues,
    userId: policy.userId || '',
    agent: {
      userId: policy.agent.userId || null,
    },
    agency: {
      orgId: policy.agency.orgId || null,
    },
    status: CHANGE_REQUEST_STATUS.SUBMITTED,
    submittedBy: {
      userId: user?.uid || null,
      displayName: user?.displayName || '',
      email: user?.email || null,
    },
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}

function additionalInterestsToAdditionalInsured(additionalInterests: AdditionalInterest[]) {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'additional_insured')
      .map((additionalNI) => ({
        name: additionalNI.name,
        email: '',
        address: additionalNI.address
          ? {
              addressLine1: additionalNI.address.addressLine1,
              addressLine2: additionalNI.address.addressLine2,
              city: additionalNI.address.city,
              state: additionalNI.address.state,
              postal: additionalNI.address.postal,
            }
          : null,
      })) || []
  );
}

function additionalInterestsToMortgagee(additionalInterests: AdditionalInterest[]) {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'mortgagee')
      .map((m) => ({
        name: m.name,
        contactName: '',
        contactEmail: '', // m.email,
        loanNumber: m.accountNumber,
        address: m.address
          ? {
              addressLine1: m.address.addressLine1,
              addressLine2: m.address.addressLine2,
              city: m.address.city,
              state: m.address.state,
              postal: m.address.postal,
            }
          : null,
      })) || []
  );
}
