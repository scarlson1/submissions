import { ReactElement, RefObject, cloneElement, useCallback } from 'react';
import { FormikHelpers, FormikProps } from 'formik';

import { useDialog, DialogOptions } from 'context';

interface UseDialogFormProps<T, C> {
  formComponent: ReactElement;
  getFormProps?: () => Partial<FormikProps<T>> & Partial<C>;
  // formProps?: Partial<FormikProps<T>> & Partial<C>;
  formRef: RefObject<FormikProps<T>>;
  dialogOptions?: Omit<DialogOptions, 'content' | 'onSubmit' | 'variant'>;
  onSubmit: (values: T, bag: FormikHelpers<T>) => Promise<any>;
  onSuccess?:
    | ((res: { values: T; onSubmitResult: any }) => void)
    | ((res: { values: T; onSubmitResult: any }) => Promise<void>);
  onError?: (msg: string, err: any) => void;
  onCancel?: () => void;
}

export function useDialogForm<T extends Record<string, any>, C = {}>({
  formComponent,
  getFormProps = () => ({}),
  formRef,
  dialogOptions,
  onSubmit,
  onSuccess,
  onError,
  onCancel,
}: UseDialogFormProps<T, C>) {
  const dialog = useDialog();

  const triggerSubmit = useCallback(async () => {
    await formRef.current?.submitForm();
  }, [formRef]);

  const handleSubmit = useCallback(
    async (values: T, bag: FormikHelpers<T>) => {
      try {
        const onSubmitResult = onSubmit ? await onSubmit(values, bag) : null;
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
    [dialog, onSubmit, onSuccess, onError]
  );

  // const cloned = cloneElement(formComponent, { ...formProps, onSubmit: handleSubmit });

  const promptForm = useCallback(
    async (initialValues: T) => {
      try {
        const cloned = cloneElement(formComponent, {
          ...getFormProps(),
          initialValues,
          onSubmit: handleSubmit,
        });

        const result = await dialog?.prompt({
          catchOnCancel: true,
          ...dialogOptions,
          variant: 'danger',
          content: cloned,
          onSubmit: triggerSubmit,
        });

        return result;
      } catch (err: any) {
        if (!err && onCancel) onCancel();

        if (err && onError) onError('an error occurred', err);
      }
    },
    [
      dialog,
      dialogOptions,
      onCancel,
      onError,
      triggerSubmit,
      formComponent,
      getFormProps,
      handleSubmit,
    ]
  );

  return promptForm;
}

// export function Usage() {
//   const formRef = useRef<FormikProps<PolicyChangeValues>>(null);
//   const handleSubmit = useCallback(async (values: PolicyChangeValues) => {
//     return { ...values, test: 'additional val' };
//   }, []);

//   const promptForm = useDialogForm<PolicyChangeValues, PolicyChangeFormProps>({
//     formComponent: (
//       <PolicyChangeForm initialValues={initialVals} formRef={formRef} onSubmit={handleSubmit} />
//     ),
//     getFormProps: () => ({ initialValues: initialVals }),
//     formRef,
//     dialogOptions: {
//       title: 'Usage example form',
//       slotProps: { dialog: { maxWidth: 'md' } },
//     },
//     onSubmit: handleSubmit,
//     onSuccess: (vals) => {
//       console.log('on success: ', vals);
//     },
//     onError: (msg: string) => {
//       console.log('on err: ', msg);
//     },
//     onCancel: () => {
//       console.log('on cancel');
//     },
//   });

//   const startTest = useCallback(async () => {
//     try {
//       let res = await promptForm(initialVals);
//       console.log('promp form result: ', res);
//     } catch (err: any) {
//       console.log('prompt err: ', err);
//     }
//   }, [promptForm]);

//   return <Button onClick={startTest}>Dialog Test</Button>;
// }
