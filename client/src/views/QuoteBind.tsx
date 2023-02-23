import React, { useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Container,
  Divider,
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
  PersonAddAltRounded,
  WeekendRounded,
} from '@mui/icons-material';
import { FormikHelpers, FormikProps, useFormikContext } from 'formik';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { RiMastercardFill, RiVisaLine } from 'react-icons/ri';
import { MdPayments } from 'react-icons/md';
import { isEqual } from 'lodash';

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
import { IconButtonMenu } from 'components';
import {
  submissionsQuotesCollection,
  contactValidation,
  phoneRequiredVal,
  AdditionalInsured,
  Mortgagee,
} from 'common';
import { SubmissionQuoteDataWithId } from './admin/Quotes';
import { useBindQuote, useUserPaymentMethods } from 'hooks';
import { billingValidation, PaymentStep, ContactStep } from 'elements';
import testImg from 'assets/images/live-from-space.jpg';
import { addToDate } from 'modules/utils/helpers';

// TODO: create account / sign in
//    - wrap component in require auth. redirect to bind quote after sign in or create account
//    - OR contitional create account step ??
// TODO: check quote expiration date (30 days for quote creation) -- use cloud function ??
// firestore rules - only allow iDemand admin to override

// TODO: use transform to remove empty additional insured & mortagee rows ??
// 'Password': yup.string().notRequired().min(8).nullable().transform((value) => !!value ? value : null)

// TODO: AFTER CREATE ACCOUNT
// redirect to authRequests/assign-quote/:quoteId cloud function

export const quoteLoader = async ({ params }: LoaderFunctionArgs) => {
  const quoteRef = doc(submissionsQuotesCollection, params.quoteId);

  const snap = await getDoc(quoteRef);
  let data = snap.data();
  console.log('QUOTE DATA: ', data);

  if (!snap.exists() || !data) {
    throw new Response('Quote not found', { status: 404 });
  }

  return { ...data, id: snap.id };
};

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
  // insuredFirstName: string;
  // insuredLastName: string;
  // insuredEmail: string;
  // insuredPhone: string;
  additionalInsureds: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
}

