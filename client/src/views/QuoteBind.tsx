import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Divider,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import {
  AccountBalanceRounded,
  BedRounded,
  FenceRounded,
  HouseRounded,
  MoreVertRounded,
  PasswordRounded,
  PersonAddAltRounded,
  WeekendRounded,
} from '@mui/icons-material';
import { FormikHelpers, FormikProps, useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, getFirestore, Timestamp, updateDoc } from 'firebase/firestore';
import { RiMastercardFill, RiVisaLine } from 'react-icons/ri';
import { MdPayments } from 'react-icons/md';
import { isEqual } from 'lodash';
import { toast } from 'react-hot-toast';
import { useFirestore, useFirestoreDocData, useSigninCheck } from 'reactfire';
import { startOfToday, endOfToday } from 'date-fns';
import * as yup from 'yup';

import {
  FormikCheckbox,
  FormikDatePicker,
  FormikFieldArray,
  FormikMaskField,
  FormikNativeSelect,
  FormikWizard,
  PhoneMask,
  Step,
} from 'components/forms';
import { IconButtonMenu, LineItem } from 'components';
import {
  contactValidation,
  phoneRequiredVal,
  PaymentMethod,
  Quote,
  WithId,
  AdditionalInterest,
  submissionsQuotesCollection,
  paymentMethodsCollection,
  ANALYTICS_EVENTS,
} from 'common';
import { useAnalyticsEvent, useBindQuote, useUserPaymentMethods } from 'hooks';
import { billingValidation, PaymentStep, ContactStep } from 'elements';
import { addToDate, dollarFormat, formatDate } from 'modules/utils/helpers';
import { AUTH_ROUTES, ROUTES, createPath } from 'router';
import { useAuth } from 'modules/components/AuthContext';
import { fallbackImages } from './PoliciesOld';

// TODO: error boundary & reset: https://blog.logrocket.com/react-error-handling-react-error-boundary/

// TODO: check quote expiration date (30 days for quote creation) -- use cloud function ??
// firestore rules - only allow iDemand admin to override

// TODO: check quote status - dont allow continue if not "awaiting:user"

// TODO: use transform to remove empty additional insured & mortagee rows ??

// quote needs to bind by quote date + 30

export interface QuoteValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agentFirstName: string;
  agentLastName: string;
  agentEmail: string;
  agentPhone: string;
  paymentMethodId: string;
  policyEffectiveDate: Date;
  effectiveExceptionRequested: boolean;
  effectiveExceptionReason: string | null;
  additionalInterests: AdditionalInterest[];
}

