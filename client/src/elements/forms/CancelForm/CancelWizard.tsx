import { add, startOfDay } from 'date-fns';
import { setDoc, Timestamp } from 'firebase/firestore';
import { FormikConfig, FormikProps } from 'formik';
import { isEmpty, isEqual } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useFirestoreDocData, useFunctions, useUser } from 'reactfire';

import type { Policy } from '@idemand/common';
import { calcCancelChange, calcPolicyCancelChanges } from 'api';
import { CancellationReason, CancellationRequest } from 'common';
import { Wizard } from 'components/forms';
import { useDocDataOnce } from 'hooks';
import { createChangeRequest } from 'modules/db';
import { CancelValues, CancelValuesStep } from './CancelValuesStep';
import { ReviewStep } from './ReviewStep';
import { SubmittedStep } from './SubmittedStep';

// TODO: display locations in review step with strike through annual premium

const minEffDate = add(startOfDay(new Date()), { days: 1 });

export interface BaseStepProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  // saveChangeRequest: (values: T) => Promise<void>;
  onNextStep: (values: T) => Promise<void>;
  onError?: (msg: string) => void;
}

interface CancelWizardProps {
  changeRequestDocResource: ReturnType<
    typeof createChangeRequest<CancellationRequest>
  >;
  policyId: string;
  cancelScope: 'policy' | 'location';
}

export const CancelWizard = ({
  changeRequestDocResource,
  policyId,
  cancelScope,
}: CancelWizardProps) => {
  const functions = useFunctions();
  const { data: user } = useUser();
  const changeRequestRef = changeRequestDocResource.read();

  const { data: changeRequest } =
    useFirestoreDocData<Partial<CancellationRequest>>(changeRequestRef);

  const { data: policy } = useDocDataOnce<Policy>('policies', policyId);

  const formRef = useRef<FormikProps<CancelValues>>(null);

  // TODO: use location exp date instead of policy ??
  const maxEffDate = useMemo(() => policy.expirationDate?.toDate(), [policy]);

  const saveChangeRequest = useCallback(
    async (values: Partial<CancellationRequest>) => {
      console.log(`Saving change request ${changeRequestRef.id}...`);
      await setDoc(
        changeRequestRef,
        {
          ...values,
          metadata: {
            updated: Timestamp.now(),
          },
        },
        { merge: true },
      );
    },
    [changeRequestRef],
  );

  const calcChangesFn = useMemo(
    () =>
      cancelScope === 'policy' ? calcPolicyCancelChanges : calcCancelChange,
    [cancelScope],
  );

  const handleNextStep = useCallback(
    async (values: CancelValues) => {
      let initValues = formRef.current?.initialValues;
      // skip saving values if no changes and formValues saved
      // (should compare to server state instead of initial values ??)
      let skipUpdate =
        isEqual(values, initValues) && !isEmpty(changeRequest.formValues || {});

      if (!skipUpdate) {
        const requestEffDate = Timestamp.fromDate(values.requestEffDate);
        await saveChangeRequest({
          trxType: 'cancellation', // TODO: handle flat_cancel
          requestEffDate,
          formValues: {
            ...values,
            requestEffDate,
          },
        });

        console.log('calcing cancel changes...');
        const { data: res } = await calcChangesFn(functions, {
          policyId,
          requestId: changeRequestRef.id,
        });
        console.log(`cancel changes res: `, res);
        // TODO: use mutation instead of subscription ??
      }
    },
    [
      functions,
      policyId,
      saveChangeRequest,
      calcChangesFn,
      changeRequestRef.id,
      changeRequest.formValues,
    ],
  );

  const handleSubmit = useCallback(async () => {
    try {
      await saveChangeRequest({
        status: 'submitted',
        submittedBy: {
          userId: user?.uid || null,
          displayName: user?.displayName || '',
          email: user?.email || '',
        },
      });
    } catch (err: any) {
      toast.error('error submitting request');
    }
  }, [saveChangeRequest, user]);

  const handleError = useCallback((msg: string) => {
    toast.error(msg, { position: 'top-right' });
  }, []);

  return (
    <Wizard>
      <CancelValuesStep
        initialValues={{
          requestEffDate:
            (
              changeRequest?.formValues?.requestEffDate as unknown as Timestamp
            )?.toDate() || (null as unknown as Date), // || fallbackEffDate,
          cancelReason:
            changeRequest?.formValues?.cancelReason ||
            ('' as CancellationReason),
        }}
        innerRef={formRef}
        minEffDate={minEffDate}
        maxEffDate={maxEffDate}
        onNextStep={handleNextStep}
        onError={handleError}
        changeRequest={changeRequest}
      />
      {/* <ReviewStep policyId={policyId} requestId={changeRequestRef.id} onSubmit={handleSubmit} /> */}
      <ReviewStep
        onSubmit={handleSubmit}
        changeRequest={changeRequest}
        policy={policy}
      />
      <SubmittedStep
        data={changeRequest as CancellationRequest}
        policy={policy}
        title='Cancellation Request Submitted'
      />
    </Wizard>
  );
};
