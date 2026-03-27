import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import { passwordValidation } from 'common';
import { useAuthActions } from 'context';
import { useAsyncToast } from 'hooks';
import { useCallback, useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { object } from 'yup';
import { RHFPassword } from './FormikPassword';

const updatePasswordSchema = object()
  .shape({
    password: passwordValidation,
  })
  .required();

interface UpdatePasswordValues {
  password: string;
}

export function UpdatePasswordForm() {
  const toast = useAsyncToast({ position: 'top-right' });
  const { updateUserPassword } = useAuthActions();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitSuccessful, isDirty, isValid, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    defaultValues: {
      password: '',
    },
    values: {
      password: '',
    },
    resetOptions: {
      keepDirtyValues: false, // user-interacted input will be retained
    },
    resolver: yupResolver(updatePasswordSchema),
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        password: '',
      });
  }, [isSubmitSuccessful, reset]);

  const onSubmit: SubmitHandler<UpdatePasswordValues> = useCallback(
    async (data) => {
      toast.loading('updating...');

      try {
        await updateUserPassword(data.password);
        toast.success(`Password updated!`);
      } catch (err) {
        toast.error('Error updating email');
      }
    },
    [toast, updateUserPassword]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={5}>
          <Grid xs={8} sm={8} md={10}>
            <RHFPassword
              control={control}
              rules={{ required: true }}
              label='New Password'
              textFieldProps={{
                helperText: 'Upper & lower letters, symbol, number, and min. 8 characters',
              }}
            />
            {/* <RHFTextField
              control={control}
              name='password'
              rules={{ required: true }}
              label='New Password'
              textFieldProps={{ variant: 'outlined', fullWidth: true }}
            /> */}
          </Grid>
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
