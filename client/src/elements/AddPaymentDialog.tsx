import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import { AccountBalanceRounded, CreditCardRounded } from '@mui/icons-material';
import { Formik, Form, FormikProps } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'modules/components/AuthContext';
import { toast } from 'react-hot-toast';
import { FormikCardDetails, FormikBankFields } from 'elements';
import { TabPanel } from 'components';
import { VerifyEPayTokenResponse } from 'modules/api';
import { validateRoutingNumber } from 'modules/utils/helpers';
import { FormikTextField } from 'components/forms';
import { useVerifyPaymentMethod } from 'hooks';

// TODO: move add pmt / verify logic to hook

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
}

const DEFAULT_INITIAL_VALUES: AddPaymentMethodValues = {
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

export const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({
  cb,
  openButtonText,
  initialValues,
}) => {
  const navigate = useNavigate();
  const { user, loading, loadingInitial, isAuthenticated, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const verifyPaymentMethod = useVerifyPaymentMethod(
    (data: VerifyEPayTokenResponse) => {
      toast.success(`Payment method added! (${data.maskedAccountNumber})`);
      handleClose();
    },
    (msg, err) => toast.error(msg)
  );

  // TODO: If auth loaded && !user, redirect to sign in
  useEffect(() => {
    if (loading || loadingInitial) return;
    if (isAnonymous || !isAuthenticated) {
      // navigate('/auth/login', {
      //   state: { redirectPath: `/application/bind/${quoteData.quoteId}` },
      // });
      navigate('/auth/login');
    }
  }, [user, loading, loadingInitial, isAuthenticated, isAnonymous, navigate]);

  return (
    <div>
      <Button variant='outlined' onClick={handleOpen}>
        {openButtonText ? openButtonText : 'Add a new payment method'}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <Formik
          initialValues={initialValues ? initialValues : DEFAULT_INITIAL_VALUES}
          validationSchema={addPaymentMethodValidation}
          onSubmit={async (values, actions) => {
            await verifyPaymentMethod(values);
            actions.setSubmitting(false);

            // try {
            // let tokenReqModel = null;
            // let cardExpArray = values.cardExpDate.split('/');
            // let expMonth = cardExpArray[0].length === 1 ? `0${cardExpArray[0]}` : cardExpArray[0];
            // if (values.cardPaymentMethod) {
            //   tokenReqModel = {
            //     payer: values.payerName,
            //     emailAddress: values.payerEmail,
            //     creditCardInformation: {
            //       accountHolder: values.accountHolder,
            //       cardNumber: values.cardNumber,
            //       cvc: values.cvc,
            //       month: expMonth,
            //       year: parseInt(`20${values.cardExpDate.slice(-2)}`),
            //       postalCode: values.postalCode,
            //     },
            //   };
            // } else {
            //   tokenReqModel = {
            //     payer: values.payerName,
            //     emailAddress: values.payerEmail,
            //     bankAccountInformation: {
            //       accountHolder: values.accountHolder,
            //       accountType: values.accountType,
            //       routingNumber: values.routingNumber,
            //       accountNumber: values.accountNumber,
            //     },
            //   };
            // }

            // let {
            //   headers: { location },
            // } = await ePayInstance.post('/api/v1/tokens', {
            //   ...tokenReqModel,
            // });
            // console.log('TOKEN EPAY RES => ', location);
            // let tokenId = location?.split('/')[2];

            // if (!tokenId) {
            //   console.log('missing tokenId from epay');
            //   toast.error(
            //     'Failed to generate payment token. Please check payment method details.'
            //   );
            //   actions.setSubmitting(false);
            //   return;
            // }

            // const { data } = await verifyEPayToken({
            //   tokenId,
            //   accountHolder: values.accountHolder,
            // });
            // console.log('TOKEN DATA => ', data);

            // if (!data.id) {
            //   console.log('TOKEN VERIFICATION FAILED');
            //   toast.error("Something went wrong. We're unable to verify the payment method.");
            // } else {
            //   toast.success(`Payment method added! (${data.maskedAccountNumber})`);
            //   if (cb) cb(data);
            //   handleClose();
            // }

            // actions.setSubmitting(false);
            // } catch (err) {
            //   console.log('ERROR => ', err);
            //   actions.setSubmitting(false); // @ts-ignore
            //   let { errors } = err.response.data;
            //   let msg = errors.length
            //     ? errors[0].message
            //     : "Something went wrong. We're unable to verify the payment method.";
            //   // TODO: handle error
            //   toast.error(msg);
            // }
          }}
        >
          {({
            values,
            setFieldValue,
            isValid,
            isSubmitting,
            isValidating,
            dirty,
            resetForm,
          }: FormikProps<AddPaymentMethodValues>) => (
            <Form>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogContent>
                <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                  Billed To Information
                </Typography>
                <Grid2 container spacing={2} xs={12} sx={{ mt: 2, mb: 4 }}>
                  <Grid2 xs={12} sm={6}>
                    <FormikTextField name='payerName' label='Payer Name' required fullWidth />
                  </Grid2>
                  <Grid2 xs={12} sm={6}>
                    <FormikTextField name='payerEmail' label='Payer Email' required fullWidth />
                  </Grid2>
                </Grid2>
                <Tabs
                  value={values.cardPaymentMethod ? 0 : 1}
                  onChange={(event: React.SyntheticEvent, newValue: number) => {
                    setFieldValue('cardPaymentMethod', newValue === 0);
                  }}
                  aria-label='basic tabs example'
                  centered
                >
                  <Tab
                    icon={<CreditCardRounded />}
                    iconPosition='start'
                    label='Card'
                    sx={{ minHeight: '50px' }}
                  />
                  <Tab
                    icon={<AccountBalanceRounded />}
                    iconPosition='start'
                    label='ACH'
                    sx={{ minHeight: '50px' }}
                  />
                </Tabs>
                <TabPanel value={values.cardPaymentMethod ? 0 : 1} index={0}>
                  <Box sx={{ py: 3 }}>
                    <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                      Payment Method Details
                    </Typography>
                    <FormikCardDetails />
                  </Box>
                </TabPanel>
                <TabPanel value={values.cardPaymentMethod ? 0 : 1} index={1}>
                  <Box sx={{ py: 3 }}>
                    <Typography variant='overline' gutterBottom sx={{ px: 3 }}>
                      Payment Method Details
                    </Typography>
                    <FormikBankFields />
                  </Box>
                </TabPanel>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    resetForm();
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  disabled={!dirty || !isValid || isSubmitting || isValidating}
                  loading={isSubmitting}
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
    </div>
  );
};

export default AddPaymentDialog;