export const QuoteBind: React.FC = () => {
  const navigate = useNavigate();
  const { data: signInCheckResult } = useSigninCheck();
  const { quoteId } = useParams();
  if (!quoteId) throw new Error('missing quoteId');

  const firestore = useFirestore();
  const quoteRef = doc(submissionsQuotesCollection(firestore), quoteId);
  const { data } = useFirestoreDocData(quoteRef);
  const logAnalyticsStep = useLogCheckoutProgress(quoteId, 5);

  const formikRef = useRef<FormikProps<QuoteValues>>(null);

  // TODO FINISH BIND QUOTE HOOK
  const bindQuote = useBindQuote(
    (msg: string) => toast.success(msg),
    (err, msg) => toast.error(msg)
  );
  const paymentMethods = useUserPaymentMethods();

  const handleSubmit = useCallback(
    async (values: QuoteValues, { setSubmitting }: FormikHelpers<QuoteValues>) => {
      if (!values.paymentMethodId) return toast.error('Missing payment method');

      const res = await bindQuote(quoteId, values.paymentMethodId);
      setSubmitting(false);

      if (res?.transactionId && (res?.status === 'succeeded' || res?.status === 'processing')) {
        navigate(
          createPath({
            path: ROUTES.QUOTE_BIND_SUCCESS,
            params: { quoteId, transactionId: res?.transactionId || '' },
          })
        );
      }
    },
    [quoteId, bindQuote, navigate]
  );

  const handleCancel = useCallback(() => {
    const navPath = signInCheckResult.signedIn ? createPath({ path: ROUTES.QUOTES }) : '/';
    navigate(navPath);
  }, [navigate, signInCheckResult]);

  const saveValues = useCallback(
    async (values: QuoteValues, bag: any, initialValues: QuoteValues) => {
      // alternative pkg: https://github.com/mattphillips/deep-object-diff
      if (isEqual(values, initialValues)) return values;

      await updateDoc(quoteRef, {
        namedInsured: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        // insuredFirstName: values.firstName,
        // insuredLastName: values.lastName,
        // insuredEmail: values.email,
        // insuredPhone: values.phone,
        // additionalInsureds: values.additionalInsureds || [],
        // mortgageeInterest: values.mortgageeInterest || [],
        additionalInterests: values.additionalInterests || [],
        policyEffectiveDate: Timestamp.fromDate(values.policyEffectiveDate),
        effectiveExceptionRequested: values.effectiveExceptionRequested,
        effectiveExceptionReason: values.effectiveExceptionReason || null,
      });
      return values;
    },
    [quoteRef]
  );

  // TODO handle quote expiration (quoteExpiration)

  // TODO submission needs isAnonymous flag so userId can/should be overwritten ??
  // TODO set agentId if agent not already set ??
  if (!signInCheckResult.signedIn || signInCheckResult.user.isAnonymous || !data.userId) {
    return <AuthStep quoteId={quoteId} />;
  }

  return (
    <Box>
      <Typography variant='h5' sx={{ pl: 4 }} align='center'>
        Bind Quote
      </Typography>
      <FormikWizard
        initialValues={{
          firstName: data?.namedInsured?.firstName ?? '',
          lastName: data?.namedInsured?.lastName ?? '',
          email: data?.namedInsured?.email ?? '',
          phone: data?.namedInsured?.phone ?? '',
          // additionalInsureds: data?.additionalInsureds ? [...data?.additionalInsureds] : [],
          // mortgageeInterest: data?.mortgageeInterest ? [...data?.mortgageeInterest] : [],
          additionalInterests: data?.additionalInterests ? [...data?.additionalInterests] : [],
          policyEffectiveDate: data?.policyEffectiveDate?.toDate() ?? new Date(),
          effectiveExceptionRequested: data?.effectiveExceptionRequested ?? false,
          effectiveExceptionReason: data?.effectiveExceptionReason ?? '',
          paymentMethodId: '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        formRef={formikRef}
        enableReinitialize
        initialErrors={{}}
        submitButtonText='Pay and Bind'
      >
        <Step
          label='Primary Named Insured'
          stepperNavLabel='Insured'
          validationSchema={contactValidation}
          mutateOnSubmit={saveValues}
        >
          <NamedInsuredStep logAnalyticsStep={logAnalyticsStep} />
        </Step>
        <Step label='Additional Interests' stepperNavLabel='+1s' mutateOnSubmit={saveValues}>
          <AdditionalInterestsStep logAnalyticsStep={logAnalyticsStep} />
        </Step>
        <Step
          label='Effective Date'
          stepperNavLabel='Dates'
          validationSchema={effectiveDateValidation}
          // mutateOnSubmit={saveValues}
          mutateOnSubmit={(values: QuoteValues, bag: any, initialValues: QuoteValues) => {
            let mutatedVals = values;
            if (
              values.policyEffectiveDate > addToDate({ days: 15 }) &&
              values.policyEffectiveDate < addToDate({ days: 60 })
            ) {
              mutatedVals.effectiveExceptionReason = '';
              mutatedVals.effectiveExceptionRequested = false;
            }
            console.log('MUTATED VALS: ', mutatedVals);
            return saveValues(mutatedVals, bag, initialValues);
          }}
        >
          <EffectiveDateStep
            expiration={addToDate({ days: 60 })}
            logAnalyticsStep={logAnalyticsStep}
          />
        </Step>
        <Step label='Billing' stepperNavLabel='Billing' validationSchema={billingValidation}>
          <PaymentStep pmtOptions={[...paymentMethods]} logAnalyticsStep={logAnalyticsStep} />
        </Step>
        <Step label='Review' stepperNavLabel='Review'>
          <BindReviewStep data={{ ...data, id: quoteId! }} logAnalyticsStep={logAnalyticsStep} />
        </Step>
      </FormikWizard>
    </Box>
  );
};

// TODO: handle anonymous. handle agent.
export function AuthStep({ quoteId }: { quoteId: string }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAnonymous } = useAuth();

  const redirectToSignIn = useCallback(() => {
    navigate(
      {
        pathname: createPath({ path: AUTH_ROUTES.LOGIN }),
      },
      {
        state: {
          redirectPath: createPath({
            path: AUTH_ROUTES.ACTIONS_HANDLER,
            search: {
              mode: 'assignQuote',
              continueUrl: createPath({ path: ROUTES.QUOTE_BIND, params: { quoteId } }),
              oobCode: quoteId,
            },
          }),
        },
        replace: true,
      }
    );
  }, [navigate, quoteId]);

  const redirectToCreate = useCallback(() => {
    navigate(
      {
        pathname: createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }),
      },
      {
        state: {
          redirectPath: createPath({
            path: AUTH_ROUTES.ACTIONS_HANDLER,
            search: {
              mode: 'assignQuote',
              continueUrl: createPath({ path: ROUTES.QUOTE_BIND, params: { quoteId } }),
              oobCode: quoteId,
            },
          }),
        },
        replace: true,
      }
    );
  }, [navigate, quoteId]);

  const redirectToAssignAction = useCallback(() => {
    navigate(
      createPath({
        path: AUTH_ROUTES.ACTIONS_HANDLER,
        search: {
          mode: 'assignQuote',
          continueUrl: createPath({ path: ROUTES.QUOTE_BIND, params: { quoteId } }),
          oobCode: quoteId,
        },
      }),
      {}
    );
  }, [navigate, quoteId]);

  return (
    <Stack direction='column' spacing={3} sx={{ maxWidth: 360, mx: 'auto', my: 4 }}>
      {isAuthenticated && !isAnonymous && (
        <Button
          variant='outlined'
          size='large'
          onClick={redirectToAssignAction}
          startIcon={<Avatar></Avatar>}
          sx={{
            justifyContent: 'flex-start',
            '& .MuiButton-startIcon': { minWidth: 40 },
            '& .MuiSvgIcon-root': { mx: 'auto' },
          }}
        >{`Continue as ${user?.displayName ?? 'current user'}`}</Button>
      )}
      <Typography>Please sign in or create a new account.</Typography>

      <Button
        variant='outlined'
        size='large'
        onClick={redirectToSignIn}
        startIcon={<PasswordRounded />}
        sx={{
          justifyContent: 'flex-start',
          '& .MuiButton-startIcon': { minWidth: 40 },
          '& .MuiSvgIcon-root': { mx: 'auto' },
        }}
      >
        Sign In
      </Button>
      <Button
        variant='outlined'
        size='large'
        onClick={redirectToCreate}
        startIcon={<PersonAddAltRounded />}
        sx={{
          justifyContent: 'flex-start',
          '& .MuiButton-startIcon': { minWidth: 40 },
          '& .MuiSvgIcon-root': { mx: 'auto' },
        }}
      >
        New User
      </Button>
    </Stack>
  );
}

