import { LoadingButton } from '@mui/lab';
import { Unstable_Grid2 as Grid } from '@mui/material';
import { useCallback, useEffect } from 'react';
import { SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { useUser } from 'reactfire';
import invariant from 'tiny-invariant';

import type { User } from '@idemand/common';
import { RHFTextField } from 'components/forms';
import {
  useAsyncToast,
  useDocData,
  useUpdateDoc,
  useUpdateProfile,
} from 'hooks';

// MUI example: https://codesandbox.io/s/react-hook-form-v7-controller-5h1q5?file=/src/Mui.js

type UserDetailsInputs = {
  firstName: string;
  lastName: string;
};

export function UserDetailsForm() {
  const { data: user } = useUser(); // PRE_DEPLOY: fix only render component if user
  invariant(user);
  const { data: fsUser } = useDocData<User>('users', `${user?.uid}`);
  const toast = useAsyncToast();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitSuccessful },
  } = useForm<UserDetailsInputs>({
    defaultValues: {
      firstName: fsUser?.firstName || '',
      lastName: fsUser?.lastName || '',
    },
    values: {
      firstName: fsUser?.firstName || '',
      lastName: fsUser?.lastName || '',
    },
    resetOptions: {
      keepDirtyValues: true, // user-interacted input will be retained
      keepErrors: true, // input errors will be retained with value update
    },
    // resolver: yupResolver(schema),
  });

  const { isValid, isSubmitting, isDirty } = useFormState({
    control,
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        firstName: fsUser?.firstName || '',
        lastName: fsUser?.lastName || '',
      });
  }, [isSubmitSuccessful, reset, fsUser?.firstName, fsUser?.lastName]);

  const { update: updateUserDoc } = useUpdateDoc<User>('users', () =>
    toast.success('profile updated!'),
  );

  const { updateProfile } = useUpdateProfile(
    ({ displayName, firstName, lastName }) => {
      return updateUserDoc(user.uid, { displayName, firstName, lastName });
    },
    (msg) => toast.error(msg),
  );

  const onSubmit: SubmitHandler<UserDetailsInputs> = useCallback(
    async (data) => {
      toast.loading('updating profile...');

      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
      });
    },
    [toast, updateProfile],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={5}>
        <Grid xs={6} sm={4} md={5}>
          <RHFTextField<UserDetailsInputs, any, UserDetailsInputs>
            control={control}
            name='firstName'
            rules={{ required: true }}
            label='First name'
            textFieldProps={{ variant: 'outlined', fullWidth: true }}
          />
        </Grid>
        <Grid xs={6} sm={4} md={5}>
          <RHFTextField
            control={control}
            name='lastName'
            rules={{ required: true }}
            label='Last name'
            textFieldProps={{ variant: 'outlined', fullWidth: true }}
          />
        </Grid>
        <Grid xs={6} sm={4} md={2} sx={{ alignSelf: 'center' }}>
          <LoadingButton
            type='submit'
            disabled={!isValid || !isDirty}
            loading={isSubmitting}
            sx={{ maxHeight: 34 }}
          >
            Save
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  );
}
