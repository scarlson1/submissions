import { Timestamp, addDoc, doc } from 'firebase/firestore';
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
  changeRequestsCollection,
  policiesCollection,
} from 'common';
import { useAuth } from 'context';
import {
  PolicyChangeForm,
  PolicyChangeFormProps,
  PolicyChangeValues,
} from 'elements/forms/PolicyChangeForm';
import { getData, getDifference } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { useDialogForm } from './useDialogForm';

// TODO: maybe add some sort of config to the Policy interface
//    - trxType value associated with changes to a field ??

export const useCreatePolicyChangeRequest = () => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const toast = useAsyncToast();
  let formikRef = useRef<FormikProps<PolicyChangeValues>>(null);
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

      // const changes = formatChanges<PolicyChangeValues, PolicyChangeRequest>(newVals, initVals);
      const changes = formatChanges<PolicyChangeValues>(newVals, initVals);

      const requiresAmendment = !missingAmendmentKeys(changes);
      if (!requiresAmendment) throw new Error('no changes detected');

      const common = getCommonTrxJson(
        values.requestEffDate,
        { ...policy.current, id: policyId.current },
        values,
        user
      );

      toast.loading('saving...');
      const colRef = changeRequestsCollection(firestore, policyId.current);
      const docIds = [];

      let amendmentChanges = pick(changes, ['namedInsured', 'mailingAddress']);
      console.log('amendment changes: ', amendmentChanges);

      const changeRequestJson: ChangeRequest = {
        ...common,
        trxType: 'amendment',
        changes: amendmentChanges,
      };

      let amendmentDocRef = await addDoc(colRef, { ...changeRequestJson });
      docIds.push(amendmentDocRef.id);

      return { docIds };
    },
    [firestore, initialVals, policy, policyId, toast, user]
  );

  const dialogForm = useDialogForm<PolicyChangeValues, PolicyChangeFormProps>({
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

      const ref = doc(policiesCollection(firestore), polId);
      const p = await getData(ref, 'policy not found');

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
        requestEffDate: new Date(),
      };

      initialVals.current = initialValues;
      policy.current = p;

      await dialogForm(initialValues);
    },
    [dialogForm, firestore]
  );
};

// export function formatChanges<T, S extends ChangeRequest>(
//   newValues: Omit<T, 'requestEffDate'>,
//   initialValues: Omit<T, 'requestEffDate'>
// ): S['changes'] {
//   return getDifference(initialValues, newValues);
// }
export function formatChanges<T>(
  newValues: Omit<T, 'requestEffDate'>,
  initialValues: Omit<T, 'requestEffDate'>
) {
  return getDifference(initialValues, newValues);
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