// https://mui.com/material-ui/react-list/#checkbox
// https://flowbite.com/docs/forms/radio/#radio-in-dropdown

interface LogAnalyticsProp {
  logAnalyticsStep: (step: number, stepName?: string) => void;
}

export function NamedInsuredStep({ logAnalyticsStep }: LogAnalyticsProp) {
  useEffect(() => {
    logAnalyticsStep(0, 'named insured step');
  }, [logAnalyticsStep]);

  return (
    <Box>
      <Typography variant='body2' sx={{ pb: { xs: 3, sm: 4, md: 5 } }}>
        Please enter contact information for the primary named insured (you'll be able to add
        additional insureds later).
      </Typography>
      <ContactStep gridItemProps={{ xs: 12, sm: 6 }}>
        <Grid xs={12} sm={6}>
          <FormikMaskField
            fullWidth
            id='phone'
            name='phone'
            label='Phone'
            required
            maskComponent={PhoneMask}
            formikConfig={{ validate: phoneRequiredVal }}
          />
        </Grid>
      </ContactStep>
    </Box>
  );
}

// TODO: update formikFieldArray to accept props getter function to get names prop
// parent.index.field => parent.index.address.field

// Additional Named Insured. (help line: Additional owners of property)
// Mortgagee (recorded priority lien rights)Additional
// Insured (non-owner with insurance interest in property)