export const QuoteBind: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as SubmissionQuoteDataWithId;
  const formikRef = useRef<FormikProps<QuoteValues>>(null);
  // TODO: FINISH BIND QUOTE HOOK
  const bindQuote = useBindQuote();
  const paymentMethods = useUserPaymentMethods();

  const handleSubmit = useCallback(
    async (values: QuoteValues, { setSubmitting }: FormikHelpers<QuoteValues>) => {
      await bindQuote(data.id);
      setSubmitting(false);
    },
    [bindQuote, data]
  );

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const saveValues = useCallback(
    async (values: QuoteValues, bag: any, initialValues: QuoteValues) => {
      // alternative pkg: https://github.com/mattphillips/deep-object-diff
      if (isEqual(values, initialValues)) return values;

      const ref = doc(submissionsQuotesCollection, data.id);

      await updateDoc(ref, {
        insuredFirstName: values.firstName,
        insuredLastName: values.lastName,
        insuredEmail: values.email,
        insuredPhone: values.phone,
        additionalInsureds: values.additionalInsureds || [],
        mortgageeInterest: values.mortgageeInterest || [],
        policyEffectiveDate: Timestamp.fromDate(values.policyEffectiveDate),
        effectiveExceptionRequested: values.effectiveExceptionRequested,
        effectiveExceptionReason: values.effectiveExceptionReason || null,
      });
      return values;
    },
    [data]
  );
  const test = useCallback(async () => {
    try {
      navigate(`/auth-api/assign-quote/${data.id}`);
    } catch (err) {
      console.log(err);
    }
  }, [navigate, data]);

  return (
    <Container maxWidth='sm'>
      <Button onClick={test}>Test</Button>
      <Typography variant='h5' sx={{ pl: 4 }} align='center'>
        Bind Quote
      </Typography>
      <FormikWizard
        initialValues={{
          firstName: data?.insuredFirstName ?? '',
          lastName: data?.insuredLastName ?? '',
          email: data?.insuredEmail ?? '',
          phone: data?.insuredPhone ?? '',
          additionalInsureds: data?.additionalInsureds ? [...data?.additionalInsureds] : [],
          mortgageeInterest: data?.mortgageeInterest ? [...data?.mortgageeInterest] : [],
          policyEffectiveDate: data?.policyEffectiveDate?.toDate() ?? new Date(),
          effectiveExceptionRequested: data?.effectiveExceptionRequested ?? false,
          effectiveExceptionReason: data?.effectiveExceptionReason ?? null,
          paymentMethodId: '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        formRef={formikRef}
        enableReinitialize
        initialErrors={{}}
        submitButtonText='Complete payment'
      >
        <Step
          label='Primary Named Insured'
          stepperNavLabel='Insured'
          validationSchema={contactValidation}
          mutateOnSubmit={saveValues}
        >
          <NamedInsuredStep />
        </Step>
        <Step label='Additional Insured' stepperNavLabel='Additional' mutateOnSubmit={saveValues}>
          <AdditionalInsuredsStep />
        </Step>
        <Step
          label='Effective Date'
          stepperNavLabel='Dates'
          // validationSchema={contactValidation}
          mutateOnSubmit={saveValues}
        >
          <EffectiveDateStep expiration={addToDate({ days: 90 })} />
        </Step>
        <Step label='Billing' stepperNavLabel='Billing' validationSchema={billingValidation}>
          <PaymentStep pmtOptions={[...paymentMethods]} />
        </Step>
        <Step label='Review' stepperNavLabel='Review'>
          <BindReviewStep />
        </Step>
      </FormikWizard>
    </Container>
  );
};

// https://mui.com/material-ui/react-list/#checkbox
// https://flowbite.com/docs/forms/radio/#radio-in-dropdown

export function NamedInsuredStep() {
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

export function AdditionalInsuredsStep() {
  const { values, errors, touched, dirty, setFieldValue, setFieldTouched, setFieldError } =
    useFormikContext<QuoteValues>();

  return (
    <Box>
      <Typography variant='overline' color='text.secondary'>
        Additional Interest
      </Typography>
      <Typography variant='body2' sx={{ pb: { xs: 3, md: 4 } }}>
        Please add any additional named insureds, such as a relative.
      </Typography>
      <Box
        sx={{
          maxHeight: 340,
          overflowY: 'auto',
          my: 4,
          p: 2,
          border: (theme) =>
            `1px solid ${
              values.additionalInsureds.length > 0 ? theme.palette.divider : 'transparent'
            }`,
          borderRadius: 1,
        }}
      >
        <FormikFieldArray
          parentField='additionalInsureds'
          inputFields={[
            {
              name: 'name',
              label: 'Name',
              // required: true,
              required: false,
              inputType: 'text',
            },
            {
              name: 'email',
              label: 'Email',
              // required: true,
              required: false,
              inputType: 'text',
            },
            {
              name: 'relation',
              label: 'Relation',
              // required: true,
              required: false,
              inputType: 'select',
              selectOptions: [
                {
                  label: 'Additional Insured',
                  value: 'additional insured',
                },
                { label: 'Other', value: 'other' },
              ],
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
          addButtonText='Add additional insured'
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
      <Divider sx={{ my: 3 }} />
      <Typography variant='overline' color='text.secondary'>
        Morgagee Interest
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
              values.additionalInsureds.length > 0 ? theme.palette.divider : 'transparent'
            }`,
          borderRadius: 1,
        }}
      >
        <FormikFieldArray
          parentField='mortgageeInterest'
          inputFields={[
            {
              name: 'company',
              label: 'Mortgage Company',
              required: false,
              inputType: 'text',
            },
            {
              name: 'contactName',
              label: 'Contact Name',
              required: false,
              inputType: 'text',
            },
            {
              name: 'contactEmail',
              label: 'Contact Email',
              required: false,
              inputType: 'text',
            },
            {
              name: 'address.addressLine1',
              label: 'Mailing Address',
              required: false,
              inputType: 'address',
              gridProps: { xs: 12, sm: 8 },
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
            {
              name: 'priority',
              label: 'Priority Position (lean)',
              required: false,
              inputType: 'select',
              selectOptions: [
                {
                  label: '1st',
                  value: '1',
                },
                { label: '2nd', value: '2' },
                { label: '3rd', value: '3' },
                { label: 'Other', value: '-1' },
              ],
              gridProps: { xs: 6, sm: 4 },
            },
            {
              name: 'loanNumber',
              label: 'Loan Number',
              required: false,
              inputType: 'text',
            },
          ]}
          addButtonText='Add Morgagee'
          addButtonProps={{ startIcon: <AccountBalanceRounded /> }}
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

export interface EffectiveDateStepProp {
  expiration?: Date | null;
}

export const EffectiveDateStep: React.FC<EffectiveDateStepProp> = ({ expiration }) => {
  const { values } = useFormikContext<QuoteValues>();

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
          maxDate={values.effectiveExceptionRequested ? undefined : expiration}
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

export function BindReviewStep() {
  const theme = useTheme();

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
            width: 140,
            // borderBottomRightRadius: (theme) => theme.shape.borderRadius,
            // borderTopRightRadius: (theme) => theme.shape.borderRadius,
          }}
          src={testImg}
          alt='Live from space album cover'
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography variant='h6'>1382 Hunter Drive</Typography>
            <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
              Effective 2/23 - 2/24
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
                <Chip icon={<HouseRounded />} label='$150,000' size='small' />
              </Tooltip>
            </Grid>
            <Grid xs='auto'>
              <Tooltip title='Additional Structures Coverage Limit' placement='top'>
                <Chip icon={<FenceRounded />} label='$25,000' size='small' />
              </Tooltip>
            </Grid>
            <Grid xs='auto'>
              <Tooltip title='Contents Coverage Limit' placement='top'>
                <Chip icon={<WeekendRounded />} label='$50,000' size='small' />
              </Tooltip>
            </Grid>
            <Grid xs='auto'>
              <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                <Chip icon={<BedRounded />} label='$15,000' size='small' />
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Card>
      <Divider sx={{ my: 3 }} />
      <Typography variant='overline' color='text.secondary' sx={{ ml: 4 }}>
        Billing
      </Typography>
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
          {/* <AccountBalanceRounded /> */}
          {/* <RiMastercardFill size={28} style={{ fill: theme.palette.grey[500] }} /> */}
          {getPaymentIcon('MasterCard', theme.palette.grey[500])}
        </Box>
        <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
          <Typography variant='subtitle2'>{`${'MasterCard'} **** **** **** 9827`}</Typography>
          <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
            Expires 12/24
          </Typography>
        </CardContent>
        <Box sx={{ p: 2, pl: 1 }}>
          {/* <IconButton onClick={openPaymentDialog}>
            <MoreVertRounded fontSize='small' />
          </IconButton> */}
          <IconButtonMenu
            menuItems={[{ label: 'Test', action: () => console.log('button clicked') }]}
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
          {getPaymentIcon('Visa', theme.palette.grey[500])}
        </Box>
        <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
          <Typography variant='subtitle2'>Visa **** **** **** 9827</Typography>
          <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
            Expires 12/24
          </Typography>
        </CardContent>
        <Box sx={{ p: 2, pl: 1 }}>
          <IconButtonMenu
            menuItems={[{ label: 'Test', action: () => console.log('button clicked') }]}
            menuProps={{
              id: 'payment-menu',
              anchorOrigin: { horizontal: 'right', vertical: 'center' },
            }}
            iconButtonProps={{ color: 'default', 'aria-label': 'payment method menu' }}
            buttonIcon={<MoreVertRounded fontSize='small' />}
          />
        </Box>
      </Card>
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
          {getPaymentIcon('Ach', theme.palette.grey[500])}
        </Box>
        <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
          <Typography variant='subtitle2'>Visa **** **** **** 9827</Typography>
          <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
            Expires 12/24
          </Typography>
        </CardContent>
        <Box sx={{ p: 2, pl: 1 }}>
          <IconButtonMenu
            menuItems={[{ label: 'Test', action: () => console.log('button clicked') }]}
            menuProps={{
              id: 'payment-menu',
              anchorOrigin: { horizontal: 'right', vertical: 'center' },
            }}
            iconButtonProps={{ color: 'default', 'aria-label': 'payment method menu' }}
            buttonIcon={<MoreVertRounded fontSize='small' />}
          />
        </Box>
      </Card>
      <Box sx={{ py: 5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            py: 1,
            px: 3,
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ flex: '1 0 auto', lineHeight: 1.6 }}
          >
            Premium
          </Typography>
          <Typography variant='subtitle2' sx={{ flex: '0 0 auto', lineHeight: 1.6 }}>
            $239.00
          </Typography>
        </Box>
        <Divider />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            py: 1,
            px: 3,
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ flex: '1 0 auto', lineHeight: 1.6, ml: 4 }}
          >
            Inspection Fee
          </Typography>
          <Typography
            variant='subtitle2'
            fontWeight='regular'
            color='text.secondary'
            sx={{ flex: '0 0 auto', lineHeight: 1.6 }}
          >
            $50.00
          </Typography>
        </Box>
        <Divider />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            py: 1,
            px: 3,
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ flex: '1 0 auto', lineHeight: 1.6, ml: 4 }}
          >
            Surplus Lines Tax
          </Typography>
          <Typography
            variant='subtitle2'
            fontWeight='regular'
            color='text.secondary'
            sx={{ flex: '0 0 auto', lineHeight: 1.6 }}
          >
            $24.00
          </Typography>
        </Box>
        <Divider />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            py: 1,
            px: 3,
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ flex: '1 0 auto', lineHeight: 1.6 }}
          >
            Total
          </Typography>
          <Typography variant='subtitle2' sx={{ flex: '0 0 auto', lineHeight: 1.6 }}>
            $313.00
          </Typography>
        </Box>
        <Divider />
      </Box>
    </Box>
  );
}
