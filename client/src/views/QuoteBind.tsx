import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
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
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { RiMastercardFill, RiVisaLine } from 'react-icons/ri';
import { MdPayments } from 'react-icons/md';
import { isEqual } from 'lodash';
import { toast } from 'react-hot-toast';
import { useFirestore, useFirestoreDocData, useSigninCheck, useUser } from 'reactfire';
import { startOfDay, endOfDay } from 'date-fns';
import * as yup from 'yup';

import {
  FormikCheckbox,
  FormikDatePicker,
  FormikFieldArray,
  FormikMaskField,
  FormikNativeSelect,
  FormikWizard,
  Step,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { IconButtonMenu, LineItem } from 'components';
import {
  namedInsuredValidationNested,
  phoneRequiredVal,
  PaymentMethod,
  Quote,
  WithId,
  AdditionalInterest,
  quotesCollection,
  paymentMethodsCollection,
  ANALYTICS_EVENTS,
  NamedInsuredDetails,
  AgentDetails,
  fallbackImages,
  Product,
} from 'common';
import { useAnalyticsEvent, useBindQuote, useUserPaymentMethods } from 'hooks';
import { billingValidation, PaymentStep, ContactStep } from 'elements/forms';
import {
  addToDate,
  dollarFormat,
  formatDate,
  getDateShortcuts,
  stringAvatar,
} from 'modules/utils/helpers';
import { useAuth } from 'context/AuthContext';
import { AUTH_ROUTES, ROUTES, createPath } from 'router';
import { TimeManagementSVG } from 'assets/images';

// TODO: error boundary & reset: https://blog.logrocket.com/react-error-handling-react-error-boundary/

// TODO: check quote expiration date (30 days from quote creation) -- use cloud function ??
// firestore rules - only allow iDemand admin to override
// check quote expiration date on mount

// TODO: check quote status - dont allow continue if not "awaiting:user"

const policyEffShortcuts = getDateShortcuts([15, 30, 60]);

export interface BindQuoteValues {
  namedInsured: Omit<NamedInsuredDetails, 'userId'>;
  agent: AgentDetails;
  paymentMethodId: string;
  effectiveDate: Date;
  effectiveExceptionRequested: boolean;
  effectiveExceptionReason: string | null;
  additionalInterests: AdditionalInterest[];
}

export const QuoteBind = () => {
  const navigate = useNavigate();
  const { data: signInCheckResult } = useSigninCheck();
  const { quoteId } = useParams();
  if (!quoteId) throw new Error('missing quoteId');

  const firestore = useFirestore();
  const quoteRef = doc(quotesCollection(firestore), quoteId);
  const { data } = useFirestoreDocData(quoteRef);
  const logAnalyticsStep = useLogCheckoutProgress(quoteId, 5);

  const minEffDate = addToDate(
    { days: 15 },
    startOfDay(data.quotePublishedDate?.toDate() || new Date())
  );
  const maxEffDate = addToDate(
    { days: 60 },
    endOfDay(data.quotePublishedDate?.toDate() || new Date())
  );

  const formikRef = useRef<FormikProps<BindQuoteValues>>(null);

  // TODO FINISH BIND QUOTE HOOK
  const bindQuote = useBindQuote(
    (msg: string) => toast.success(msg),
    (err: any, msg: string) => toast.error(msg)
  );
  const paymentMethods = useUserPaymentMethods();

  const handleSubmit = useCallback(
    async (values: BindQuoteValues, { setSubmitting }: FormikHelpers<BindQuoteValues>) => {
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
    async (values: BindQuoteValues, bag: any, initialValues: BindQuoteValues) => {
      // alternative pkg: https://github.com/mattphillips/deep-object-diff
      if (isEqual(values, initialValues)) return values;

      await updateDoc(quoteRef, {
        namedInsured: {
          firstName: values.namedInsured?.firstName || '',
          lastName: values.namedInsured?.lastName || '',
          email: values.namedInsured?.email || '',
          phone: values.namedInsured?.phone || '',
        },
        additionalInterests: values.additionalInterests || [],
        effectiveDate: Timestamp.fromDate(values.effectiveDate),
        effectiveExceptionRequested: values.effectiveExceptionRequested,
        effectiveExceptionReason: values.effectiveExceptionReason || null,
      });
      return values;
    },
    [quoteRef]
  );

  const isExpired = data.quoteExpirationDate?.toMillis() < new Date().getTime();

  if (isExpired) {
    return (
      <QuoteExpired productId={data.product} expiredDate={data.quoteExpirationDate.toDate()} />
    );
  }

  // TODO submission needs isAnonymous flag so userId can/should be overwritten ??
  // TODO set agentId if agent not already set ??

  // force sign in & set userId for quote (unless current user is agent)
  if (!signInCheckResult.signedIn || signInCheckResult.user.isAnonymous || !data?.userId) {
    // current user is not agent --> auth step & set userId
    if (data?.agent?.userId && data?.agent?.userId !== signInCheckResult.user?.uid)
      return <AuthStep quoteId={quoteId} />;
  }

  return (
    <Box>
      <Typography variant='h5' sx={{ pl: 4 }} align='center'>
        Bind Quote
      </Typography>
      <FormikWizard
        initialValues={{
          namedInsured: {
            firstName: data?.namedInsured?.firstName ?? '',
            lastName: data?.namedInsured?.lastName ?? '',
            email: data?.namedInsured?.email ?? '',
            phone: data?.namedInsured?.phone ?? '',
          },
          // additionalInsureds: data?.additionalInsureds ? [...data?.additionalInsureds] : [],
          // mortgageeInterest: data?.mortgageeInterest ? [...data?.mortgageeInterest] : [],
          additionalInterests: data?.additionalInterests ? [...data?.additionalInterests] : [],
          effectiveDate: data?.effectiveDate?.toDate() ?? new Date(),
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
          validationSchema={namedInsuredValidationNested}
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
          validationSchema={getEffectiveDateValidation(minEffDate, maxEffDate)}
          mutateOnSubmit={(values: BindQuoteValues, bag: any, initialValues: BindQuoteValues) => {
            let mutatedVals = values;
            if (values.effectiveDate > minEffDate && values.effectiveDate < maxEffDate) {
              mutatedVals.effectiveExceptionReason = '';
              mutatedVals.effectiveExceptionRequested = false;
            }

            return saveValues(mutatedVals, bag, initialValues);
          }}
        >
          <EffectiveDateStep
            minEffDate={minEffDate}
            maxEffDate={maxEffDate}
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

interface QuoteExpiredProps {
  productId: Product;
  expiredDate: Date;
}
// TODO: use component or just disable old quote button and put "expired" stamp on it ? prompt to create a new quote
function QuoteExpired({ productId, expiredDate }: QuoteExpiredProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 5 }}>
      <Typography variant='h5' align='center' gutterBottom>
        Quote Expired
      </Typography>
      <Typography variant='subtitle2' color='text.secondary' align='center' gutterBottom>
        {formatDate(expiredDate)}
      </Typography>
      <Box sx={{ py: 5, height: { xs: 60, sm: 80, md: 100 }, width: '100%' }}>
        <TimeManagementSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={() =>
            navigate(createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId } }))
          }
          variant='contained'
        >
          Start a new Quote
        </Button>
      </Box>
    </Box>
  );
}

