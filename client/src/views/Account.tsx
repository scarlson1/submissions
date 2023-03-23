import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { LoadingButton } from '@mui/lab';
import { SaveRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { Formik, FormikHelpers } from 'formik';
import {
  doc,
  DocumentSnapshot,
  FirestoreError,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

import { FormikTextField } from 'components/forms';
import { readableFirebaseCode } from 'modules/utils/helpers';
import { useAuth } from 'modules/components/AuthContext';
import { User, usersCollection, WithId } from 'common';

const useUserAccount = (onError?: (err: unknown, msg: string) => void) => {
  const { user } = useAuth();
  const [account, setAccount] = useState<WithId<User>>();

  useEffect(() => {
    if (!user || !user.uid) return;
    const unsubscribe = onSnapshot(
      doc(usersCollection(getFirestore()), user?.uid),
      (snap: DocumentSnapshot<User>) => {
        const u = snap.data();
        if (!u) return setAccount(undefined);
        setAccount({ ...u, id: snap.id });
      },
      (err) => {
        console.log('ERROR: ', err);
        let msg = 'Error';
        if (err instanceof FirebaseError) {
          msg += ` (${readableFirebaseCode(err as FirestoreError)})`;
        }
        if (onError) onError(err, msg);
      }
    );

    return () => unsubscribe();
  }, [user, onError]);

  return account;
};

interface UseUpdateAccountProps {
  onSuccess?: () => void;
  onError?: (err: unknown, msg: string) => void;
}

const useUpdateAccount = ({ onSuccess, onError }: UseUpdateAccountProps) => {
  // const { user, updateUserEmail } = useAuth();

  const updateAccount = useCallback(
    async (newValues: UserAccountValues) => {
      try {
        console.log('new values: ', newValues);
        // update user email
        // update user doc
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        console.log('ERROR UPDATING ACCOUNT ', err);
        let msg = 'Error updating account';
        if (err instanceof FirebaseError) {
          msg += ` (${readableFirebaseCode(err as FirestoreError)})`;
        }
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return updateAccount;
};

export interface UserAccountValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export const Account: React.FC = () => {
  // TODO: use loader to get user data?? pass user ID in url ? permissions ??
  const account = useUserAccount();
  const updateAccount = useUpdateAccount({
    onSuccess: () => toast.success('Account updated!'),
    onError: (err, msg) => toast.error(msg),
  });

  const handleSubmit = useCallback(
    async (values: UserAccountValues, { setSubmitting }: FormikHelpers<UserAccountValues>) => {
      console.log('VALUES: ', values);
      await updateAccount(values);
      setSubmitting(false);
    },
    [updateAccount]
  );

  // TODO: if anonymous show create account button

  return (
    <Box>
      <Formik
        initialValues={{
          firstName: account?.firstName || '',
          lastName: account?.lastName || '',
          email: account?.email || '',
          phoneNumber: account?.phone || '',
        }}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ dirty, isValid, isSubmitting, isValidating, submitForm }) => (
          <Grid container spacing={5}>
            <Grid xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='h5'>Account</Typography>
              <LoadingButton
                onClick={submitForm}
                disabled={!dirty || isValid}
                loading={isSubmitting || isValidating}
                startIcon={<SaveRounded />}
                loadingPosition='start'
              >
                Save
              </LoadingButton>
              <Divider sx={{ my: 2 }} flexItem />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='firstName' label='First name' fullWidth />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='lastName' label='Last name' fullWidth />
            </Grid>
            <Grid xs={12} md={6}>
              <FormikTextField name='email' label='Email' fullWidth />
            </Grid>
            <Grid xs={12} md={6}>
              <FormikTextField name='phoneNumber' label='Phone' fullWidth />
            </Grid>
            {/* TODO: address ? */}
          </Grid>
        )}
      </Formik>
    </Box>
  );
};

export function VerifyEmailButton() {
  const { sendVerification } = useAuth();

  const send = useCallback(async () => {
    try {
      const e = await sendVerification();
      toast.success(`Verification email sent to ${e}`);
    } catch (err) {
      console.log(err);
      toast.error('Error sending verification');
    }
  }, [sendVerification]);

  return (
    <Button onClick={send} size='small'>
      Send verification email
    </Button>
  );
}
