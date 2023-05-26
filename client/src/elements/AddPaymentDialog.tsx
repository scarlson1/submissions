import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Tab,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  useTheme,
  useMediaQuery,
  IconButton,
  Slide,
  ButtonProps,
  BoxProps,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import Grid from '@mui/material/Unstable_Grid2';
import { LoadingButton, TabList, TabPanel, TabContext } from '@mui/lab';
import { AccountBalanceRounded, CloseRounded, CreditCardRounded } from '@mui/icons-material';
import { Formik, Form, FormikProps, FormikHelpers } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'modules/components/AuthContext';
import { FormikCardDetails, FormikBankFields } from 'elements';
import { VerifyEPayTokenResponse } from 'modules/api';
import { validateRoutingNumber } from 'modules/utils/helpers';
import { FormikTextField } from 'components/forms';
import { useVerifyPaymentMethod } from 'hooks';

const GRID_PROPS = {
  rowSpacing: { xs: 3, md: 4 },
  columnSpacing: { xs: 3, md: 4, lg: 5 },
};

const addPaymentMethodValidation = yup.object().shape({
  payerName: yup.string().required('Name is required'),
  payerEmail: yup.string().email().required('Email is required'),
  accountHolder: yup.string().required('Must enter the name on the card/account'),
  cardNumber: yup.string().when(['cardPaymentMethod'], {
    is: true,
    then: yup
      .string()
      .required()
      .matches(/^[0-9]{16}$/, 'Card number must be 16 digits'),
    otherwise: yup.string().notRequired(),
  }),
  cardExpDate: yup.string().when(['cardPaymentMethod'], {
    is: true,
    then: yup
      .string()
      .required()
      .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Exp date must be in format: mm/yy'),
    otherwise: yup.string().notRequired(),
  }),
  cvc: yup.string().when(['cardPaymentMethod'], {
    is: true,
    then: yup
      .string()
      .min(3)
      .max(4)
      .required()
      .matches(/^([0-9]{3,4})$/, 'CVC must be 3 or 4 digits'),
    otherwise: yup.string().notRequired(),
  }),
  postalCode: yup.string().when(['cardPaymentMethod'], {
    is: true,
    then: yup
      .string()
      .required('Postal code is required')
      .matches(/^[0-9]{5}$/, '5 digit postal required'),
    otherwise: yup.string().notRequired(),
  }),
  accountType: yup.string().when(['cardPaymentMethod'], {
    is: false,
    then: yup
      .string()
      .oneOf(['PersonalChecking', 'PersonalSavings', 'CorporateChecking', 'CorporateSavings']),
    otherwise: yup.string().notRequired(),
  }),
  routingNumber: yup.string().when(['cardPaymentMethod'], {
    is: false,
    then: yup
      .string()
      .required()
      .test('routing-number', 'Invalid routing number', validateRoutingNumber),
    otherwise: yup.string().notRequired(),
  }),
  accountNumber: yup.string().when(['cardPaymentMethod'], {
    is: false,
    then: yup
      .string()
      .min(8, 'Account number must be at least 8 digits')
      .max(14, 'Account number must be less than 14 digits')
      .required(),
    otherwise: yup.string().notRequired(),
  }),
});

export const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

export interface AddPaymentMethodValues {
  payerName: string;
  payerEmail: string;
  accountHolder: string;
  cardNumber: string;
  cardExpDate: string;
  cvc: string;
  postalCode: string;
  accountType: 'PersonalChecking' | 'PersonalSavings' | 'CorporateChecking' | 'CorporateSavings';
  routingNumber: string;
  accountNumber: string;
  cardPaymentMethod: boolean;
}

export interface AddPaymentDialogProps {
  cb?: (data: VerifyEPayTokenResponse) => void;
  openButtonText?: string;
  initialValues?: AddPaymentMethodValues;
  buttonProps?: ButtonProps;
  containerProps?: BoxProps;
}

const PROD_INITIAL_VALUES: AddPaymentMethodValues = {
  payerName: '',
  payerEmail: '',
  accountHolder: '',
  cardNumber: '',
  cardExpDate: '',
  cvc: '',
  postalCode: '',
  accountType: 'PersonalChecking',
  routingNumber: '',
  accountNumber: '',
  cardPaymentMethod: true,
};

const DEV_INITIAL_VALUES: AddPaymentMethodValues = {
  payerName: 'Foo Bar',
  payerEmail: 'foobar@example.com',
  accountHolder: '',
  cardNumber: '5555341244441115',
  cardExpDate: '03/30',
  cvc: '737',
  postalCode: '',
  accountType: 'PersonalChecking',
  routingNumber: '021000021',
  accountNumber: '12345678',
  cardPaymentMethod: true,
};
const DEFAULT_INITIAL_VALUES =
  process.env.REACT_APP_DEV === 'true' ? DEV_INITIAL_VALUES : PROD_INITIAL_VALUES;

