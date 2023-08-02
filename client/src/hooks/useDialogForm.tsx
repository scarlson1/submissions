import { ReactElement, RefObject, cloneElement, useCallback, useRef } from 'react';
import { FormikHelpers, FormikProps } from 'formik';

import { useDialog, DialogOptions } from 'context';
import { Button } from '@mui/material';
import { PolicyChangeForm, PolicyChangeValues } from 'elements/forms/PolicyChangeForm';

interface UseDialogFormProps<T> {
  formComponent: ReactElement;
  formProps: Partial<FormikProps<T>>;
  formRef: RefObject<FormikProps<T>>;
  dialogOptions: Omit<DialogOptions, 'content' | 'onSubmit' | 'variant'>;
  onSubmit: ((values: T) => any) | ((values: T) => Promise<any>);
  onSuccess?:
    | ((res: { values: T; onSubmitResult: any }) => void)
    | ((res: { values: T; onSubmitResult: any }) => Promise<void>);
  onError?: (msg: string, err: any) => void;
}

// export function useDialogForm<T extends Record<string, any>>(
//   config: DialogOptions,
//   formRef: RefObject<FormikProps<T>>,
//   onSubmit: ((values: T) => void) | ((values: T) => Promise<void>),
//   onSuccess?:
//     | ((res: { values: T; onSubmitResult: any }) => void)
//     | ((res: { values: T; onSubmitResult: any }) => Promise<void>),
//   onError?: (msg: string, err: any) => void
// ) {

export function useDialogForm<T extends Record<string, any>>({
  formComponent,
  formProps,
  formRef,
  dialogOptions,
  onSubmit,
  onSuccess,
  onError,
}: UseDialogFormProps<T>) {
  const dialog = useDialog();

  const triggerSubmit = useCallback(async () => {
    await formRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: T, bag: FormikHelpers<T>) => {
      try {
        const onSubmitResult = onSubmit ? await onSubmit(values) : null;
        const result = { values, onSubmitResult };

        if (onSuccess) onSuccess(result);
        dialog?.handleAccept(result);
        return result;
      } catch (err: any) {
        let msg = `Error handling submission`;
        if (err?.message) msg = err.message;
        if (onError) onError(msg, err);
      }
    },
    [dialog]
  );

  const cloned = cloneElement(formComponent, { ...formProps, onSubmit: handleSubmit });

  const promptForm = useCallback(async () => {
    try {
      return await dialog?.prompt({
        catchOnCancel: true,
        ...dialogOptions,
        variant: 'danger',
        content: cloned,
        onSubmit: triggerSubmit,
      });
    } catch (err: any) {
      if (err && onError) onError('an error occurred', err);
    }
  }, [dialog]);

  return promptForm;
}

let initialVals = {
  namedInsured: {
    displayName: 'John Doe',
    email: 'asdf@aslkfj.com',
    phone: '+12342342345',
  },
  mailingAddress: {
    addressLine1: '123 Main st.',
    addressLine2: '',
    city: 'nash',
    state: 'TN',
    postal: '12345',
  },
  homeState: 'TN',
  effectiveDate: new Date(),
  expirationDate: new Date(),
  requestEffDate: new Date(),
};

export function Usage() {
  const formRef = useRef<FormikProps<PolicyChangeValues>>(null);
  const handleSubmit = useCallback(async (values: PolicyChangeValues) => {
    console.log('on submit 1: ', values);
    return { ...values, iam: 'groot' };
  }, []);

  const promptForm = useDialogForm<PolicyChangeValues>({
    formComponent: (
      <PolicyChangeForm initialValues={initialVals} formRef={formRef} onSubmit={handleSubmit} />
    ),
    formProps: {
      initialValues: initialVals,
    },
    formRef,
    dialogOptions: {
      slotProps: { dialog: { maxWidth: 'md' } },
    },
    onSubmit: async (values: PolicyChangeValues) => {
      console.log('on submit 2: ', values);
      return { ...values, iam: 'groot' };
    },
    onSuccess: (vals) => {
      console.log('on success: ', vals);
    },
    onError: (msg: string) => {
      console.log('on err: ', msg);
    },
    // catchOnCancel: true,
    // title: 'Usage example form',
  });
  // const promptForm = useDialogForm({
  //   catchOnCancel: true,
  //   title: 'Usage example form',
  //   content: (
  //     <PolicyChangeForm
  //       initialValues={{ namedInsured: { displayName: 'John Doe', email: 'asdf@aslkfj.com', phone: '+12342342345'}, mailingAddress: { addressLine1: '123 Main st.', addressLine2: '', city: 'nash', state: 'TN', postal: '12345'}, homeState: 'TN', effectiveDate: new Date(), expirationDate: new Date(), requestEffDate: new Date() }}
  //       formRef={formRef}
  //       onSubmit={async (values) => {
  //         console.log('on submit values: ', values)
  //         return {...values, iam: 'groot' }
  //       }}
  //     />
  //   )
  // }, formRef)

  const startTest = useCallback(async () => {
    try {
      let res = promptForm();
      console.log('promp form result: ', res);
    } catch (err: any) {
      console.log('prompt err: ', err);
    }
  }, []);

  return <Button onClick={startTest}>Dialog Test</Button>;
}
