import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import { addDoc, getFirestore } from 'firebase/firestore';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef } from 'react';
import * as yup from 'yup';

import { ActiveStates } from 'common';
import { notifyRegistration } from 'common/firestoreCollections';
import { statesAbrvSelectOptions } from 'common/statesList';
import { emailVal } from 'common/validation';
import { ConfirmationDialog } from 'components';
import { FormikSelect, FormikTextField } from 'components/forms';
import { useConfirmation } from 'context/ConfirmationService';
import { useDocData } from './useDocData';

export interface RegisterValues {
  email: string;
  state: string;
}

export const validation = yup.object().shape({
  email: emailVal.required(),
  state: yup.string().required(),
});

export interface UseRegisterEmailNotificationProps {
  onSuccess?: () => void;
  onError?: (err?: unknown) => void;
}

export const useRegisterEmailNotification = ({
  onSuccess,
  onError,
}: UseRegisterEmailNotificationProps) => {
  const confirm = useConfirmation();
  const formRef = useRef<FormikProps<RegisterValues>>(null);
  const { data: activeStates } = useDocData('states', 'flood');

  const formSub = useCallback(
    (values: RegisterValues, { setSubmitting }: FormikHelpers<RegisterValues>) => {
      setSubmitting(false);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (formRef.current) {
      try {
        const { values, validateForm, setTouched, setSubmitting } = formRef.current;
        setTouched({ email: true, state: true });
        const valErrors = await validateForm();

        if (Object.keys(valErrors).length === 0 && valErrors.constructor === Object) {
          setSubmitting(true);

          const docRef = await addDoc(notifyRegistration(getFirestore()), {
            email: values.email.trim(),
            state: values.state,
            topic: 'flood:available',
          });

          setSubmitting(false);
          return docRef.id;
        } else {
          return Promise.reject();
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(new Error('formRef.current is null.'));
  }, []);

  const handleError = useCallback(
    async (err: unknown) => {
      if (onError) onError(err);
    },
    [onError]
  );

  const promptForNotification = useCallback(
    async (title: string, description: string, state: string = '') => {
      try {
        await confirm({
          catchOnCancel: true,
          variant: 'danger',
          title,
          confirmButtonText: 'Submit',
          description,
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
                  initialValues={{
                    email: '',
                    state,
                  }}
                  validationSchema={validation}
                  onSubmit={formSub}
                  enableReinitialize
                  innerRef={formRef}
                >
                  {({ handleSubmit }: FormikProps<RegisterValues>) => (
                    <Form onSubmit={handleSubmit}>
                      <Grid
                        container
                        rowSpacing={{ xs: 3, sm: 4 }}
                        columnSpacing={{ xs: 1, sm: 2, md: 3 }}
                      >
                        <Grid xs={12} sm={8}>
                          <FormikTextField name='email' label='Email' fullWidth />
                        </Grid>
                        <Grid xs={12} sm={4}>
                          <FormikSelect
                            name='state'
                            label='State'
                            selectOptions={statesAbrvSelectOptions.map((s) => ({
                              ...s,
                              disabled:
                                activeStates && !activeStates[s.value as keyof ActiveStates],
                            }))}
                            required
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
        if (onSuccess) onSuccess();
      } catch (err) {
        return;
      }
    },
    [confirm, handleError, handleSubmit, formSub, onSuccess, activeStates]
  );

  const registerEmailDialog = useCallback(async () => {
    return promptForNotification(
      'Notify Me',
      `Please select the state you're interested in and we'll reach out when we get there.`
    );
  }, [promptForNotification]);

  const handleUnavailableState = useCallback(
    (state?: string) => {
      return promptForNotification(
        'State Unavailable',
        `We're not available there quite yet. Please let us know if you would like to receive a notification when we reach your state.`,
        state
      );
    },
    [promptForNotification]
  );

  return { registerEmailDialog, handleUnavailableState };
};