export const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({
  cb,
  openButtonText,
  initialValues,
  buttonProps,
  containerProps,
}) => {
  const navigate = useNavigate();
  const { user, loading, loadingInitial, isAuthenticated, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);
  const formikRef = useRef<FormikProps<AddPaymentMethodValues>>(null);
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    formikRef.current?.resetForm();
    setOpen(false);
  }, []);

  const verifyPaymentMethod = useVerifyPaymentMethod(
    (data: VerifyEPayTokenResponse) => {
      // toast.success(`Payment method added! (${data.maskedAccountNumber})`);
      if (cb) cb(data);
      handleClose();
    }
    // (msg, err) => toast.error(msg)
  );

  // TODO: If auth loaded && !user, redirect to sign in
  // TODO: useRequireAuth hook ??
  useEffect(() => {
    if (loading || loadingInitial) return;
    if (isAnonymous || !isAuthenticated) {
      // navigate('/auth/login', {
      //   state: { redirectPath: `/application/bind/${quoteData.quoteId}` },
      // });
      navigate('/auth/login'); // TODO: redirect ?? handle in new / extended require auth hook ??
    }
  }, [user, loading, loadingInitial, isAuthenticated, isAnonymous, navigate]);

  const handleSubmit = useCallback(
    async (
      values: AddPaymentMethodValues,
      { setSubmitting }: FormikHelpers<AddPaymentMethodValues>
    ) => {
      await verifyPaymentMethod(values);
      setSubmitting(false);
    },
    [verifyPaymentMethod]
  );

  return (
    <Box {...containerProps}>
      <Button variant='outlined' {...buttonProps} onClick={handleOpen}>
        {openButtonText ? openButtonText : 'Add a new payment method'}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        maxWidth='sm'
        fullWidth
        TransitionComponent={Transition}
      >
        <Formik
          initialValues={initialValues ? initialValues : DEFAULT_INITIAL_VALUES}
          validationSchema={addPaymentMethodValidation}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({
            values,
            setFieldValue,
            isValid,
            isSubmitting,
            isValidating,
            dirty,
          }: FormikProps<AddPaymentMethodValues>) => (
            <Form>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center' }} component='div'>
                <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                  Add Payment Method
                </Typography>
                <LoadingButton
                  disabled={!dirty || !isValid}
                  loading={isSubmitting || isValidating}
                  variant='contained'
                  type='submit'
                  sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                >
                  save
                </LoadingButton>
                <IconButton
                  aria-label='close'
                  onClick={handleClose}
                  size='small'
                  sx={{
                    // position: 'absolute',
                    // right: 8,
                    // top: 8,
                    ml: 3,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseRounded fontSize='inherit' />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                  Billed To Information
                </Typography>
                <Grid container {...GRID_PROPS} sx={{ mt: 2, mb: 4 }}>
                  <Grid xs={12} sm={6}>
                    <FormikTextField name='payerName' label='Payer Name' required fullWidth />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormikTextField name='payerEmail' label='Payer Email' required fullWidth />
                  </Grid>
                </Grid>
                <TabContext value={values.cardPaymentMethod ? '0' : '1'}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                      onChange={(event: React.SyntheticEvent, newValue: string) => {
                        setFieldValue('cardPaymentMethod', newValue === '0');
                      }}
                      aria-label='payment method type'
                      centered
                    >
                      <Tab
                        icon={<CreditCardRounded />}
                        iconPosition='start'
                        label='Card'
                        sx={{ minHeight: '50px' }}
                        value='0'
                      />
                      <Tab
                        icon={<AccountBalanceRounded />}
                        iconPosition='start'
                        label='ACH'
                        sx={{ minHeight: '50px' }}
                        value='1'
                      />
                    </TabList>
                  </Box>
                  <TabPanel value='0' sx={{ px: 0, mx: 0 }}>
                    <Box>
                      <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                        Payment Method Details
                      </Typography>
                      <FormikCardDetails gridProps={GRID_PROPS} />
                    </Box>
                  </TabPanel>
                  <TabPanel value='1' sx={{ px: 0, mx: 0 }}>
                    <Box>
                      <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                        Payment Method Details
                      </Typography>
                      <FormikBankFields gridProps={GRID_PROPS} />
                    </Box>
                  </TabPanel>
                </TabContext>
              </DialogContent>
              <DialogActions sx={{ display: { xs: 'none', sm: 'flex' } }}>
                <Button
                  onClick={handleClose}
                  // onClick={() => {
                  //   resetForm();
                  //   handleClose();
                  // }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  disabled={!dirty || !isValid}
                  loading={isSubmitting || isValidating}
                  // loadingPosition='start'
                  // startIcon={<SaveIcon />}
                  variant='contained'
                  type='submit'
                >
                  Add payment method
                </LoadingButton>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default AddPaymentDialog;