export function AdditionalInterestsStep({ logAnalyticsStep }: LogAnalyticsProp) {
  const { values, errors, touched, dirty, setFieldValue, setFieldTouched, setFieldError } =
    useFormikContext<QuoteValues>();

  useEffect(() => {
    logAnalyticsStep(1, 'addititional named insureds step');
  }, [logAnalyticsStep]);

  return (
    <Box>
      <Typography variant='overline' color='text.secondary'>
        Additional Interest
      </Typography>
      <Typography variant='body2' sx={{ pb: { xs: 3, md: 4 } }}>
        Please add any additional named insureds, such as a relative.
      </Typography>
      <Typography variant='body2' sx={{ pb: { xs: 3, md: 4 } }}>
        If there is a mortgage on the home, your lender may require that you add them as a named
        insured on the policy.
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
                {
                  label: 'Additional Named Insured',
                  value: 'additional_named_insured',
                },
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
    </Box>
  );
}

// TODO: expiration date (handle expired quotes)
// don't allow effective date to be after expiration
// BUG: load form when eff excp req = true, then turn it off and select valid date ==> validation fails

const minDate = addToDate({ days: 15 }, startOfToday());
const maxDate = addToDate({ days: 60 }, endOfToday());

// quote good for: quote date + 60

const effectiveDateValidation = yup.object().shape({
  effectiveExceptionRequested: yup.boolean(),
  policyEffectiveDate: yup.date().when('effectiveExceptionRequested', {
    is: true,
    then: yup.date().min(new Date(), 'Effective cannot be in the past'),
    otherwise: yup
      .date() // addToDate({ days: 15 })
      .min(minDate, 'Effective date must be at least 15 days from binding coverage')
      .max(maxDate, 'Effective date must be within 60 days of binding coverage'),
  }),
  effectiveExceptionReason: yup.string().when('effectiveExceptionRequested', {
    is: true,
    then: yup.string().required('Please select an option'),
    otherwise: yup.string().notRequired(),
  }),
});

export interface EffectiveDateStepProp extends LogAnalyticsProp {
  expiration?: Date | null;
}

export const EffectiveDateStep: React.FC<EffectiveDateStepProp> = ({
  expiration,
  logAnalyticsStep,
}) => {
  const { values } = useFormikContext<QuoteValues>();

  useEffect(() => {
    logAnalyticsStep(2, 'effective date step');
  }, [logAnalyticsStep]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          maxWidth: 400,
          mx: 'auto',
          py: 3,
        }}
      >
        <Typography gutterBottom>Please select an effective date for the policy.</Typography>
        <Typography variant='body2' gutterBottom sx={{ pt: 2, pb: 8, color: 'text.secondary' }}>
          The date must be at least 15 days from binding policy and within 60 days from the initial
          quote.
        </Typography>
        <FormikDatePicker
          name='policyEffectiveDate'
          label='Effective Date'
          minDate={values.effectiveExceptionRequested ? undefined : addToDate({ days: 15 })}
          // maxDate={values.effectiveExceptionRequested ? undefined : expiration}
          maxDate={expiration}
          disablePast={true}
          slotProps={{
            shortcuts: {
              items: [
                {
                  label: '15 days',
                  getValue: () => {
                    return addToDate({ days: 15 });
                  },
                },
                {
                  label: '30 days',
                  getValue: () => {
                    return addToDate({ days: 30 });
                  },
                },
                {
                  label: '45 days',
                  getValue: () => {
                    return addToDate({ days: 45 });
                  },
                },
              ],
            },
          }}
        />
        <Box sx={{ pl: 4, pb: 2, pt: 1 }}>
          <FormikCheckbox
            name='effectiveExceptionRequested'
            label='Request exception to the 15-60 day window'
            componentsProps={{
              typography: { variant: 'body2' },
            }}
          />
        </Box>

        <Collapse in={values.effectiveExceptionRequested}>
          <Box sx={{ py: 3 }}>
            <FormikNativeSelect
              name='effectiveExceptionReason'
              label='Reason for exception'
              selectOptions={[
                {
                  label: 'Already have policy, transfer to new home',
                  value: 'selling_and_transfer',
                },
                {
                  label: 'New home, required for closing',
                  value: 'new_home_lender_required',
                },
              ]}
            />
            <Typography variant='body2' gutterBottom sx={{ py: 2, color: 'text.secondary' }}>
              Please select a new effective date above. The 15-60 day validation is disabled.
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const getPaymentIcon = (pmtType: any, color: any) => {
  const sizeProps = { size: 28, style: { fill: color } };
  switch (pmtType) {
    case 'MasterCard':
      return <RiMastercardFill {...sizeProps} />;
    case 'Visa':
      return <RiVisaLine {...sizeProps} />;
    case 'Ach':
      return (
        <AccountBalanceRounded sx={{ fontSize: sizeProps.size, color: sizeProps.style.fill }} />
        // <div style={{ fontSize: sizeProps.size, ...sizeProps.style}}>
        // <AccountBalanceRounded fontSize='inherit' />
        // </div>
      );
    default:
      return <MdPayments {...sizeProps} />;
  }
};

