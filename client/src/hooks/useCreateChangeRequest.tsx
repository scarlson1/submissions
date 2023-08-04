import { Firestore, Timestamp, addDoc, doc, getDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { pick } from 'lodash';
import { useCallback, useRef } from 'react';
import { useFirestore } from 'reactfire';

import {
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  Policy,
  PolicyChangeRequest,
  WithId,
  changeReqestsCollection,
  policiesCollection,
} from 'common';
import { useAuth } from 'context';
import { PolicyChangeForm, PolicyChangeValues } from 'elements/forms/PolicyChangeForm';
import { getDifference } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { useDialogForm } from './useDialogForm';

// TODO: maybe add some sort of config to the Policy interface
//    - trxType value associated with changes to a field ??

export const useCreateChangeRequest = () => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const toast = useAsyncToast();
  const formikRef = useRef<FormikProps<PolicyChangeValues>>(null);
  let policyId = useRef<string>();
  let policy = useRef<Policy>();
  let initialVals = useRef<PolicyChangeValues>();

  const handleSubmit = useCallback(
    async (values: PolicyChangeValues, bag: FormikHelpers<PolicyChangeValues>) => {
      console.log('on submit called...', values);

      if (!policyId.current || !initialVals.current || !policy.current)
        throw new Error('missing initial vals');

      let { requestEffDate: reqEffDate2, ...newVals } = values;
      let { requestEffDate: reqEffDate, ...initVals } = initialVals.current;

      const changes = formatChanges<PolicyChangeValues, PolicyChangeRequest>(newVals, initVals);

      const requiresEndorsement = !missingEndorsementKeys(changes);
      const requiresAmendment = !missingAmendmentKeys(changes);
      if (!(requiresEndorsement || requiresAmendment)) throw new Error('no changes detected');

      const common = getCommonTrxJson(
        values.requestEffDate,
        { ...policy.current, id: policyId.current },
        values,
        user
      );

      toast.loading('saving...');
      const colRef = changeReqestsCollection(firestore, policyId.current);
      const docIds = [];

      if (requiresEndorsement) {
        let endorsementChanges: PolicyChangeRequest['changes'] = {};
        if (changes.effectiveDate && values.effectiveDate)
          endorsementChanges['effectiveDate'] = Timestamp.fromDate(values.effectiveDate);
        if (changes.expirationDate && values.expirationDate)
          endorsementChanges['expirationDate'] = Timestamp.fromDate(values.expirationDate);
        console.log('endorsement changes: ', endorsementChanges);

        const changeRequestJson: PolicyChangeRequest = {
          ...common,
          trxType: 'endorsement',
          changes: endorsementChanges,
        };

        let endorsementDocRef = await addDoc(colRef, { ...changeRequestJson });
        docIds.push(endorsementDocRef.id);
      }

      if (requiresAmendment) {
        let amendmentChanges = pick(changes, ['namedInsured', 'mailingAddress', 'homeState']);
        console.log('amendment changes: ', amendmentChanges);

        const changeRequestJson: ChangeRequest = {
          ...common,
          trxType: 'amendment',
          changes: amendmentChanges,
        };

        let amendmentDocRef = await addDoc(colRef, { ...changeRequestJson });
        docIds.push(amendmentDocRef.id);
      }

      return { docIds };
    },
    [firestore, initialVals, policy, policyId, toast, user]
  );

  const dialogForm = useDialogForm<PolicyChangeValues>({
    formComponent: (
      <PolicyChangeForm
        initialValues={{} as PolicyChangeValues}
        formRef={formikRef}
        onSubmit={handleSubmit}
      />
    ),
    formRef: formikRef,
    onSubmit: handleSubmit,
    onSuccess: (result) => {
      console.log('on success', result);
      toast.success('change request saved');
    },
    onError: (msg: string, err: any) => {
      console.log('on error', err);
      toast.error(msg || 'error saving request');
    },
    onCancel: () => console.log('on cancel'),
    dialogOptions: {
      title: 'Policy change request',
      slotProps: { dialog: { maxWidth: 'md' }, acceptButton: { variant: 'contained' } },
    },
  });

  return useCallback(
    async (polId: string) => {
      policyId.current = polId;

      const p = await fetchPolicy(firestore, polId);
      let initialValues: PolicyChangeValues = {
        namedInsured: {
          displayName: p.namedInsured?.displayName || '',
          email: p.namedInsured?.email || '',
          phone: p.namedInsured?.phone || '',
        },
        mailingAddress: {
          addressLine1: p.mailingAddress?.addressLine1 || '',
          addressLine2: p.mailingAddress?.addressLine2 || '',
          city: p.mailingAddress?.city || '',
          state: p.mailingAddress?.state || '',
          postal: p.mailingAddress?.postal || '',
        },
        effectiveDate: p.effectiveDate?.toDate() || null,
        expirationDate: p.expirationDate?.toDate() || null,
        requestEffDate: new Date(),
      };

      initialVals.current = initialValues;
      policy.current = p;

      await dialogForm(initialValues);
    },
    [dialogForm, firestore]
  );
};

// TODO: generalize function (pass in doc ref) (id doc(policiesCollection(db), policyId))
async function fetchPolicy(db: Firestore, policyId: string) {
  const snap = await getDoc(doc(policiesCollection(db), policyId));
  const data = snap.data();
  if (!(snap.exists() && data)) throw new Error(`policy not found`);
  return data;
}

export function formatChanges<T, S extends ChangeRequest>(
  newValues: Omit<T, 'requestEffDate'>,
  initialValues: Omit<T, 'requestEffDate'>
): S['changes'] {
  return getDifference(initialValues, newValues);
}

// function formatChanges(
//   newValues: Omit<PolicyChangeValues, 'requestEffDate'>,
//   initialValues: Omit<PolicyChangeValues, 'requestEffDate'>
// ): ChangeRequest['changes'] {
//   return getDifference(initialValues, newValues);
// }

const endorsementFields = ['effectiveDate', 'expirationDate'];

// if one key matches, "every" returns false
function missingEndorsementKeys(changes: ChangeRequest['changes']) {
  return Object.keys(changes).every((k) => endorsementFields.indexOf(k) === -1);
}

const amendmentKeys = ['namedInsured', 'mailingAddress', 'homeState'];
function missingAmendmentKeys(changes: ChangeRequest['changes']) {
  return Object.keys(changes).every((k) => amendmentKeys.indexOf(k) === -1);
}

function getCommonTrxJson(
  reqEffDate: Date,
  policy: WithId<Policy>,
  formValues: PolicyChangeValues,
  user?: any
): Omit<PolicyChangeRequest, 'changes' | 'trxType'> {
  return {
    scope: 'policy',
    requestEffDate: Timestamp.fromDate(reqEffDate),
    policyId: policy.id,
    userId: policy.userId || '',
    formValues,
    agent: {
      userId: policy.agent?.userId || null,
    },
    agency: {
      orgId: policy.agency?.orgId || null,
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
