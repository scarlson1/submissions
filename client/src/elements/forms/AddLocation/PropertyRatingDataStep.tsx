import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { startOfDay } from 'date-fns';
import { Form, Formik, FormikHelpers } from 'formik';
import { useClaims, useWizard } from 'hooks';
import { useCallback, useMemo } from 'react';
import { date, number, object, string } from 'yup';

import {
  AllowString,
  Nullable,
  PRIOR_LOSS_COUNT_OPTIONS,
  RatingPropertyData,
  priorLossVal,
} from 'common';
import {
  FormikDatePicker,
  FormikDollarMaskField,
  FormikMaskField,
  FormikNativeSelect,
  FormikWizardNavButtons,
  IMask,
} from 'components/forms';
import { Timestamp } from 'firebase/firestore';
import { policyEffShortcuts } from '../QuoteForm/constants';
import { BaseStepProps } from './AddLocationWizard';

// TODO: allow user to edit est. replacement cost ?? need field for original

// BUG: change request subscription triggering form update after values saved
// resets form values --> showing errors while calcPolicyChanges is called

const currentYear = new Date().getFullYear();
const addLocationRatingPropertyVal = object().shape({
  effectiveDate: date().typeError('effective date required').required('effective date required'), // BUG: causing error ("effectiveDate must be a `date` type, but the final value was: `Invalid Date`.")
  ratingPropertyData: object().shape({
    basement: string().typeError('basement required').required('basement required'),
    priorLossCount: priorLossVal
      .typeError('prior loss count required')
      .required('prior loss history required'),
    numStories: number().typeError('# stories required').required('# stories required'),
    replacementCost: number().min(100000).typeError('replacement cost est. required').required(),
    sqFootage: number().min(500).typeError('sq. footage required').required(),
    yearBuilt: number().min(1900).max(currentYear).typeError('year built required').required(),
  }),
});

export interface RatingDataValues {
  effectiveDate: Date | null;
  ratingPropertyData: AllowString<
    Pick<
      Nullable<RatingPropertyData>,
      'basement' | 'replacementCost' | 'sqFootage' | 'yearBuilt' | 'priorLossCount' | 'numStories'
    >
  >;
}

interface PropertyRatingDataStepProps extends BaseStepProps<RatingDataValues> {
  saveChangeRequest: (values: any) => Promise<void>;
  calcChanges: () => Promise<void>;
}

export function PropertyRatingDataStep({
  saveChangeRequest,
  calcChanges,
  onError,
  ...props
}: PropertyRatingDataStepProps) {
  const { claims } = useClaims();
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: RatingDataValues, { setSubmitting }: FormikHelpers<RatingDataValues>) => {
      try {
        if (!values.effectiveDate) throw new Error('effective date required');
        setSubmitting(true);
        await saveChangeRequest({
          ...values,
          effectiveDate: Timestamp.fromDate(values.effectiveDate),
        });
        // formik incorrectly setting submitting false
        // could be because of firestore subscription ?? could be b/c of two awaits ??
        // https://github.com/jaredpalmer/formik/issues/1730
        // enableReinitialize --> resets form when firestore values change ?? !!
        setSubmitting(true);
        await calcChanges();

        setSubmitting(false);
        return await nextStep();
      } catch (err: any) {
        console.log('err: ', err);
        let msg = err?.message || 'error calculating premium';
        onError && onError(msg);
        setSubmitting(false);
      }
    },
    [saveChangeRequest, calcChanges, onError, nextStep]
  );

  const minEffDate = useMemo(
    () => (claims?.iDemandAdmin ? undefined : startOfDay(new Date())),
    [claims]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={addLocationRatingPropertyVal}
      validateOnMount
      enableReinitialize={false} // checking if false fixes formik isSubmitting state bug
    >
      {({ handleSubmit, submitForm, values, errors }) => {
        // console.log('VALUES: ', values);
        // console.log('ERRORS: ', errors);
        return (
          <Form onSubmit={handleSubmit}>
            <Box sx={{ py: 5 }}>
              <Grid container rowSpacing={{ xs: 3, sm: 4 }} columnSpacing={{ xs: 4, sm: 6, md: 7 }}>
                <Grid xs={12} sx={{ mb: 3 }}>
                  <Typography color='text.secondary' gutterBottom>
                    Please confirm/complete a few details about your property.
                  </Typography>
                  <Typography color='text.secondary' gutterBottom>
                    The <i>Location Effective Date</i> is the date you would like coverage to begin
                    for this location. The expiration date will be inherited from the existing
                    policy.
                  </Typography>
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikDatePicker
                    name='effectiveDate'
                    label='Location Effective Date'
                    minDate={minEffDate}
                    maxDate={null}
                    slotProps={{
                      shortcuts: { items: policyEffShortcuts },
                      textField: { required: true },
                    }}
                    closeOnSelect
                    // @ts-ignore
                    timezone='America/Los_Angeles'
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikNativeSelect
                    fullWidth
                    id='ratingPropertyData.basement'
                    label='Basement'
                    name='ratingPropertyData.basement'
                    selectOptions={[
                      { label: 'No', value: 'no' },
                      { label: 'Unknown', value: 'unknown' },
                      { label: 'Finished', value: 'finished' },
                      { label: 'Unfinished', value: 'unfinished' },
                    ]}
                    required
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  {/* TODO: helper text explaining prior loss count */}
                  <FormikNativeSelect
                    fullWidth
                    id='ratingPropertyData.priorLossCount'
                    label='Prior Loss Count'
                    name='ratingPropertyData.priorLossCount'
                    selectOptions={PRIOR_LOSS_COUNT_OPTIONS}
                    required
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikNativeSelect
                    fullWidth
                    id='ratingPropertyData.numStories'
                    label='# Stories'
                    name='ratingPropertyData.numStories'
                    required
                    selectOptions={[
                      { label: '1', value: 1 },
                      { label: '2', value: 2 },
                      { label: '3', value: 3 },
                      { label: '4', value: 4 },
                      { label: '5', value: 5 },
                    ]}
                    convertToNumber={true}
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikDollarMaskField
                    fullWidth
                    id='ratingPropertyData.replacementCost'
                    label='Replacement Cost'
                    name='ratingPropertyData.replacementCost'
                    required
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikMaskField
                    fullWidth
                    id='ratingPropertyData.sqFootage'
                    label='Square Footage'
                    name='ratingPropertyData.sqFootage'
                    required
                    maskComponent={IMask}
                    inputProps={{
                      maskProps: { mask: Number, max: 9999, thousandsSeparator: ',', unmask: true },
                    }}
                  />
                </Grid>
                <Grid xs={6} sm={4} md={3}>
                  <FormikMaskField
                    fullWidth
                    id='ratingPropertyData.yearBuilt'
                    label='Year Built'
                    name='ratingPropertyData.yearBuilt'
                    maskComponent={IMask}
                    required
                    inputProps={{
                      maskProps: {
                        mask: '#!00',
                        definitions: { '#': /[1-2]/, '!': /[0,9]/ },
                        unmask: true,
                      },
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <FormikWizardNavButtons onClick={submitForm} />
                </Grid>
              </Grid>
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
}