export const useCardDetails = (id: string) => {
  const { user } = useAuth();
  const [cardDetails, setCardDetails] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !user.uid) return;
    setError(null);
    setLoading(true);
    // const paymentMethodsCollection = (userId: string) =>
    //   collection(
    //     getFirestore(),
    //     COLLECTIONS.SUBMISSIONS_QUOTES,
    //     userId,
    //     COLLECTIONS.PAYMENT_METHODS
    //   ) as CollectionReference<PaymentMethod>;
    const docRef = doc(paymentMethodsCollection(getFirestore(), user.uid), id);
    getDoc(docRef).then((snap) => {
      if (!snap.exists()) {
        setLoading(false);
        setCardDetails(null);
        setError(`Payment method not found`);
      } else {
        setCardDetails(snap.data());
        setLoading(false);
      }
    });
  }, [user, id]);

  return useMemo(() => ({ cardDetails, loading, error }), [cardDetails, loading, error]);
};

export interface PaymentCardProps {
  // id: string;
  cardDetails: PaymentMethod | null;
  loading: boolean;
  error: string | null;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ cardDetails, loading, error }) => {
  const theme = useTheme();
  // const { cardDetails, loading, error } = useCardDetails(id);

  if (loading)
    return (
      <Box sx={{ display: 'flex', maxWidth: 400, p: 2, width: '100%' }}>
        <Skeleton variant='circular' height={50} width={50} />
        <Box sx={{ pl: 2, flex: '1 1 auto' }}>
          <Skeleton variant='rounded' width='100%' height={20} />
          <Skeleton variant='text' width={100} sx={{ fontSize: '1rem' }} />
        </Box>
      </Box>
    );

  return (
    <Card sx={{ display: 'flex', maxWidth: 400 }}>
      <Box
        sx={{
          m: 2,
          p: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.primaryDark[800]
              : theme.palette.grey[100],
          minHeight: 50,
          minWidth: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 1,
        }}
      >
        {getPaymentIcon(cardDetails?.transactionType, theme.palette.grey[500])}
      </Box>
      <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
        <Typography variant='subtitle2'>
          {error
            ? 'Error loading payment method details'
            : `${cardDetails?.transactionType}  ${cardDetails?.maskedAccountNumber}`}
        </Typography>

        <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
          {cardDetails?.expiration ?? cardDetails?.accountHolder}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pl: 1 }}>
        <IconButtonMenu
          menuItems={[{ label: 'Details', action: () => console.log('button clicked') }]}
          menuProps={{
            id: 'payment-menu',
            anchorOrigin: { horizontal: 'right', vertical: 'center' },
          }}
          iconButtonProps={{
            color: 'default',
            'aria-label': 'payment method menu',
            size: 'small',
          }}
          buttonIcon={<MoreVertRounded fontSize='inherit' />}
        />
      </Box>
    </Card>
  );
};

// TODO: epay fees

interface BindReviewStepProps extends LogAnalyticsProp {
  data: WithId<Quote>;
}

