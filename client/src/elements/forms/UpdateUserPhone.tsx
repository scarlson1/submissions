import { LoadingButton } from '@mui/lab';
import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { useFirestore, useUser } from 'reactfire';
import { object } from 'yup';

import { User, phoneVal, usersCollection } from 'common';
import { FormikMaskField, IMask, phoneMaskProps } from 'components/forms';
import { useAsyncToast, useDocData } from 'hooks';
import { formatPhoneNumber } from 'modules/utils';

// TODO: update phone number in auth
// temporary solution only updates user doc (not auth user)

function useUpdateUserDoc(
  userId: string,
  onSuccess: (phone: string) => void,
  onError?: (msg: string, err: any) => void
) {
  const firestore = useFirestore();

  return useCallback(
    async ({ phone }: UserPhoneInputs) => {
      try {
        const userRef = doc(usersCollection(firestore), userId);
        await updateDoc(userRef, {
          phone,
        });

        onSuccess && onSuccess(phone);
      } catch (err: any) {
        let msg = `error updating phone`;
        if (err?.message) msg += ` (${err.message})`;
        onError && onError(msg, err);
      }
    },
    [firestore, userId, onSuccess, onError]
  );
}

const validation = object().shape({
  phone: phoneVal.notRequired(),
});

type UserPhoneInputs = {
  phone: string;
};

export const UpdateUserPhone = () => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { data: authUser } = useUser();
  if (!authUser) throw new Error('must be signed in');
  const { data: user } = useDocData<User>('users', authUser.uid);

  const updateUser = useUpdateUserDoc(
    authUser.uid,
    (phone) => toast.success(`phone updated to ${formatPhoneNumber(phone)}`),
    (msg) => toast.error(msg)
  );

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
      return updateUser({ phone });
    },
    [updateUser]
  );

  return (
    <Formik
      onSubmit={onSubmit}
      initialValues={{ phone: user.phone || '' }}
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
                  // required
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

// export const UpdateUserPhone = () => {
//   const toast = useAsyncToast({ position: 'top-right' });
//   const { data: user } = useUser();

//   const {
//     handleSubmit,
//     control,
//     reset,
//     formState: { isSubmitSuccessful },
//   } = useForm<UserPhoneInputs>({
//     defaultValues: {
//       phone: '',
//     },
//     values: {
//       phone: user?.phoneNumber || '',
//     },
//     resetOptions: {
//       keepDirtyValues: true, // user-interacted input will be retained
//     },
//   });

//   const { isValid, isSubmitting, isDirty } = useFormState({
//     control,
//   });

//   useEffect(() => {
//     if (isSubmitSuccessful)
//       reset({
//         phone: user?.phoneNumber || '',
//       });
//   }, [isSubmitSuccessful, reset, user?.phoneNumber]);

//   const onSubmit: SubmitHandler<UserPhoneInputs> = useCallback(async (data) => {
//     alert('TODO: change phone number handler');
//     toast.loading();
//   }, []);

//   return (
//     <Box sx={{ width: '100%' }}>
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <Grid container spacing={5}>
//           <Grid xs={8} sm={8} md={10}>
//             <RHFTextField
//               control={control}
//               name='email'
//               rules={{ required: true }}
//               label='Email'
//               textFieldProps={{ variant: 'outlined', fullWidth: true }}
//             />
//           </Grid>
//           <Grid xs={4} sm={4} md={2} sx={{ alignSelf: 'center' }}>
//             <LoadingButton
//               type='submit'
//               disabled={!isValid || !isDirty}
//               loading={isSubmitting}
//               sx={{ maxHeight: 34 }}
//             >
//               Update
//             </LoadingButton>
//           </Grid>
//         </Grid>
//       </form>
//     </Box>
//   );
// };
