import ReactJson from '@microlink/react-json-view';
import { PersonAddAltRounded } from '@mui/icons-material';
import { Box, Container, Divider, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Timestamp, setDoc } from 'firebase/firestore';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useFunctions, useUser } from 'reactfire';
import { object } from 'yup';

import { calcLocationChanges } from 'api';
import { COLLECTIONS, ChangeRequest, ILocation, deductibleVal, limitsValidation } from 'common';
import {
  FormikFieldArray,
  FormikIncrementor,
  FormikTextField,
  FormikWizardNavButtons,
  Wizard,
  WizardNavButtons,
} from 'components/forms';
import { useAsyncToast, useDocData, useSafeParams, useWizard } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { combineToAdditionalInterests, dollarFormat } from 'modules/utils';
import { createChangeRequest } from 'views/AddLocation';
import { LimitsStep } from './LimitsStep';
import { LocationChangeValues } from './LocationChangeForm';

// interface LocationChangeFormProps {
//   initialValues: LocationChangeValues;
//   changeRequestId: string;
//   policyId: string;
// }
export interface LocationChangeFormProps extends FormikConfig<LocationChangeValues> {
  formRef: RefObject<FormikProps<LocationChangeValues>>;
  policyExpirationDate?: Date;
  replacementCost?: number | undefined;
}

const validation = object().shape({
  limits: limitsValidation,
  deductible: deductibleVal,
});

export const LocationChangeForm = ({
  initialValues,
  formRef,
  replacementCost,
  onSubmit,
  ...props
}: // policyId,
// changeRequestId,
LocationChangeFormProps) => {
  const { nextStep } = useWizard();

  const handleSubmit = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      try {
        await onSubmit(values, bag);
        bag.setSubmitting(false);
        await nextStep();
      } catch (err: any) {}
    },
    [onSubmit, nextStep]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      innerRef={formRef}
      onSubmit={handleSubmit}
      {...props}
    >
      {({
        values,
        errors,
        touched,
        dirty,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        submitForm,
      }) => (
        <Form>
          <Grid container spacing={5}>
            <LimitsStep replacementCost={replacementCost} />
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='h5' gutterBottom>
                Deductible
              </Typography>
              <FormikIncrementor
                name='deductible'
                incrementBy={500}
                min={1000}
                valueFormatter={(val: number | undefined) => {
                  if (!val) return;
                  return dollarFormat(val);
                }}
              />
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='h5' gutterBottom>
                Additional Interests
              </Typography>
              <Box
                sx={{
                  maxHeight: 400,
                  overflowY: 'auto',
                  my: 4,
                  p: 2,
                  border: (theme) =>
                    `1px solid ${
                      values.additionalInterests.length > 0 ? theme.palette.divider : 'transparent'
                    }`,
                  borderRadius: 1,
                }}
              >
                <FormikFieldArray
                  parentField='additionalInterests'
                  inputFields={[
                    {
                      name: 'type',
                      label: 'Interest Type',
                      required: false,
                      inputType: 'select',
                      selectOptions: [
                        { label: 'Mortgagee', value: 'mortgagee' },
                        { label: 'Additional Insured', value: 'additional_insured' },
                      ],
                    },
                    {
                      name: 'name',
                      label: 'Name',
                      required: false,
                      inputType: 'text',
                    },
                    {
                      name: 'accountNumber',
                      label: 'Account Number',
                      required: false,
                      inputType: 'text',
                      helperText: 'loan number (optional)',
                    },
                    {
                      name: 'address.addressLine1',
                      label: 'Mailing Address',
                      required: false,
                      inputType: 'address',
                      propsGetterFunc: (index, parentField) => {
                        return {
                          names: {
                            addressLine1: `${parentField}[${index}].address.addressLine1`,
                            addressLine2: `${parentField}[${index}].address.addressLine2`,
                            city: `${parentField}[${index}].address.city`,
                            state: `${parentField}[${index}].address.state`,
                            postal: `${parentField}[${index}].address.postal`,
                            county: `${parentField}[${index}].address.countyName`,
                            latitude: `${parentField}[${index}].address.latitude`,
                            longitude: `${parentField}[${index}].address.longitude`,
                          },
                        };
                      },
                    },
                  ]}
                  addButtonText='Add additional interest'
                  addButtonProps={{ startIcon: <PersonAddAltRounded /> }}
                  values={values}
                  errors={errors}
                  touched={touched}
                  dirty={dirty}
                  dividers={true}
                  dividerProps={{ sx: { my: { xs: 2, sm: 3, md: 4 } } }}
                  setFieldValue={setFieldValue}
                  setFieldError={setFieldError}
                  setFieldTouched={setFieldTouched}
                />
              </Box>
            </Grid>
            <Grid xs={12}>
              <Divider />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormikTextField
                name='externalId'
                label='External ID'
                fullWidth
                helperText='ID used/controlled by user or agency'
              />
            </Grid>
            <Grid xs={12}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );
};
interface ReviewStepProps {
  policyId: string;
  requestId: string | undefined;
  onSubmit: () => Promise<void>;
}
const ReviewStep = ({ policyId, requestId, onSubmit }: ReviewStepProps) => {
  if (!requestId) throw new Error('missing change request ID prop'); // TODO: better method for ensuring req ID
  const { data } = useDocData('POLICIES', requestId, [policyId, COLLECTIONS.CHANGE_REQUESTS]);
  const toast = useAsyncToast({ position: 'top-right' });

  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      // set status draft --> submitted
      toast.loading('saving...');
      await onSubmit();
      toast.success('saved!');
    } catch (err: any) {
      console.log('ERR: ', err);
      toast.error('An error occurred');
    }
  });

  return (
    <Box>
      <Typography component='div' variant='body2' color='text.secondary'>
        <ReactJson
          src={data}
          style={{ backgroundColor: 'inherit' }}
          // theme={theme}
          // theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          iconStyle='circle'
          // enableClipboard={(data) => copy(data.src, true)}
          collapseStringsAfterLength={30}
        />
      </Typography>
      <WizardNavButtons />
    </Box>
  );
};

