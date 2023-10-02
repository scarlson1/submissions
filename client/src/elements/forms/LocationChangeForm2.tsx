import ReactJson from '@microlink/react-json-view';
import {
  BedRounded,
  FenceRounded,
  HouseRounded,
  PersonAddAltRounded,
  WeekendRounded,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { DocumentReference, Timestamp, setDoc } from 'firebase/firestore';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { merge } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFirestore, useFirestoreDocData, useFunctions, useUser } from 'reactfire';
import { date, object } from 'yup';

import { calcLocationChanges } from 'api';
import {
  COLLECTIONS,
  ILocation,
  LocationChangeRequest,
  PolicyChangeRequest,
  WithId,
  deductibleVal,
  fallbackImages,
  limitsValidation,
} from 'common';
import {
  FormikDatePicker,
  FormikFieldArray,
  FormikIncrementor,
  FormikTextField,
  FormikWizardNavButtons,
  Wizard,
  WizardNavButtons,
} from 'components/forms';
import { useAsyncToast, useDocData, useSafeParams, useWizard } from 'hooks';
import { useFirstRender, usePrevious } from 'hooks/utils';
import { getAll } from 'modules/db';
import {
  combineToAdditionalInterests,
  deepMergeOverwriteArrays,
  dollarFormat,
} from 'modules/utils';
import { createChangeRequest } from 'views/AddLocation';
import { LimitsStep } from './LimitsStep';
import { LocationChangeValues } from './LocationChangeForm';

// TODO: separate out into several steps ?? limits, deductible, additional insureds, request eff date
// display current location values like annual premium ??

export interface LocationChangeFormProps extends FormikConfig<LocationChangeValues> {
  formRef: RefObject<FormikProps<LocationChangeValues>>;
  policyExpirationDate?: Date;
  replacementCost?: number | undefined;
}

const validation = object().shape({
  limits: limitsValidation,
  deductible: deductibleVal,
  requestEffDate: date().required(), // TODO: better validation
  // additionalInterests: TODO
});

export const LocationChangeForm = ({
  initialValues,
  formRef,
  replacementCost,
  onSubmit,
  ...props
}: LocationChangeFormProps) => {
  const { nextStep } = useWizard();

  const handleSubmit = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      try {
        console.log('on submit called');
        await onSubmit(values, bag);
        bag.setSubmitting(false);
        await nextStep();
      } catch (err: any) {
        console.log('ERR: ', err);
        toast.error('Something went wrong. See console for details.');
      }
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
        handleSubmit: FormikHandleSubmit,
      }) => (
        <Form onSubmit={FormikHandleSubmit}>
          <Grid container spacing={5}>
            <Grid xs={12}>
              <Typography variant='h5' gutterBottom>
                Limits
              </Typography>
              <LimitsStep replacementCost={replacementCost} />
            </Grid>
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
                            // county: `${parentField}[${index}].address.countyName`,
                            // latitude: `${parentField}[${index}].address.latitude`,
                            // longitude: `${parentField}[${index}].address.longitude`,
                          },
                          name: `${parentField}[${index}].address.addressLine1`,
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
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid xs={12} sm={6}>
              <Typography sx={{ pb: 4 }}>
                When would you like this change to take affect?
              </Typography>
              <FormikDatePicker
                name='requestEffDate'
                label='Change Date'
                // disable if already enforce
                minDate={undefined} // TODO: disable past ??
                maxDate={undefined}
              />
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
  // does this throw if doc not found ?? need to wrap in error boundary (with reset to reset form)
  const { data } = useDocData<PolicyChangeRequest>('POLICIES', requestId, [
    policyId,
    COLLECTIONS.CHANGE_REQUESTS,
  ]);
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

  // TODO: components should be per location & re-used in add location form (and new policy ??)
  // how should location data be combined ??
  //  1. store all location data (that can be changed) in the change request (limits, deductible, interests, etc.) **** already doing it this way in form 2 --> should update interface Pick<ILocation, 'termPremium' | 'limits' | 'deductible' etc.>
  //  2. fetchAll locations --> zip with changes
  //  3. pass locationID and changes to a component to fetch the location data and stitch changes
  // const lcnChanges = useMemo(
  //   () => merge(data.endorsementChanges || {}, data.amendmentChanges, {}),
  //   [data]
  // );

  const firestore = useFirestore();
  const [locationData, setLocationData] = useState<WithId<ILocation>[]>([]);
  // TODO: loading state ?? use react query ??
  const getLocations = useCallback(async () => {
    try {
      const lcnIds = Object.keys(merge(data.endorsementChanges || {}, data.amendmentChanges, {}));
      let lcns = await getAll<ILocation>(firestore, 'LOCATIONS', lcnIds);
      console.log('locations: ', lcns);

      let lcnData = lcns.docs.map((l) => ({ id: l.id, ...l.data() }));
      setLocationData([...lcnData]);
    } catch (err: any) {
      console.log('Err fetching locations: ', err);
    }
  }, [firestore, data]);

  useFirstRender(() => getLocations());

  const locations = useMemo<WithId<ILocation>[]>(() => {
    let lcnChangesObj = merge(data.endorsementChanges || {}, data.amendmentChanges, {});

    return locationData.map((l) =>
      deepMergeOverwriteArrays(l, lcnChangesObj[l.id] || {})
    ) as WithId<ILocation>[];
  }, [locationData, data]);

  return (
    // TODO: no point of grid if all xs={12}
    <Grid container spacing={5}>
      <Grid xs={12}>
        <Typography variant='h6' align='center'>
          Review
        </Typography>
      </Grid>
      {/* TODO: combine endorsement changes and amendments by location and present as location card w/ premium, limits, additional interests, deductible (requires either storing that info in the change request data or fetching each location. create component that fetching location and accepts value overrides ?? or fetch all locations above & combine data and then map result ??)*/}

      {/* TODO: horizontal Location card - also used in bind quote */}
      {locations.map((l) => (
        <Grid xs={12} key={l.id}>
          <Card sx={{ display: 'flex' }}>
            <CardMedia
              component='img'
              sx={{
                width: { xs: 120, sm: 130, md: 140 },
                minHeight: { xs: 100, sm: 120, md: 140 },
              }}
              alt={`${l?.address?.addressLine1} map`}
              image={l?.imageURLs?.satellite || fallbackImages[0]}
              title={`${l?.address?.addressLine1} map`}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant='h6'>{l.address.addressLine1}</Typography>
                {/* <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
                    {`Effective: ${formatDate(values.effectiveDate, `MMM dd, yy`) || '--'} - ${
                      formatDate(addToDate({ years: 1 }, values.effectiveDate), `MMM dd, yy`) ||
                      '--'
                    }`}
                  </Typography> */}
              </CardContent>
              <Grid
                container
                columnSpacing={{ xs: 2, md: 2 }}
                rowSpacing={1}
                wrap='wrap'
                sx={{ pl: 2, pr: 1, pb: 2 }}
              >
                <Grid xs='auto'>
                  <Tooltip title='Building Coverage Limit' placement='top'>
                    <Chip
                      icon={<HouseRounded />}
                      label={dollarFormat(l.limits?.limitA)}
                      size='small'
                    />
                  </Tooltip>
                </Grid>

                <Grid xs='auto'>
                  <Tooltip title='Additional Structures Coverage Limit' placement='top'>
                    <Chip
                      icon={<FenceRounded />}
                      label={dollarFormat(l.limits?.limitB)}
                      size='small'
                    />
                  </Tooltip>
                </Grid>

                <Grid xs='auto'>
                  <Tooltip title='Contents Coverage Limit' placement='top'>
                    <Chip
                      icon={<WeekendRounded />}
                      label={dollarFormat(l.limits?.limitC)}
                      size='small'
                    />
                  </Tooltip>
                </Grid>

                <Grid xs='auto'>
                  <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                    <Chip
                      icon={<BedRounded />}
                      label={dollarFormat(l.limits.limitD)}
                      size='small'
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      ))}

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
    </Grid>
  );
};

