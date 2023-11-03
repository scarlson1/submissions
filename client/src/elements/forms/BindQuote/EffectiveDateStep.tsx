// BUG: load form when eff exception req = true, then turn it off and select valid date ==> validation fails

import { Box, Collapse, Typography } from '@mui/material';
import { FormikCheckbox, FormikDatePicker, FormikNativeSelect } from 'components/forms';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { boolean, date, object, string } from 'yup';
import { policyEffShortcuts } from '../QuoteForm/constants';
import { BindQuoteValues } from './BindQuoteForm';
import { LogAnalyticsProps } from './NamedInsuredStep';

export const getEffectiveDateValidation = (minEffDate: Date, maxEffDate: Date) =>
  object().shape({
    effectiveExceptionRequested: boolean(),
    effectiveDate: date().when('effectiveExceptionRequested', {
      is: true,
      then: () => date().min(new Date(), 'Effective cannot be in the past'),
      otherwise: () =>
        date() // addToDate({ days: 15 })
          .min(minEffDate, 'Effective date must be at least 15 days from binding coverage')
          .max(maxEffDate, 'Effective date must be within 60 days of binding coverage'),
    }),
    effectiveExceptionReason: string().when('effectiveExceptionRequested', {
      is: true,
      then: () => string().required('Please select an option'),
      otherwise: () => string().notRequired(),
    }),
  });

export interface EffectiveDateStepProps extends LogAnalyticsProps {
  minEffDate?: Date | null;
  maxEffDate?: Date | null;
}

export const EffectiveDateStep = ({
  minEffDate,
  maxEffDate,
  logAnalyticsStep,
}: EffectiveDateStepProps) => {
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
                {
                  label: 'UW waived',
                  value: 'uw_waived',
                },
                {
                  label: 'Changing from existing policy',
                  value: 'policy_change',
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
