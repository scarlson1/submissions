import { Box, Button, Typography } from '@mui/material';
import { Timestamp, setDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { isEmpty, isEqual } from 'lodash';
import Lottie from 'lottie-react';
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreDocData, useFunctions, useUser } from 'reactfire';

import { calcLocationChanges } from 'api';
import { CheckmarkLottie } from 'assets';
import { AdditionalInterest, ILocation, Limits, LocationChangeRequest } from 'common';
import { Wizard } from 'components/forms';
import { useDialog, useDocData } from 'hooks';
import { createChangeRequest } from 'modules/db';
import { combineToAdditionalInterests } from 'modules/utils';
import { ROUTES, createPath } from 'router';
import { LocationChangesStep } from './LocationChangesStep';
import { ReviewStep } from './ReviewStep';

// TODO: need to set userId, agent, org at some point

export interface LocationChangeValues {
  limits: Limits;
  deductible: number;
  additionalInterests: AdditionalInterest[];
  externalId: string;
  requestEffDate: Date;
}

interface ChangeLocationComponentProps {
  changeRequestDocResource: ReturnType<typeof createChangeRequest<LocationChangeRequest>>;
  policyId: string;
  locationId: string;
}

export const LocationChangeWizard = ({
  changeRequestDocResource,
  policyId,
  locationId,
}: ChangeLocationComponentProps) => {
  const navigate = useNavigate();
  const functions = useFunctions();

  const changeRequestRef = changeRequestDocResource.read(); // as DocumentReference<LocationChangeRequest>;

  const { data: changeRequest } =
    useFirestoreDocData<Partial<LocationChangeRequest>>(changeRequestRef);
  const { data: location } = useDocData<ILocation>('locations', locationId);
  const { data: user } = useUser();
  const dialog = useDialog();

  const formRef = useRef<FormikProps<LocationChangeValues>>(null);

  const saveChangeRequest = useCallback(
    async (values: Partial<LocationChangeRequest>) => {
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

  const handleSubmitStep = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      let reqId = changeRequestRef.id;

      let initValues = formRef.current?.initialValues;
      let skipUpdate = isEqual(values, initValues) && !isEmpty(changeRequest.formValues || {});

      if (!skipUpdate) {
        await saveChangeRequest({
          trxType: 'endorsement',
          requestEffDate: Timestamp.fromDate(values.requestEffDate),
          formValues: values,
          scope: 'location',
          locationId,
          externalId: location.externalId || null,
          userId: user?.uid || '',
        });

        if (!reqId) throw new Error('missing change requestId');
        console.log('calcing location changes...');
        const { data: res } = await calcLocationChanges(functions, {
          policyId,
          requestId: reqId,
        });
        console.log('CALC LOCATION CHANGES RES: ', res);
      }
    },
    [
      functions,
      user,
      location,
      locationId,
      policyId,
      saveChangeRequest,
      changeRequest,
      changeRequestRef,
    ]
  );

  const handleSubmitChangeRequest = useCallback(
    async () =>
      await saveChangeRequest({
        status: 'submitted',
        submittedBy: {
          userId: user?.uid || null,
          displayName: user?.displayName || '',
          email: user?.email || '',
        },
      }),
    [saveChangeRequest, user]
  );

  const handleDone = useCallback(() => {
    dialog?.handleAccept();
    navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
  }, [navigate, dialog, policyId]);

  return (
    // <Container maxWidth='md' sx={{ py: 8 }} disableGutters>
    // </Container>
    <Wizard maxWidth='md'>
      <LocationChangesStep
        // initialValues={initialValues.current}
        initialValues={{
          limits: changeRequest?.formValues?.limits || location.limits,
          deductible: changeRequest?.formValues?.deductible || location.deductible,
          requestEffDate:
            (changeRequest?.formValues?.requestEffDate as unknown as Timestamp)?.toDate() ||
            new Date(),
          externalId:
            changeRequest?.formValues?.externalId === undefined
              ? location.externalId || ''
              : changeRequest?.formValues?.externalId,
          additionalInterests: changeRequest?.formValues?.additionalInterests || [
            ...combineToAdditionalInterests(
              location.additionalInsureds,
              location.mortgageeInterest
            ),
          ],
        }}
        formRef={formRef}
        onSubmit={handleSubmitStep}
        replacementCost={location?.ratingPropertyData?.replacementCost}
      />
      <ReviewStep
        policyId={policyId}
        requestId={changeRequestRef.id}
        onSubmit={handleSubmitChangeRequest}
      />
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Lottie
            animationData={CheckmarkLottie}
            loop={false}
            style={{ height: 100, width: 100, marginTop: -12 }}
          />
        </Box>
        <Typography variant='h4' align='center' sx={{ pb: { xs: 3, sm: 4 } }}>
          Request submitted!
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ py: 5, mx: 'auto', maxWidth: 500 }}
        >
          Your change request has been received. You'll receive a confirmation email once it has
          been review and processed by our underwriters.
        </Typography>
        <Box sx={{ width: '100%', pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleDone} sx={{ ml: 'auto' }}>
            Done
          </Button>
        </Box>
      </Box>
    </Wizard>
  );
};
