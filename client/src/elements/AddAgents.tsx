import React from 'react';
import { useFormikContext } from 'formik';
import * as yup from 'yup';

import { FormikFieldArray } from 'components/forms';
import { emailVal, phoneVal } from 'common';

export const agentsValidation = yup.object().shape({
  agents: yup.array().of(
    yup.object().shape({
      email: emailVal,
      firstName: yup
        .string()
        .min(2, 'Please enter first name. Min 2 letters.')
        .max(40, 'Must be less than 40 characters')
        .required('Full name is required'),
      lastName: yup
        .string()
        .min(2, 'Please enter first name. Min 2 letters.')
        .max(40, 'Must be less than 40 characters')
        .required('Full name is required'),
      phone: phoneVal.required(),
      // access: yup
      //   .string()
      //   .oneOf(['admin', 'agent'], 'Please select an option')
      //   .required('Access level required'),
    })
  ),
});

export interface AddAgentsProps {}

export const AddAgents: React.FC<AddAgentsProps> = () => {
  const {
    values,
    touched,
    errors,
    // isValid,
    isSubmitting,
    isValidating,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    dirty,
  } = useFormikContext<{
    agents: { firstName: string; lastName: string; email: string; phone: string }[];
  }>();

  return (
    <FormikFieldArray
      parentField='agents'
      inputFields={[
        {
          name: 'firstName',
          label: 'First Name',
          required: true,
          inputType: 'text',
        },
        {
          name: 'lastName',
          label: 'Last Name',
          required: true,
          inputType: 'text',
        },
        {
          name: 'email',
          label: 'Email',
          required: true,
          inputType: 'text',
        },
        {
          name: 'phone',
          label: 'Phone',
          required: true,
          inputType: 'phone',
        },
        // {
        //   name: 'access',
        //   label: 'Role / Permissions',
        //   required: true,
        //   inputType: 'select',
        //   selectOptions: [
        //     {
        //       label: 'Agent',
        //       value: 'agent',
        //     },
        //     {
        //       label: 'Admin',
        //       value: 'admin',
        //     },
        //   ],
        // },
      ]}
      values={values}
      errors={errors}
      touched={touched}
      // isValid={isValid}
      isSubmitting={isSubmitting}
      isValidating={isValidating}
      dirty={dirty}
      setFieldValue={setFieldValue}
      setFieldError={setFieldError}
      setFieldTouched={setFieldTouched}
    />
  );
};
