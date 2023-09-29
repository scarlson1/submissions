import { User } from 'firebase/auth';
import { Timestamp, addDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef } from 'react';
import { useFirestore, useFunctions } from 'reactfire';

import { calcLocationChanges } from 'api';
import {
  CHANGE_REQUEST_STATUS,
  ILocation,
  LocationChangeRequest,
  Policy,
  WithId,
  changeRequestsCollection,
} from 'common';
import { useAuth } from 'context';
import { LocationChangeForm, LocationChangeFormProps, LocationChangeValues } from 'elements/forms';
import {
  additionalInterestsToAdditionalInsured,
  additionalInterestsToMortgagee,
  combineToAdditionalInterests,
} from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { formatChanges } from './useCreatePolicyChangeRequest';
import { useDialogForm } from './useDialogForm';

// test dev branch change

export const useCreateLocationChangeRequest = (policyId: string) => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const toast = useAsyncToast({ position: 'top-right' });
  const formRef = useRef<FormikProps<LocationChangeValues>>(null);
  const locationData = useRef<ILocation>();
  const policy = useRef<Policy>();
  const initialVals = useRef<Omit<LocationChangeValues, 'requestEffDate'>>();

  // for testing calcLocationChanges
  const functions = useFunctions();

  const handleSubmit = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      console.log('handleSubmit called');
      // TODO: better validation (locationId, etc.)
      if (!locationData.current || !initialVals.current || !policy.current)
        throw new Error('missing values. please reload.');

      const locationId = locationData.current.locationId;
      if (!locationId) throw new Error('missing locationId');

      const { requestEffDate: reqEffDateNew, ...newVals } = values;

      const diff = formatChanges<LocationChangeValues>(newVals, initialVals.current);

      const requiresEndorsement = hasEndorsementKeys(diff);
      const requiresAmendment = hasAmendmentKeys(diff);

      const common = getCommonTrxJson(
        reqEffDateNew,
        { ...policy.current, id: policyId },
        locationData.current.locationId,
        values,
        user
      );

      const changeRequestCol = changeRequestsCollection(firestore, policyId);
      const docIds = [];

      if (requiresEndorsement) {
        // TODO: create ProtectLocation type (omit termPremium, etc.)
        let endorsementChanges: Partial<Omit<ILocation, 'termPremium' | 'annualPremium'>> = {};

        // if (diff.effectiveDate && values.effectiveDate)
        //   endorsementChanges['effectiveDate'] = Timestamp.fromDate(values.effectiveDate);

        // if (diff.expirationDate && values.expirationDate)
        //   endorsementChanges['expirationDate'] = Timestamp.fromDate(values.expirationDate);

        if (diff.limits && values.limits) endorsementChanges['limits'] = diff.limits;

        if (diff.deductible) endorsementChanges['deductible'] = values.deductible;

        // console.log('endorsement changes: ', endorsementChanges);

        const changeRequestData: LocationChangeRequest = {
          ...common,
          trxType: 'endorsement',
          locationChanges: { ...endorsementChanges },
        };

        const endorsementDocRef = await addDoc(changeRequestCol, { ...changeRequestData });
        docIds.push(endorsementDocRef.id);
      }

      if (requiresAmendment) {
        let amendmentChanges: Partial<Omit<ILocation, 'termPremium' | 'annualPremium'>> = {};

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
          locationChanges: amendmentChanges,
        };

        const amendmentDocRef = await addDoc(changeRequestCol, { ...changeRequestData });
        docIds.push(amendmentDocRef.id);
      }

      // FOR TESTING LOCATION CALC API ONLY
      if (requiresEndorsement) {
        const { data } = await calcLocationChanges(functions, {
          policyId,
          changeRequestId: docIds[0],
        });
        console.log('calc location changes res: ', data);
      }

      return docIds;
    },
    [firestore, functions, policyId, user]
  );

  const dialogForm = useDialogForm<LocationChangeValues, LocationChangeFormProps>({
    formComponent: (
      <LocationChangeForm
        initialValues={{} as LocationChangeValues}
        formRef={formRef}
        onSubmit={handleSubmit}
        // policyExpirationDate={policy.current?.expirationDate.toDate() || undefined}
      />
    ),
    formRef,
    // getFormProps: () => ({ policyExpirationDate: policy.current?.expirationDate.toDate() }),
    onSubmit: handleSubmit,
    onSuccess: () => {
      toast.success('change request submitted');
      // TODO: pass onSuccessComponent to display in dialog --> timeout close dialog after x ms
    },
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
    async (loc: ILocation, p: Policy) => {
      locationData.current = loc;
      policy.current = p;

      const additionalInterests = combineToAdditionalInterests(
        loc.additionalInsureds,
        loc.mortgageeInterest
      );

      let initialValues: Omit<LocationChangeValues, 'requestEffDate'> = {
        limits: loc.limits,
        deductible: loc.deductible,
        // effectiveDate: loc.effectiveDate.toDate(),
        // expirationDate: loc.expirationDate.toDate(),
        additionalInterests,
        externalId: loc.externalId || '',
      };

      initialVals.current = initialValues;

      await dialogForm({ ...initialValues, requestEffDate: new Date() });
    },
    [dialogForm]
  );
};

// TODO: uncomment once changed to new policy-locations interface
const ENDORSEMENT_KEYS = ['limits', 'deductible', 'effectiveDate', 'expirationDate'];

function hasEndorsementKeys(diff: LocationChangeRequest['locationChanges']) {
  return !Object.keys(diff).every((k) => ENDORSEMENT_KEYS.indexOf(k) === -1);
}

const AMENDMENT_KEYS = ['additionalInterests', 'externalId'];

function hasAmendmentKeys(diff: LocationChangeRequest['locationChanges']) {
  return !Object.keys(diff).every((k) => AMENDMENT_KEYS.indexOf(k) === -1);
}

// TODO: generic type to be reused for common trx data for policy and location
function getCommonTrxJson(
  reqEffDate: Date,
  policy: WithId<Policy>,
  locationId: string,
  formValues: LocationChangeValues,
  user: User | null
): Omit<LocationChangeRequest, 'locationChanges' | 'policyChanges' | 'trxType'> {
  return {
    scope: 'location',
    requestEffDate: Timestamp.fromDate(reqEffDate),
    policyVersion: policy.metadata?.version || null,
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
