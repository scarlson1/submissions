import { LoadingButton } from '@mui/lab';
import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { object } from 'yup';

import type { User } from '@idemand/common';
import { phoneVal } from 'common';
import { FormikMaskField, IMask, phoneMaskProps } from 'components/forms';
import { useAsyncToast, useDocData, useUpdateDoc } from 'hooks';

// TODO: update phone number in auth
// requires enabling phone sign in ??
// https://firebase.google.com/docs/auth/web/phone-auth
// temporary solution only updates user doc (not auth user)
// or could use admin api to avoid SMS verification flow

const validation = object().shape({
  phone: phoneVal.notRequired(),
});

type UserPhoneInputs = {
  phone: string;
};

export const UpdateUserPhone = ({ userId }: { userId: string }) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { data: user } = useDocData<User>('users', userId);

  const { update: updateUserDoc } = useUpdateDoc<User>(
    'users',
    () => toast.success('phone updated!'),
    () => toast.error('error updating user record'),
  );

  // const updateUser = useUpdateUserDoc(
  //   authUser.uid,
  //   (phone) => toast.success(`phone updated to ${formatPhoneNumber(phone)}`),
  //   (msg) => toast.error(msg)
  // );

  // const {
  //   handleSubmit,
  //   control,
  //   reset,
  //   formState: { isSubmitSuccessful },
  // } = useForm<UserPhoneInputs>({
  //   defaultValues: {
  //     phone: '',
  //   },
  //   values: {
  //     phone: user?.phoneNumber || '',
  //   },
  //   resetOptions: {
  //     keepDirtyValues: true, // user-interacted input will be retained
  //   },
  // });

  // const { isValid, isSubmitting, isDirty } = useFormState({
  //   control,
  // });

  // useEffect(() => {
  //   if (isSubmitSuccessful)
  //     reset({
  //       phone: user?.phoneNumber || '',
  //     });
  // }, [isSubmitSuccessful, reset, user?.phoneNumber]);

  // const onSubmit: SubmitHandler<UserPhoneInputs> = useCallback(async (data) => {
  //   alert('TODO: change phone number handler');
  //   toast.loading();
  // }, []);
  const onSubmit = useCallback(
    async ({ phone }: UserPhoneInputs) => {
      toast.loading('updating phone...');
      // return updateUser({ phone });
      await updateUserDoc(userId, { phone });
    },
    [updateUserDoc, userId],
  );

  return (
    <Formik
      onSubmit={onSubmit}
      initialValues={{ phone: user?.phone || '' }}
      validationSchema={validation}
      enableReinitialize
    >
      {({ isValid, dirty, handleSubmit, isSubmitting, isValidating }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ width: '100%' }}>
            {/* <form onSubmit={handleSubmit(onSubmit)}> */}
            <Grid container spacing={5}>
              <Grid xs={8} sm={8} md={10}>
                <FormikMaskField
                  fullWidth
                  id='phone'
                  label='Phone'
                  name='phone'
                  maskComponent={IMask}
                  inputProps={{ maskProps: phoneMaskProps }}
                />
                {/* <RHFTextField
              control={control}
              name='phone'
              rules={{ required: true }}
              label='Phone'
              textFieldProps={{ variant: 'outlined', fullWidth: true }}
            /> */}
              </Grid>
              <Grid xs={4} sm={4} md={2} sx={{ alignSelf: 'center' }}>
                <LoadingButton
                  type='submit'
                  disabled={!isValid || !dirty}
                  loading={isSubmitting || isValidating}
                  sx={{ maxHeight: 34 }}
                >
                  Update
                </LoadingButton>
              </Grid>
            </Grid>
            {/* </form> */}
          </Box>
        </Form>
      )}
    </Formik>
  );
};