// TODO: render as child of policy route - show policy details above (policy ID, named insured, location Id, etc. above form)

interface ChangeLocationComponentProps {
  changeRequestDocResource: ReturnType<typeof createChangeRequest>;
}

// FEATURES (additional)
//  - wrapper or component displaying policy price from "changeRequest.policyChanges"

export const LocationChangeComponent = ({
  changeRequestDocResource,
}: ChangeLocationComponentProps) => {
  // use policy ID from location data ??
  // const firestore = useFirestore();
  const functions = useFunctions();
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);

  const changeRequestSnap =
    changeRequestDocResource.read() as DocumentReference<LocationChangeRequest>;
  // need change request subscription to initialize form values (or should react-query be used for mutations??)
  const { data: changeRequest } = useFirestoreDocData<LocationChangeRequest>(changeRequestSnap);
  const { data: location } = useDocData<ILocation>('LOCATIONS', locationId);
  const { data: user } = useUser();

  const formRef = useRef<FormikProps<LocationChangeValues>>(null);

  const saveChangeRequest = useCallback(
    async (values: Partial<LocationChangeRequest>) => {
      console.log(`Saving change request ${changeRequestSnap.id}...`);
      await setDoc(
        changeRequestSnap,
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

      if (!reqId) throw new Error('missing change requestId');
      console.log('calcing location changes...');
      const { data: res } = await calcLocationChanges(functions, {
        policyId,
        requestId: reqId,
      });
      console.log('CALC LOCATION CHANGES RES: ', res);
    },
    [functions, user, location, locationId, policyId, saveChangeRequest, changeRequestSnap]
  );

  const handleSubmitChangeRequest = useCallback(async () => {
    console.log('saving...');
    await saveChangeRequest({
      status: 'submitted',
      submittedBy: {
        userId: user?.uid || null,
        displayName: user?.displayName || '',
        email: user?.email || '',
      },
    });
  }, [saveChangeRequest, user]);

  useEffect(() => {
    console.log('change request snap', changeRequestSnap.id);
  }, [changeRequestSnap]);

  return (
    <Container maxWidth='md' sx={{ py: 8 }} disableGutters>
      <Wizard header={<Header />} maxWidth='lg'>
        {/* BUG: need to get initial values from change request instead of location (location values as fallback) */}
        <LocationChangeForm
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
          requestId={changeRequestSnap.id}
          onSubmit={handleSubmitChangeRequest}
        />
        <Box>
          <Typography variant='h4' align='center' sx={{ p: 10 }}>
            Submitted!
          </Typography>
        </Box>
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
      // TODO: pass initial form values to change request ??
      // saves setting initial values from
      setChangeRequestResource(createChangeRequest(policyId));
    }
  }, [policyId, prev, changeRequestResource]);

  if (!changeRequestResource) return null;

  return <LocationChangeComponent changeRequestDocResource={changeRequestResource} />;
};

function Header() {
  return (
    <Typography variant='h6' align='center' sx={{ pb: 4 }}>
      Location Change Request
    </Typography>
  );
}