// TODO: render as child of policy route - show policy details above (policy ID, named insured, location Id, etc.)

interface ChangeLocationComponentProps {
  changeRequestDocResource: ReturnType<typeof createChangeRequest>;
}

export const LocationChangeComponent = ({
  changeRequestDocResource,
}: ChangeLocationComponentProps) => {
  // use policy ID from location data ??
  // const firestore = useFirestore();
  const functions = useFunctions();
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);

  const changeRequestSnap = changeRequestDocResource.read();
  const { data: location } = useDocData<ILocation>('LOCATIONS', locationId);
  const { data: user } = useUser();

  const formRef = useRef<FormikProps<LocationChangeValues>>(null);
  // const changeRequestId = useRef<string>();

  const saveChangeRequest = useCallback(
    async (values: Partial<ChangeRequest>) => {
      // const changeReqCol = changeRequestsCollection(firestore, policyId);
      // let reqId = changeRequestSnap.id; // changeRequestId.current;
      // console.log(`SAVE REQUEST ${reqId}`);
      // if (!reqId) throw new Error('missing change request ID');
      console.log(`Saving change request ${changeRequestSnap.id}...`);
      await setDoc(
        changeRequestSnap, // doc(changeReqCol, reqId),
        {
          ...values,
          metadata: {
            updated: Timestamp.now(),
          },
        },
        { merge: true }
      );
    },
    [changeRequestSnap]
  );

  const handleSubmitStep = useCallback(
    async (values: LocationChangeValues) => {
      let reqId = changeRequestSnap.id;
      // await saveChangeRequest({ formValues: values });
      await saveChangeRequest({
        trxType: 'endorsement',
        requestEffDate: Timestamp.fromDate(values.requestEffDate),
        formValues: values,
        scope: 'location',
        locationId,
        externalId: location.externalId || null,
        userId: user?.uid || '',
      });
      // }

      // try {
      if (!reqId) throw new Error('missing change requestId');
      console.log('calcing location changes...');
      const { data: res } = await calcLocationChanges(functions, {
        policyId,
        changeRequestId: reqId,
      });
      console.log('CALC LOCATION CHANGES RES: ', res);
    },
    [functions, user, location, locationId, policyId, saveChangeRequest, changeRequestSnap]
  );

  const handleSubmitChangeRequest = useCallback(
    () =>
      saveChangeRequest({
        status: 'submitted',
        submittedBy: {
          userId: user?.uid || null,
          displayName: user?.displayName || '',
          email: user?.email || '',
        },
      }),
    [saveChangeRequest, user]
  );

  return (
    <Container maxWidth='lg' sx={{ py: 8 }}>
      <Wizard header={<Header />} maxWidth='lg'>
        {/* BUG: need to get initial values from change request instead of location (location values as fallback) */}
        <LocationChangeForm
          initialValues={{
            limits: location.limits,
            deductible: location.deductible,
            requestEffDate: new Date(),
            externalId: location.externalId || '',
            additionalInterests: [
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
          // requestId={changeRequestId.current}
          requestId={changeRequestSnap.id}
          onSubmit={handleSubmitChangeRequest}
        />
      </Wizard>
    </Container>
  );
};

export const LocationChange = () => {
  const { policyId } = useSafeParams(['policyId']);
  const prev = usePrevious(policyId);

  const [changeRequestResource, setChangeRequestResource] =
    useState<ReturnType<typeof createChangeRequest>>();

  useEffect(() => {
    if (!changeRequestResource && policyId !== prev) {
      console.log('calling change request resource function');
      setChangeRequestResource(createChangeRequest(policyId));
    }
  }, [policyId, prev, changeRequestResource]);

  if (!changeRequestResource) return null;

  return <LocationChangeComponent changeRequestDocResource={changeRequestResource} />;
};

function Header() {
  return (
    <Typography variant='h5' align='center' sx={{ pb: 4 }}>
      Location Change Request
    </Typography>
  );
}
