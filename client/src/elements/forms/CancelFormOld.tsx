import { Unstable_Grid2 as Grid } from '@mui/material';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject } from 'react';
import * as yup from 'yup';
import { add } from 'date-fns';

import { CancellationReason } from 'common';
import { FormikDatePicker, FormikNativeSelect, UpdateDialogSubmitDisabled } from 'components/forms';

export const CANCEL_REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: 'sold', label: 'Sold' },
  { value: 'insured_choice', label: 'I no longer want flood insurance' },
  { value: 'premium_pmt_failure', label: 'Unable to meet premium payments' },
  { value: 'exposure_change', label: 'Risk change' },
];

const validation = yup.object().shape({
  requestEffDate: yup.date().required(),
  reason: yup.string().required(),
});

export interface CancelValues {
  requestEffDate: Date; // | null;
  reason: CancellationReason; // string;
}

export interface CancelFormProps extends Partial<FormikConfig<CancelValues>> {
  initialValues: CancelValues;
  onSubmit:
    | ((values: CancelValues, bag: FormikHelpers<CancelValues>) => Promise<void>)
    | ((values: CancelValues, bag: FormikHelpers<CancelValues>) => void);
  formRef: RefObject<FormikProps<CancelValues>>;
  minDate?: Date;
  maxDate?: Date;
}

export const CancelForm = ({
  initialValues,
  onSubmit,
  formRef,
  minDate,
  maxDate,
  ...props
}: CancelFormProps) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validation}
      innerRef={formRef}
      {...props}
    >
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={3} columnSpacing={3}>
            <Grid xs={12}>
              <FormikDatePicker
                name='requestEffDate'
                label='Requested cancellation date'
                minDate={minDate || add(new Date(), { days: 1 })}
                maxDate={maxDate}
                slotProps={{
                  actionBar: {
                    actions: ['today'],
                  },
                  textField: {
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid xs={12}>
              <FormikNativeSelect
                name='reason'
                label='Reason'
                required
                selectOptions={CANCEL_REASON_OPTIONS}
              />
            </Grid>
          </Grid>
          <UpdateDialogSubmitDisabled />
        </Form>
      )}
    </Formik>
  );
};
