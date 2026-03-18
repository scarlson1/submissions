import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Timestamp, UpdateData } from 'firebase/firestore';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject, useCallback } from 'react';

import { setQuoteUserId } from 'api';
import { NamedInsured, Quote, namedInsuredValidationNested, phoneRequiredVal } from 'common';
import { FormikMaskField, FormikWizardNavButtons, IMask, phoneMaskProps } from 'components/forms';
import { useWizard } from 'hooks';
import { useFunctions } from 'reactfire';
import { ContactStep } from '../ContactStep';
import { useAddBillingEntity } from './useAddBillingEntity';

// mailing address in same step or separate ??

export interface NamedInsuredValues {
  namedInsured: Pick<
    NamedInsured,
    'firstName' | 'lastName' | 'email' | 'phone' | 'userId' | 'stripeCustomerId'
  >;
}

export interface BindQuoteProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  onStepSubmit: (updates: UpdateData<Quote>, forceUpdate?: boolean) => Promise<void>;
  formRef: RefObject<FormikProps<T>>;
  onError?: (msg: string, err?: any) => void;
}

export type NamedInsuredStepProps = BindQuoteProps<NamedInsuredValues> & { quoteId: string };

export function NamedInsuredStep({
  onStepSubmit,
  formRef,
  onError,
  quoteId,
  ...props
}: NamedInsuredStepProps) {
  const functions = useFunctions();
  const { nextStep } = useWizard();
  const { addBillingEntity } = useAddBillingEntity('quotes', quoteId, console.log, console.error);
  // useEffect(() => {
  //   logAnalyticsStep(0, 'named insured step');
  // }, [logAnalyticsStep]);

  const getIdsAndSaveValues = useCallback(
    async (values: NamedInsuredValues) => {
      let namedInsuredUserId, stripeAccountId;

      // don't throw if these fail ??
      try {
        const setUserIdPromise = setQuoteUserId(functions, {
          quoteId,
          email: values.namedInsured.email,
        });
        const addBillingEntityPromise = addBillingEntity({
          displayName:
            `${values.namedInsured?.firstName || ''} ${
              values.namedInsured?.lastName || ''
            }`.trim() || '',
          email: values.namedInsured?.email || '',
          phone: values.namedInsured?.phone || '',
        });

        const [userIdRes, entityRes] = await Promise.all([
          setUserIdPromise,
          addBillingEntityPromise,
        ]);

        namedInsuredUserId = userIdRes.data.userId;
        stripeAccountId = entityRes;
      } catch (err: any) {
        console.log('err: ', err);
      }

      await onStepSubmit(
        {
          'namedInsured.firstName': values.namedInsured?.firstName,
          'namedInsured.lastName': values.namedInsured?.lastName,
          'namedInsured.email': values.namedInsured.email,
          'namedInsured.phone': values.namedInsured?.phone || '',
          'namedInsured.stripeCustomerId': stripeAccountId || null,
          defaultBillingEntityId: stripeAccountId || '',
          'metadata.updated': Timestamp.now(),
        },
        true
      );
    },
    [onStepSubmit, addBillingEntity]
  );

  const handleSubmit = useCallback(
    async (values: NamedInsuredValues, bag: FormikHelpers<NamedInsuredValues>) => {
      // TODO: need to call setQuoteUserId when quote created ??
      // let namedInsuredUserId;
      // try {
      //   const { data } = await setQuoteUserId(functions, {
      //     quoteId,
      //     email: values.namedInsured.email,
      //   });
      //   namedInsuredUserId = data.userId;
      // } catch (err: any) {
      //   console.log('err setting user id on quote: ', err);
      // }

      // let stripeAccountId;
      // try {
      //   stripeAccountId = await addBillingEntity({
      //     displayName:
      //       `${values.namedInsured?.firstName || ''} ${
      //         values.namedInsured?.lastName || ''
      //       }`.trim() || '',
      //     email: values.namedInsured?.email || '',
      //     phone: values.namedInsured?.phone || '',
      //   });
      // } catch (err: any) {
      //   console.log('error get stripe customer', err); // don't throw -- handle in billing step ??
      // }

      try {
        // use dot notation so namedInsured userId is not overwritten after set in setQuoteUserId ^
        // await onStepSubmit(
        //   {
        //     'namedInsured.firstName': values.namedInsured?.firstName,
        //     'namedInsured.lastName': values.namedInsured?.lastName,
        //     'namedInsured.email': values.namedInsured.email,
        //     'namedInsured.phone': values.namedInsured?.phone || '',
        //     'namedInsured.stripeCustomerId': stripeAccountId || null,
        //     defaultBillingEntityId: stripeAccountId || '',
        //     'metadata.updated': Timestamp.now(),
        //   },
        //   true
        // );
        // force update (could be missing stripe ID or userId from quote creation)
        await getIdsAndSaveValues(values);

        await nextStep();
      } catch (err: any) {
        let msg = 'error saving named insured';
        onError && onError(msg);
      }
    },
    [getIdsAndSaveValues, nextStep]
  );

  return (
    <Formik
      onSubmit={handleSubmit}
      validationSchema={namedInsuredValidationNested}
      enableReinitialize
      {...props}
      innerRef={formRef}
    >
      {({ submitForm, handleSubmit: formikHandleSubmit }) => (
        <Form onSubmit={formikHandleSubmit}>
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
                  maskComponent={IMask}
                  inputProps={{ maskProps: phoneMaskProps }}
                  formikConfig={{ validate: phoneRequiredVal }}
                />
              </Grid>
            </ContactStep>
            <Box sx={{ py: 2 }}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
}
