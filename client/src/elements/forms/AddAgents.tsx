import { useFormikContext } from 'formik';

import { FormikFieldArray, IMask, phoneMaskProps } from 'components/forms';

export interface AddAgentsProps {}

export const AddAgents = (props: AddAgentsProps) => {
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
          inputType: 'mask',
          maskComponent: IMask,
          componentProps: {
            inputProps: { maskProps: phoneMaskProps },
          },
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
