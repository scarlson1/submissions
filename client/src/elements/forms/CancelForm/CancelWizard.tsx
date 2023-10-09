import { add, startOfDay } from 'date-fns';
import { useFirestoreDocData, useFunctions, useUser } from 'reactfire';

import { calcCancelChange } from 'api';
import { CancellationReason, CancellationRequest } from 'common';
import { Wizard } from 'components/forms';
import { Timestamp, setDoc } from 'firebase/firestore';
import { FormikProps } from 'formik';
import { isEmpty, isEqual } from 'lodash';
import { createChangeRequest } from 'modules/db';
import { useCallback, useRef } from 'react';
import { Header } from '../AddLocation/Header';
import { CancelValues, CancelValuesStep } from './CancelValuesStep';
import { ReviewStep } from './ReviewStep';

const minEffDate = add(startOfDay(new Date()), { days: 1 });

interface CancelWizardProps {
  changeRequestDocResource: ReturnType<typeof createChangeRequest<CancellationRequest>>;
  policyId: string;
}

export const CancelWizard = ({ changeRequestDocResource, policyId }: CancelWizardProps) => {
  const functions = useFunctions();
  const { data: user } = useUser();
  const changeRequestRef = changeRequestDocResource.read();

  const { data: changeRequest } =
    useFirestoreDocData<Partial<CancellationRequest>>(changeRequestRef);

  const formRef = useRef<FormikProps<CancelValues>>(null);

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
        { merge: true }
      );
    },
    [changeRequestRef]
  );

  const handleNextStep = useCallback(
    async (values: CancelValues) => {
      let initValues = formRef.current?.initialValues;
      // skip saving values if no changes and formValues saved
      // (should compare to server state instead of initial values ??)
      let skipUpdate = isEqual(values, initValues) && !isEmpty(changeRequest.formValues || {});

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
        const { data: res } = await calcCancelChange(functions, {
          policyId,
          requestId: changeRequestRef.id,
        });
        console.log(`cancel changes res: `, res);
        // TODO: use mutation instead of subscription ??
      }
    },
    [functions, policyId, saveChangeRequest, changeRequestRef]
  );

  const handleSubmit = useCallback(
    async () =>
      await saveChangeRequest({
        status: 'submitted',
        submittedBy: {
          userId: user?.uid || null,
          displayName: user?.displayName || '',
          email: user?.email || '',
        },
      }),
    []
  );

  return (
    <Wizard header={<Header title='Cancel Location' />}>
      <CancelValuesStep
        initialValues={{
          requestEffDate:
            (changeRequest?.formValues?.requestEffDate as unknown as Timestamp)?.toDate() ||
            new Date(),
          cancelReason: changeRequest?.formValues?.cancelReason || ('' as CancellationReason),
        }}
        innerRef={formRef}
        minEffDate={minEffDate}
        // maxEffDate={}
        saveChangeRequest={handleNextStep}
        changeRequest={changeRequest}
      />
      <ReviewStep onSubmit={handleSubmit} />
    </Wizard>
  );
};
