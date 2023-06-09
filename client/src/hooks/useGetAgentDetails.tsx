import { useCallback, useRef, useState } from 'react';
import * as yup from 'yup';

import { User, WithId, emailVal, usersCollection } from 'common';
import { ConfirmationDialog } from 'components';
import { CUSTOM_CLAIMS, ConfirmationOptions, useConfirmation } from 'modules/components';
import { Form, Formik, FormikProps } from 'formik';
import { Box, CircularProgress, InputAdornment } from '@mui/material';
import { FormikTextField } from 'components/forms';
import { useFirestore, useSigninCheck } from 'reactfire';
import { getDocs, limit, query, where } from 'firebase/firestore';

// TODO: permissions
// TODO: generalize search component  - search algolia
// use filters to allow filter='users','type='agent', etc

const validation = yup.object().shape({
  email: emailVal,
});

export const useGetAgentDetails = (
  onSuccess?: (user: WithId<User>) => void,
  onError?: (msg: string, err?: any) => void
) => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const dialog = useConfirmation();
  const formRef = useRef<FormikProps<{ email: string }>>(null);
  const { data } = useSigninCheck({ requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true } });

  /**Called internally */
  const getAgentByEmail = useCallback(
    async (email: string) => {
      // try {
      const usersCol = usersCollection(firestore);
      const q = query(usersCol, where('email', '==', email), limit(1));

      setLoading(true);
      const querySnap = await getDocs(q);
      setLoading(false);

      if (querySnap.empty) {
        // if (onError) onError(`No user found with email ${email}`);
        // return
        throw new Error(`User not found matching ${email}`);
      }

      const userData = { ...querySnap.docs[0].data(), id: querySnap.docs[0].id };
      // if (onSuccess) onSuccess(userData);
      return userData;
      // } catch (err: any) {
      //   let msg = 'Error searching users';
      //   if (err?.message) msg = err.message;
      //   if (onError) onError(msg, err);
      //   return;
      // }
    },
    [firestore] // onSuccess, onError
  );

  const handleDialogSubmit = useCallback(async () => {
    console.log('VALUES: ', formRef.current?.values);
    if (formRef.current) {
      try {
        const { values, validateForm, setTouched } = formRef.current;
        setTouched({ email: true });
        const valErrors = await validateForm();

        if (Object.keys(valErrors).length === 0 && valErrors.constructor === Object) {
          const agentDetails = await getAgentByEmail(values.email);
          console.log('AGENT DETAILS: ', agentDetails);

          if (!agentDetails) throw new Error('Unable to find user details');

          return agentDetails;
          // return values.email;
        } else return Promise.reject();
      } catch (err: any) {
        let msg = 'Error searching users';
        if (err?.message) msg = err.message;
        if (onError) onError(msg, err);
        return Promise.reject(err);
      }
    }
  }, [getAgentByEmail, onError]);

  const formSub = useCallback(async () => {
    console.log('formSub');
  }, []);

  const handleDialogError = useCallback(async (err: unknown) => {
    console.log('DIALOG ERR: ', err);
  }, []);

  const searchAgent = useCallback(
    async (options?: Omit<ConfirmationOptions, 'component' | 'catchOnCancel'>) => {
      if (!data.hasRequiredClaims) {
        if (onError) onError('Must have admin claims to search users');
        return;
      }

      try {
        const userDetails = await dialog({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Enter agent email',
          confirmButtonText: 'Submit',
          dialogContentProps: { dividers: true },
          component: (
            <ConfirmationDialog
              open={true}
              onAccept={() => {}}
              onClose={() => {}}
              onSubmit={handleDialogSubmit}
              onSubmitError={handleDialogError}
              dialogProps={{ maxWidth: 'xs' }}
            >
              <Box>
                <Formik
                  initialValues={{
                    email: '',
                  }}
                  validationSchema={validation}
                  onSubmit={formSub}
                  enableReinitialize
                  innerRef={formRef}
                >
                  {({ handleSubmit, values }: FormikProps<{ email: string }>) => (
                    <Form onSubmit={handleSubmit}>
                      <FormikTextField
                        name='email'
                        label='Email'
                        fullWidth
                        // TODO: wrap in fade
                        InputProps={{
                          endAdornment: loading ? (
                            <InputAdornment position='start'>
                              <CircularProgress size={28} />
                            </InputAdornment>
                          ) : null,
                        }}
                      />
                    </Form>
                  )}
                </Formik>
              </Box>
            </ConfirmationDialog>
          ),
        });

        if (!userDetails) throw new Error('User details not found');
        console.log('RETURNING: ', userDetails);
        // return getAgentByEmail(email);
        if (onSuccess) onSuccess(userDetails);
        return userDetails;
      } catch (err: any) {
        console.log('DIALOG ERROR: ', err);
        // TODO: onError ??
        return;
      }
    },
    [
      data,
      dialog,
      onError,
      // getAgentByEmail,
      handleDialogError,
      handleDialogSubmit,
      formSub,
      loading,
      onSuccess,
    ]
  );

  return { searchAgent, loading };
};