// TODO: handle anonymous. handle agent.
export function AuthStep({ quoteId }: { quoteId: string }) {
  const navigate = useNavigate();
  const { user, isSignedIn, isAnonymous } = useAuth();

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
      {isSignedIn && !isAnonymous && (
        <Button
          variant='outlined'
          size='large'
          onClick={redirectToAssignAction}
          startIcon={
            user?.displayName ? <Avatar {...stringAvatar(user?.displayName)} /> : <Avatar />
          }
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
      <ContactStep
        gridItemProps={{ xs: 12, sm: 6 }}
        nameMapping={{
          firstName: 'namedInsured.firstName',
          lastName: 'namedInsured.lastName',
          email: 'namedInsured.email',
        }}
      >
        <Grid xs={12} sm={6}>
          <FormikMaskField
            fullWidth
            id='namedInsured.phone'
            name='namedInsured.phone'
            label='Phone'
            required
            // maskComponent={PhoneMask}
            maskComponent={IMask}
            inputProps={{ maskProps: phoneMaskProps }}
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
    useFormikContext<BindQuoteValues>();

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
                // {
                //   label: 'Additional Named Insured',
                //   value: 'additional_named_insured',
                // },
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

// BUG: load form when eff excp req = true, then turn it off and select valid date ==> validation fails

const getEffectiveDateValidation = (minEffDate: Date, maxEffDate: Date) =>
  yup.object().shape({
    effectiveExceptionRequested: yup.boolean(),
    effectiveDate: yup.date().when('effectiveExceptionRequested', {
      is: true,
      then: yup.date().min(new Date(), 'Effective cannot be in the past'),
      otherwise: yup
        .date() // addToDate({ days: 15 })
        .min(minEffDate, 'Effective date must be at least 15 days from binding coverage')
        .max(maxEffDate, 'Effective date must be within 60 days of binding coverage'),
    }),
    effectiveExceptionReason: yup.string().when('effectiveExceptionRequested', {
      is: true,
      then: yup.string().required('Please select an option'),
      otherwise: yup.string().notRequired(),
    }),
  });

export interface EffectiveDateStepProp extends LogAnalyticsProp {
  minEffDate?: Date | null;
  maxEffDate?: Date | null;
}

export const EffectiveDateStep = ({
  minEffDate,
  maxEffDate,
  logAnalyticsStep,
}: EffectiveDateStepProp) => {
  const { values } = useFormikContext<BindQuoteValues>();

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
          name='effectiveDate'
          label='Effective Date'
          minDate={values.effectiveExceptionRequested ? undefined : minEffDate || undefined}
          // maxDate={values.effectiveExceptionRequested ? undefined : expiration}
          maxDate={maxEffDate}
          disablePast={true}
          slotProps={{
            shortcuts: {
              items: policyEffShortcuts,
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
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [cardDetails, setCardDetails] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !user.uid) return;
    setError(null);
    setLoading(true);

    const docRef = doc(paymentMethodsCollection(firestore, user.uid), id);

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
  }, [user, firestore, id]);

  return useMemo(() => ({ cardDetails, loading, error }), [cardDetails, loading, error]);
};

export interface PaymentCardProps {
  // id: string;
  cardDetails: PaymentMethod | null;
  loading: boolean;
  error: string | null;
}

export const PaymentCard = ({ cardDetails, loading, error }: PaymentCardProps) => {
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
  const { values } = useFormikContext<BindQuoteValues>();
  const { cardDetails, loading, error } = useCardDetails(values.paymentMethodId);

  // console.log('quote data: ', data);

  useEffect(() => {
    logAnalyticsStep(3, 'bind quote review step');
  }, [logAnalyticsStep]);

  const total = useMemo(() => {
    const { quoteTotal, cardFee } = data;
    if (!cardDetails || !quoteTotal) return null;

    let t: number = quoteTotal;
    if (cardFee && typeof cardFee === 'number' && cardDetails.type === 'card') t += cardFee;

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
          image={data?.imageURLs?.satellite || fallbackImages[0]}
          title={`${data?.address?.addressLine1} map`}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography variant='h6'>{data.address.addressLine1}</Typography>
            <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
              {`Effective: ${formatDate(values.effectiveDate, `MMM dd, yy`) || '--'} - ${
                formatDate(addToDate({ years: 1 }, values.effectiveDate), `MMM dd, yy`) || '--'
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
