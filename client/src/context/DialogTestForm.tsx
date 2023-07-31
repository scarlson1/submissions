// import { useCallback } from 'react';
import { Box } from '@mui/material';
import { Formik, FormikProps } from 'formik';
import * as yup from 'yup';

import { FormikTextField } from 'components/forms';
import { emailVal } from 'common';

const validation = yup.object().shape({
  name: yup.string().required(),
  email: emailVal,
});

interface TestVals {
  name: string;
  email: string;
}

interface DialogTestFormProps extends Partial<FormikProps<TestVals>> {
  onSubmit: (values: any, helpers: any) => void;
  formRef?: any;
}

export const DialogTestForm = ({
  onSubmit,
  initialValues = { name: '', email: '' },
  formRef,
  ...props
}: DialogTestFormProps) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      innerRef={formRef}
      validationSchema={validation}
      {...props}
    >
      {(props) => (
        <Box>
          <FormikTextField name='name' label='name' fullWidth sx={{ my: 2 }} />
          <FormikTextField name='email' label='email' fullWidth sx={{ my: 2 }} />
        </Box>
      )}
    </Formik>
  );
};

// let res = await FakeAPICall();
// console.log('fake api res: ', res);
// let count = 1;
// function FakeAPICall() {
//   return new Promise((res, rej) => {
//     setTimeout(() => {
//       count++;
//       if (count % 3 === 0) rej('something went wrong');
//       return res('res value');
//     }, 2000);
//   });
// }