export function BindReviewStep({ data, logAnalyticsStep }: BindReviewStepProps) {
  const { values } = useFormikContext<QuoteValues>();
  const { cardDetails, loading, error } = useCardDetails(values.paymentMethodId);

  useEffect(() => {
    logAnalyticsStep(3, 'bind quote review step');
  }, [logAnalyticsStep]);

  const total = useMemo(() => {
    const { quoteTotal, cardFee } = data;
    if (!cardDetails || !quoteTotal) return null;
    let t: number = quoteTotal;
    if (cardFee && typeof cardFee === 'number' && cardDetails.type === 'card') {
      t += cardFee;
    }
    return t;
  }, [cardDetails, data]);
  // TODO: handle quoteTotal undefined

  // TODO: ePay fees. Fetch payment method details in this component & pass to card component (need "type" to show epay fees)
  if (!total) return <div>Loading...</div>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 4,
        }}
      >
        <Typography variant='overline' color='text.secondary'>
          Locations
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          fontWeight='regular'
          sx={{ fontSize: '0.8rem' }}
        >
          1 location
        </Typography>
      </Box>
      <Card sx={{ display: 'flex' }}>
        <CardMedia
          component='img'
          sx={{
            width: { xs: 120, sm: 130, md: 140 }, // 140,
            minHeight: { xs: 100, sm: 120, md: 140 },
          }}
          alt={`${data?.address?.addressLine1} map`}
          image={
            data?.imageUrls?.satelliteMapImageUrl
              ? data.imageUrls?.satelliteMapImageUrl
              : fallbackImages[0]
          }
          title={`${data?.address?.addressLine1} map`}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography variant='h6'>{data.address.addressLine1}</Typography>
            <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
              {`Effective: ${formatDate(values.policyEffectiveDate, `MMM dd, yy`) || '--'} - ${
                formatDate(addToDate({ years: 1 }, values.policyEffectiveDate), `MMM dd, yy`) ||
                '--'
              }`}
            </Typography>
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
                  label={dollarFormat(data.limits?.limitA)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Additional Structures Coverage Limit' placement='top'>
                <Chip
                  icon={<FenceRounded />}
                  label={dollarFormat(data.limits?.limitB)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Contents Coverage Limit' placement='top'>
                <Chip
                  icon={<WeekendRounded />}
                  label={dollarFormat(data.limits?.limitC)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                <Chip icon={<BedRounded />} label={dollarFormat(data.limits.limitD)} size='small' />
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Card>
      <Divider sx={{ my: 3 }} />
      <Typography variant='overline' color='text.secondary' sx={{ ml: 4 }}>
        Billing
      </Typography>
      {/* <PaymentCard id={values.paymentMethodId} /> */}
      <PaymentCard cardDetails={cardDetails} loading={loading} error={error} />
      <Box sx={{ py: 5 }}>
        <LineItem label='Premium' value={data.annualPremium} />
        {data.fees.map((fee) => (
          <LineItem
            key={`${fee.feeName}-${fee.feeValue}`}
            label={fee.feeName}
            value={fee.feeValue}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {data.taxes.map((tax) => (
          <LineItem
            key={`${tax.displayName}-${tax.value}`}
            label={tax.displayName}
            value={tax.value}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {cardDetails && cardDetails.type === 'card' && (
          <LineItem
            label='Card processing fees (3.5%)'
            value={data.cardFee}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        )}
        <LineItem label='Total' value={total} withDivider={false} />
      </Box>
      {data.notes && data.notes.length > 0 && (
        <Box>
          <Divider sx={{ my: 3 }} />
          <Typography sx={{ py: 2 }}>Underwriter Notes</Typography>
          {data.notes.map(({ note }) => (
            <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
              {note}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

function useLogCheckoutProgress(quoteId: string, stepCount: number) {
  const [steps, setSteps] = useState(Array(stepCount).fill(false));
  // const { quoteId } = useParams();
  const logEvent = useAnalyticsEvent();

  const logStep = useCallback(
    (step: number, stepName?: string) => {
      const hasBeenLogged = !!steps[step];
      if (hasBeenLogged || !quoteId) return;

      logEvent(ANALYTICS_EVENTS.CHECKOUT_PROGRESS, {
        checkout_step: step,
        quoteId: quoteId,
        page_location: window.location.href,
        page_path: window.location.pathname,
        stepName,
      });

      setSteps((prev) => {
        const newVal = [...prev];
        newVal[step] = true;
        return newVal;
      });
    },
    [logEvent, quoteId, steps]
  );

  return logStep;
}
// useEffect(() => {
//   let eventLogged = false;
//   if (eventLogged || !quoteId) return;

//   logEvent(ANALYTICS_EVENTS.CHECKOUT_PROGRESS, {
//     checkout_step: 1,
//     quoteId: quoteId,
//     page_location: window.location.href,
//     page_path: window.location.pathname,
//   });
//   eventLogged = true;

//   return () => {
//     eventLogged = false;
//   };
// }, [quoteId]);
