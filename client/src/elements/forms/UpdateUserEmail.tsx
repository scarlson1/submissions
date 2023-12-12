import { LoadingButton } from '@mui/lab';
import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import * as Sentry from '@sentry/react';
import { Firestore, doc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect } from 'react';
import { SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { useFirestore, useUser } from 'reactfire';

import { usersCollection } from 'common';
import { RHFTextField } from 'components/forms';
import { useAuthActions } from 'context';
import { useAsyncToast } from 'hooks';

async function updateDBEmail(
  firestore: Firestore,
  userId: string,
  email: string,
  onError?: (msg: string, err: any) => void
) {
  try {
    const userRef = doc(usersCollection(firestore), userId);
    await setDoc(userRef, { email }, { merge: true });
  } catch (err: any) {
    let msg = `Error updating email in database`;
    if (err.message) msg += ` (${err.message})`;
    Sentry.captureException(err);
    if (onError) onError(msg, err);
  }
}

type UserEmailInputs = {
  email: string;
};

export function UpdateUserEmail() {
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const { data: user } = useUser();
  const { updateUserEmail } = useAuthActions();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitSuccessful },
  } = useForm<UserEmailInputs>({
    defaultValues: {
      email: '',
    },
    values: {
      email: user?.email || '',
    },
    resetOptions: {
      keepDirtyValues: true, // user-interacted input will be retained
    },
  });

  const { isValid, isSubmitting, isDirty } = useFormState({
    control,
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        email: user?.email || '',
      });
  }, [isSubmitSuccessful, reset, user?.email]);

  const onSubmit: SubmitHandler<UserEmailInputs> = useCallback(
    async (data) => {
      toast.loading('updating...');

      try {
        await updateUserEmail(data.email, async (msg: string) => {
          await updateDBEmail(firestore, user!.uid, data.email, console.log);

          toast.success(msg);
        });
      } catch (err) {
        toast.error('Error updating email');
      }
    },
    [toast, updateUserEmail, firestore, user]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={5}>
          <Grid xs={8} sm={8} md={10}>
            <RHFTextField
              control={control}
              name='email'
              rules={{ required: true }}
              label='Email'
              textFieldProps={{ variant: 'outlined', fullWidth: true }}
            />
          </Grid>
          {/* <Grid xs={12}>
            <RHFFieldArray
              name='test'
              control={control}
              inputFields={[
                {
                  name: 'firstName',
                  label: 'First name',
                  inputType: 'text',
                  required: false,
                },
                {
                  name: 'lastName',
                  label: 'Last name',
                  inputType: 'text',
                  required: false,
                },
              ]}
            />
          </Grid> */}

          <Grid xs={4} sm={4} md={2} sx={{ alignSelf: 'center' }}>
            <LoadingButton
              type='submit'
              disabled={!isValid || !isDirty}
              loading={isSubmitting}
              sx={{ maxHeight: 34 }}
            >
              Update
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
