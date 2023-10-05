import { Typography } from '@mui/material';
import { DocumentReference, Timestamp, setDoc } from 'firebase/firestore';
import { FormikConfig } from 'formik';
import { useCallback, useMemo } from 'react';
import { useFirestoreDocData, useFunctions } from 'reactfire';

import { calcAddLocation } from 'api';
import { AddLocationRequest, DraftAddLocationRequest, OptionalKeys } from 'common';
import { Wizard } from 'components/forms';
import { useAsyncToast } from 'hooks';
import { createChangeRequest } from 'modules/db';
import { AddressStep, AddressValues } from './AddressStep';
import { DeductibleStep, DeductibleValues } from './DeductibleStep';
import { LimitValues, LimitsStep } from './LimitsStep';
import { PropertyRatingDataStep, RatingDataValues } from './PropertyRatingDataStep';
import { ReviewStep } from './ReviewStep';
import { SubmittedStep } from './SubmittedStep';

export interface BaseStepProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  saveChangeRequest: (values: T) => Promise<void>;
  onError?: (msg: string) => void;
}

export type AddLocationValues = AddressValues & LimitValues & DeductibleValues & RatingDataValues;

interface AddLocationFormProps
  extends OptionalKeys<FormikConfig<AddLocationValues>, 'initialValues'> {
  // product: Product; // get from policy ??
  policyId: string;
  // changeRequestId: string;
  changeRequestDocResource: ReturnType<typeof createChangeRequest>;
}

export const AddLocationWizard = ({
  changeRequestDocResource,
  policyId,
  // product,
  onSubmit,
  // changeRequestId,
  ...props // TODO: pass to each step ?? (then to <Formik>)
}: AddLocationFormProps) => {
  const functions = useFunctions();
  // const firestore = useFirestore();
  // const { data } = useDocData(
  //   'POLICIES',
  //   changeRequestId,
  //   [policyId, COLLECTIONS.CHANGE_REQUESTS],
  //   { idField: 'id' }
  // );
  const changeRequestRef =
    changeRequestDocResource.read() as DocumentReference<DraftAddLocationRequest>; // <LocationChangeRequest>;

  const { data } = useFirestoreDocData<DraftAddLocationRequest>(changeRequestRef);
  const toast = useAsyncToast({ position: 'top-right' });
  // const reqCol = changeRequestsCollection(firestore, policyId);
  // const changeRequestRef = doc(reqCol, changeRequestId);

  // TODO: validate status === draft (throw and handle in Error Boundary)

  const serverValues = useMemo(() => data?.formValues || null, [data]);

  // TODO: use ref from suspense change request.read() ??
  const saveChangeRequest = useCallback(
    async (values: AddressValues | LimitValues | DeductibleValues | RatingDataValues) =>
      await setDoc(
        changeRequestRef,
        { formValues: values, metadata: { updated: Timestamp.now() } },
        { merge: true }
      ),
    [changeRequestRef]
  );

  // After deductible step --> calc rating, location values, policy changes, etc. (complete change request interface) --> onSubmit --> change status to submitted
  const handleCalcChanges = useCallback(async () => {
    const { data } = await calcAddLocation(functions, {
      policyId,
      requestId: changeRequestRef.id,
    });
    console.log('calc changes res: ', data);
  }, [functions, policyId, changeRequestRef]);

  const handleSubmit = useCallback(
    async () =>
      await setDoc(
        changeRequestRef as DocumentReference<AddLocationRequest>,
        { status: 'submitted', metadata: { updated: Timestamp.now() } },
        { merge: true }
      ),
    [changeRequestRef]
  );

  const handleError = useCallback(
    (msg: string) => {
      toast.error(msg);
    },
    [toast]
  );

  return (
    <Wizard
      header={<Header />}
      // footer={<WizardNavButtons />}
      maxWidth='lg'
    >
      <AddressStep
        // product={product}
        product='flood'
        saveChangeRequest={saveChangeRequest} // TODO: get property data
        // onSubmit={handleStepSubmit}
        changeRequest={data}
        initialValues={{
          address: {
            addressLine1: serverValues?.address?.addressLine1 || '',
            addressLine2: serverValues?.address?.addressLine2 || '',
            city: serverValues?.address?.city || '',
            state: serverValues?.address?.state || '',
            postal: serverValues?.address?.postal || '',
          },
          coordinates: {
            latitude: serverValues?.coordinates?.latitude || null,
            longitude: serverValues?.coordinates?.longitude || null,
          },
        }}
        onError={handleError}
      />
      <LimitsStep
        replacementCost={(serverValues?.ratingPropertyData?.replacementCost as number) || undefined}
        saveChangeRequest={saveChangeRequest}
        initialValues={{
          limits: {
            limitA: serverValues?.limits?.limitA || '',
            limitB: serverValues?.limits?.limitB || '',
            limitC: serverValues?.limits?.limitC || '',
            limitD: serverValues?.limits?.limitD || '',
          },
        }}
        onError={handleError}
      />
      <DeductibleStep
        saveChangeRequest={saveChangeRequest}
        initialValues={{ deductible: serverValues?.deductible || 5000 }}
        onError={handleError}
      />
      <PropertyRatingDataStep
        saveChangeRequest={saveChangeRequest}
        calcChanges={handleCalcChanges}
        initialValues={{
          effectiveDate: serverValues?.effectiveDate
            ? (serverValues.effectiveDate as unknown as Timestamp).toDate()
            : null,
          ratingPropertyData: {
            // CBRSDesignation: serverValues?.ratingPropertyData?.CBRSDesignation ?? null,
            basement: serverValues?.ratingPropertyData?.basement || '',
            // distToCoastFeet: serverValues?.ratingPropertyData?.distToCoastFeet ?? null,
            // floodZone: serverValues?.ratingPropertyData?.floodZone || null,
            numStories: serverValues?.ratingPropertyData?.numStories || '',
            // propertyCode: serverValues?.ratingPropertyData?.propertyCode || null,
            replacementCost: serverValues?.ratingPropertyData?.replacementCost || '',
            sqFootage: `${serverValues?.ratingPropertyData?.sqFootage || ''}` as unknown as number,
            yearBuilt: `${serverValues?.ratingPropertyData?.yearBuilt || ''}` as unknown as number,
            // FFH: serverValues?.ratingPropertyData?.FFH || null,
            priorLossCount: serverValues?.ratingPropertyData?.priorLossCount || '',
          },
        }}
        onError={handleError}
      />
      <ReviewStep data={data} onSubmit={handleSubmit} onError={handleError} />
      <SubmittedStep data={data} />
    </Wizard>
  );
};

function Header() {
  return (
    <Typography variant='h5' gutterBottom align='center'>
      Add Location
    </Typography>
  );
}
