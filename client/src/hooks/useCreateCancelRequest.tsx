import { useCallback, useRef } from 'react';
import { Typography } from '@mui/material';
import { Timestamp, addDoc, doc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { FormikHelpers, FormikProps } from 'formik';
import invariant from 'tiny-invariant';

import { useAsyncToast } from './useAsyncToast';
import { useAuth } from 'context';
import { CancelForm, CancelFormProps, CancelValues } from 'elements/forms';
import { useDialogForm } from './useDialogForm';
import { RouterLink } from 'components';
import { ROUTES, createPath } from 'router';
import {
  CHANGE_REQUEST_STATUS,
  Policy,
  PolicyCancellationRequest,
  WithId,
  changeReqestsCollection,
  policiesCollection,
} from 'common';
import { getData } from 'modules/utils';

export const useCreateCancelRequest = (
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  // const { data: user } = useSigninCheck()
  const { user } = useAuth();
  const toast = useAsyncToast();
  const formRef = useRef<FormikProps<CancelValues>>(null);
  const policy = useRef<WithId<Policy> | null>(null);

  // allow errors to propogate to onError in dialog context ??
  const handleSubmit = useCallback(
    async (values: CancelValues, bag: FormikHelpers<CancelValues>) => {
      toast.loading('saving cancellation request...');
      console.log('values: ', values);
      invariant(policy.current, 'form error - missing policy data');
      let p = policy.current;
      const userId = user?.uid;
      invariant(userId, 'must be signed in');

      const changeRequestData: PolicyCancellationRequest = {
        trxType: 'cancellation',
        scope: 'policy',
        requestEffDate: Timestamp.fromDate(values.requestEffDate),
        cancelReason: values.reason,
        formValues: values,
        changes: {},
        policyId: p.id,
        userId,
        agent: {
          userId: p.agent.userId || null,
        },
        agency: {
          orgId: p.agency.orgId || null,
        },
        status: CHANGE_REQUEST_STATUS.SUBMITTED,
        submittedBy: {
          userId,
          displayName: user.displayName || '',
          email: user.email || '',
        },
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };

      const changeReqCol = changeReqestsCollection(firestore, p.id);
      await addDoc(changeReqCol, changeRequestData);

      toast.success('saved!');
    },
    [firestore, user, toast]
  );

  const dialogForm = useDialogForm<CancelValues, CancelFormProps>({
    formComponent: (
      <CancelForm initialValues={{} as CancelValues} formRef={formRef} onSubmit={handleSubmit} />
    ),
    formRef,
    getFormProps: () => ({
      minDate: new Date(),
      maxDate: policy.current?.expirationDate?.toDate() || undefined,
    }),
    onSubmit: handleSubmit,
    onSuccess,
    onError: (msg, err) => {
      toast.error('an error occurred');
      onError && onError(msg, err);
    },
    dialogOptions: {
      title: 'Policy cancellation request',
      description: (
        <Typography variant='body2' component='div' color='text.secondary'>
          {"We're sorry to see you go. If there's something we can do, please "}
          <RouterLink to={createPath({ path: ROUTES.CONTACT })} sx={{ fontSize: 'inherit' }}>
            get in touch
          </RouterLink>
          {'.'}
        </Typography>
      ),
      slotProps: { dialog: { maxWidth: 'sm' }, acceptButton: { variant: 'contained' } },
    },
  });

  return useCallback(
    async (policyId: string) => {
      try {
        const ref = doc(policiesCollection(firestore), policyId);
        policy.current = await getData<Policy>(ref);
      } catch (err: any) {
        toast.error('error fetching policy');
        return;
      }

      const initialValues: CancelValues = {
        requestEffDate: null as unknown as CancelValues['requestEffDate'],
        reason: '' as CancelValues['reason'],
      };

      await dialogForm(initialValues);
    },
    [dialogForm, toast, firestore]
  );
};
