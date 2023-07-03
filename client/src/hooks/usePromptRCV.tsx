import { useCallback, useRef } from 'react';
import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import * as yup from 'yup';

import { useConfirmation } from 'modules/components';
import { ConfirmationDialog } from 'components';
import { FormikDollarMaskField } from 'components/forms';

// TODO: abstract hook. also used in useRegisterEamilNotification & other places ??

const DEFAULT_RCV = 250000;
// const DEFAULT_INITIAL_VALUES = { rcvEst: '' }

interface PromptRCVValues {
  rcvEst: string | number;
}

export const validation = yup.object().shape({
  rcvEst: yup
    .number()
    .min(100000, 'Must be at least $100,000')
    .max(5000000, 'Must be less than $5M')
    .required(),
});

// interface UsePromptRCVProps<T> {
//   initialValues: T;
// }

// export const usePromptRCV = <T = PromptRCVValues>(props: UsePromptRCVProps<T> | undefined) => {
export const usePromptRCV = () => {
  const dialog = useConfirmation();
  const formRef = useRef<FormikProps<PromptRCVValues>>(null);

  // NOT USED (NOT CALLED ??)
  const formSub = useCallback(
    (values: PromptRCVValues, { setSubmitting }: FormikHelpers<PromptRCVValues>) => {
      setSubmitting(false);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    try {
      if (formRef.current) {
        try {
          const {
            values,
            validateForm,
            // setTouched,
            setSubmitting,
          } = formRef.current;
          console.log('VALUES: ', values); // @ts-ignore
          // setTouched({ rcvEst: true });

          const valErrors = await validateForm();
          if (Object.keys(valErrors).length === 0 && valErrors.constructor === Object) {
            setSubmitting(true);

            return values.rcvEst;
          }
        } catch (err) {
          console.log('ERROR SUBMITTING FORM', err);
        }
      } else {
        return Promise.reject('missing formik ref');
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.reject(new Error('formRef.current is null.'));
  }, []);

  const handleError = useCallback(
    async (err: unknown) => {
      console.log('TODO: handle error ', err);
      // if (onError) onError(err);
    },
    [] // [onError]
  );

  const promptRCVEst = useCallback(
    async (initialValue?: number) => {
      try {
        const rcvEst = await dialog({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Please estimate the building replacement cost',
          confirmButtonText: 'Submit',
          description: (
            <>
              <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
                We were unable to determine the replacement cost for the building at the provided
                address. This usually occurs when a building was built recently.
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
                Please provide an estimate for the replacement cost of the building (think total
                value - land value for approximation). Give it your best guess.
              </Typography>
            </>
          ),
          dialogContentProps: { dividers: true },
          component: (
            <ConfirmationDialog
              open={true}
              onAccept={() => {}}
              onClose={() => {}}
              onSubmit={handleSubmit}
              onSubmitError={handleError}
              dialogProps={{ maxWidth: 'sm' }}
            >
              <Box sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
                <Formik
                  initialValues={{ rcvEst: initialValue || '' }}
                  validationSchema={validation}
                  onSubmit={formSub}
                  enableReinitialize
                  innerRef={formRef}
                >
                  {({ handleSubmit }: FormikProps<PromptRCVValues>) => (
                    <Form onSubmit={handleSubmit}>
                      <Grid
                        container
                        rowSpacing={{ xs: 3, sm: 4 }}
                        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                      >
                        <Grid xs={12}>
                          <FormikDollarMaskField
                            name='rcvEst'
                            label='Est. Building Replacement Cost'
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Form>
                  )}
                </Formik>
              </Box>
            </ConfirmationDialog>
          ),
        });

        return rcvEst;
      } catch (error) {
        console.log('Error getting RCV est. --> using $250k');
        return DEFAULT_RCV;
      }
    },
    [dialog, formSub, handleError, handleSubmit]
  );

  return promptRCVEst;
};
