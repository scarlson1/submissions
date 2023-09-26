import { Typography } from '@mui/material';
import { Timestamp, addDoc, doc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef } from 'react';
import { useFirestore } from 'reactfire';
import invariant from 'tiny-invariant';
import { add } from 'date-fns';

import {
  BaseChangeRequest,
  CHANGE_REQUEST_STATUS,
  LocationCancellationRequest,
  Policy,
  PolicyCancellationRequest,
  WithId,
  changeRequestsCollection,
  policiesCollection,
} from 'common';
import { RouterLink } from 'components/layout';
import { useAuth } from 'context';
import { CancelForm, CancelFormProps, CancelValues } from 'elements/forms';
import { getData } from 'modules/utils';
import { ROUTES, createPath } from 'router';
import { useAsyncToast } from './useAsyncToast';
import { useDialogForm } from './useDialogForm';

export const useCreateCancelRequest = (
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const toast = useAsyncToast();
  const formRef = useRef<FormikProps<CancelValues>>(null);
  const policy = useRef<WithId<Policy> | null>(null);
  const locationId = useRef<string | null>(null);

  // allow errors to propagate to onError in dialog context ??
  const handleSubmit = useCallback(
    async (values: CancelValues, bag: FormikHelpers<CancelValues>) => {
      toast.loading('saving cancellation request...');

      invariant(policy.current, 'form error - missing policy data');
      let p = policy.current;
      const userId = user?.uid;
      invariant(userId, 'must be signed in');

      let trxType: PolicyCancellationRequest['trxType'] =
        values.requestEffDate.getTime() < p.effectiveDate.toMillis()
          ? 'flat_cancel'
          : 'cancellation';

      const scope = locationId.current ? 'location' : 'policy';

      let changeRequestData: BaseChangeRequest = {
        trxType,
        requestEffDate: Timestamp.fromDate(values.requestEffDate),
        policyVersion: p.metadata.version || null,
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

      if (scope === 'location') {
        changeRequestData = {
          ...changeRequestData,
          scope: 'location',
          locationId: locationId.current,
          cancelReason: values.reason,
          formValues: values,
        } as LocationCancellationRequest;
      } else {
        changeRequestData = {
          ...changeRequestData,
          scope: 'policy',
          cancelReason: values.reason,
          formValues: values,
        } as PolicyCancellationRequest;
      }

      const changeReqCol = changeRequestsCollection(firestore, p.id);
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
      minDate: add(new Date(), { days: 1 }),
      maxDate: policy.current?.expirationDate?.toDate() || undefined,
    }),
    onSubmit: handleSubmit,
    onSuccess,
    onError: (msg, err) => {
      toast.error('an error occurred');
      onError && onError(msg, err);
    },
    dialogOptions: {
      title: `${locationId.current ? 'Location' : 'Policy'} cancellation request`,
      description: (
        <Typography variant='body2' component='div' color='text.secondary'>
          {"We're sorry to see you go. If there's something we can do, please "}
          <RouterLink to={createPath({ path: ROUTES.CONTACT })} sx={{ fontSize: 'inherit' }}>
            let us know
          </RouterLink>
          {'.'}
        </Typography>
      ),
      slotProps: { dialog: { maxWidth: 'sm' }, acceptButton: { variant: 'contained' } },
    },
  });

  return useCallback(
    async (policyId: string, lcnId: string | null = null) => {
      try {
        const ref = doc(policiesCollection(firestore), policyId);
        policy.current = await getData<Policy>(ref);
      } catch (err: any) {
        toast.error('error fetching policy');
        return;
      }

      // location cancel request if lcnId is provided, otherwise, policy cancellation request
      locationId.current = lcnId;

      const initialValues: CancelValues = {
        requestEffDate: null as unknown as CancelValues['requestEffDate'],
        reason: '' as CancelValues['reason'],
      };

      await dialogForm(initialValues);
    },
    [dialogForm, toast, firestore]
  );
};
