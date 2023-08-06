import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ButtonProps,
  DialogActionsProps,
  DialogContentProps,
  DialogProps,
  DialogTitleProps,
} from '@mui/material';

import { ContextDialog } from 'components';

// Option: accept onSubmit prop
// pass formikRef.current.submitForm()
// which will in submit the form --> within the submit handler trigger onAccept()

// TODO: slots:
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/DataGrid/useDataGridProps.ts

interface SlotProps {
  dialog: Omit<DialogProps, 'open' | 'onClose'>;
  title: DialogTitleProps;
  content: DialogContentProps;
  actions: DialogActionsProps;
  acceptButton: Omit<ButtonProps, 'onClick'>;
  cancelButton: Omit<ButtonProps, 'onClick'>;
}
type DialogVariant = 'danger' | 'info';
export interface DialogOptions {
  onSubmit?: (values?: any, helpers?: any) => void;
  catchOnCancel?: boolean;
  variant: DialogVariant;
  title?: ReactNode; // TODO: add description (might want text above form)
  description?: ReactNode;
  content?: ReactNode;
  // component?: ReactElement;
  slotProps?: Partial<SlotProps>;
  // TODO: slots & slotsProps --> allow replacing header & actions area
}

interface DialogCtx extends DialogOptions {
  isOpen: boolean;
  submitDisabled: boolean;
  prompt: (options: DialogOptions) => Promise<any>;
  handleAccept: (values?: any) => void;
  handleClose: () => void;
  setDisabled: (val: boolean) => void;
}

const DialogContext = createContext<DialogCtx | null>(null); // {open: false, handleAccept: noop, handleClose: noop}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) throw new Error('useDialog must be within a DialogProvider');

  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const awaitingPromiseRef = useRef<{
    resolve: (values?: any) => void;
    reject: () => void;
  }>();

  const handleAccept = useCallback(
    (values: any) => {
      if (awaitingPromiseRef.current) awaitingPromiseRef.current.resolve(values);

      setDialogOptions(null);
    },
    [awaitingPromiseRef]
  );

  const handleClose = useCallback(() => {
    if (dialogOptions?.catchOnCancel && awaitingPromiseRef.current)
      awaitingPromiseRef.current.reject();

    setDialogOptions(null);
  }, [awaitingPromiseRef, dialogOptions]);

  const openDialog = useCallback(
    (options: DialogOptions) => {
      setDialogOptions({ ...options });

      return new Promise<any>((resolve, reject) => {
        awaitingPromiseRef.current = { resolve, reject };
      });
    },
    [awaitingPromiseRef]
  );

  const handleSubmitDisabled = useCallback(
    (val: boolean) => {
      if (!dialogOptions) return;
      setSubmitDisabled(val);
    },
    [dialogOptions]
  );

  const memoed = useMemo(
    () => ({
      prompt: openDialog,
      handleAccept,
      handleClose,
      isOpen: Boolean(dialogOptions) || false,
      variant: 'info' as DialogVariant,
      submitDisabled,
      setDisabled: handleSubmitDisabled,
      ...(dialogOptions || {}),
    }),
    [openDialog, handleAccept, handleClose, dialogOptions, submitDisabled, handleSubmitDisabled]
  );

  return (
    <DialogContext.Provider value={memoed}>
      {children}
      <ContextDialog />
      {/* <CtxDialog>{dialogOptions?.component ? dialogOptions.component : null}</CtxDialog> */}
    </DialogContext.Provider>
  );
};

// export function Usage() {
//   const dialog = useDialog();
//   const formikRef = useRef<FormikProps<any>>(null);

//   const handleSubmit = useCallback(async () => {
//     const submitResult = await formikRef.current?.submitForm();
//     console.log('submitResult: ', submitResult); // dont call handleAccept here
//   }, []);

//   const formOnSubmit = useCallback(
//     async (vals: any, { setSubmitting }: FormikHelpers<any>) => {
//       try {
//         console.log('form on submit: ', vals);
//         setSubmitting(false);
//         dialog?.handleAccept(vals); // call here b/c this only runs if validation succeeds
//         return vals;
//       } catch (err: any) {
//         console.log('err: ', err);
//         setSubmitting(false);
//       }
//     },
//     [dialog]
//   );

//   const runTest = useCallback(async () => {
//     const result = await dialog?.prompt({
//       onSubmit: handleSubmit,
//       catchOnCancel: false,
//       variant: 'danger',
//       title: 'Are you sure?',
//       // content: 'test description content',
//       // component: <SomeForm innerRef={formikRef} />
//       content: <DialogTestForm onSubmit={formOnSubmit} formRef={formikRef} />,
//       slotProps: {
//         content: { dividers: true },
//         // acceptButton: { disabled: !formikRef.current?.isValid },
//       },
//     });
//     console.log('DIALOG RESULT: ', result);
//   }, [dialog, handleSubmit, formOnSubmit]);

//   return (
//     <Button variant='outlined' color='secondary' onClick={runTest}>
//       Dialog
//     </Button>
//   );
// }
