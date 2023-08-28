import {
  ButtonProps,
  DialogActionsProps,
  DialogContentProps,
  DialogProps,
  DialogTitleProps,
} from '@mui/material';
import { merge } from 'lodash';
import {
  JSXElementConstructor,
  ReactNode,
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CONTEXT_DIALOG_DEFAULT_SLOTS_COMPONENTS, CONTEXT_DIALOG_DEFAULT_SLOT_PROPS } from 'common';
import { ContextDialog } from 'components';

// Option: accept onSubmit prop
// pass formikRef.current.submitForm()
// which will in submit the form --> within the submit handler trigger onAccept()

// TODO: slots:
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/DataGrid/useDataGridProps.ts
//  - pass props passed into component to "useDataGridProps" hook
//    - returns default slots, and overwrites with any provided slots (spread operator)
//  - passes the result to Root Props Context Provider

// TODO: confirmation screen ??

export interface DialogSlotsComponents {
  dialog: JSXElementConstructor<any>;
  title: JSXElementConstructor<any>;
  content: JSXElementConstructor<any>;
  actions: JSXElementConstructor<any>;
  acceptButton: JSXElementConstructor<any>;
  cancelButton: JSXElementConstructor<any>;
}

// interface TitlePropsOverrides {}
// type SlotProps<Props, Overrides> = Partial<Props & Overrides>;
type SlotPropsWithOverrides<T> = Partial<T & Record<string, any>>;

export interface DialogSlotProps {
  dialog?: SlotPropsWithOverrides<Omit<DialogProps, 'open' | 'onClose'>>;
  title?: SlotPropsWithOverrides<DialogTitleProps>;
  content?: SlotPropsWithOverrides<DialogContentProps>;
  actions?: SlotPropsWithOverrides<DialogActionsProps>;
  acceptButton?: SlotPropsWithOverrides<Omit<ButtonProps, 'onClick'>>;
  cancelButton?: SlotPropsWithOverrides<Omit<ButtonProps, 'onClick'>>;
}

export type DialogVariant = 'danger' | 'info';
export interface DialogOptions {
  onSubmit?: (values?: any, helpers?: any) => void;
  catchOnCancel?: boolean;
  variant: DialogVariant;
  title?: ReactNode; // TODO: add description (might want text above form)
  description?: ReactNode;
  content?: ReactNode;
  slots?: Partial<DialogSlotsComponents>;
  slotProps?: DialogSlotProps;
  // TODO: slots & slotsProps --> allow replacing header & actions area
}

export interface DialogCtx extends DialogOptions {
  isOpen: boolean;
  submitDisabled: boolean;
  prompt: (options: DialogOptions) => Promise<any>;
  handleAccept: (values?: any) => void;
  handleClose: () => void;
  setDisabled: (val: boolean) => void;
  slots: DialogSlotsComponents;
  slotProps: DialogSlotProps;
}

export const DialogContext = createContext<DialogCtx | null>(null);

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

  const slots = useMemo(
    () => ({
      ...CONTEXT_DIALOG_DEFAULT_SLOTS_COMPONENTS,
      ...(dialogOptions?.slots || {}),
    }),
    [dialogOptions]
  );

  const slotProps = useMemo(
    () => merge(CONTEXT_DIALOG_DEFAULT_SLOT_PROPS, dialogOptions?.slotProps || {}),
    [dialogOptions]
  );

  const memoed = useMemo<DialogCtx>(
    () => ({
      prompt: openDialog,
      handleAccept,
      handleClose,
      isOpen: Boolean(dialogOptions) || false,
      variant: 'info' as DialogVariant,
      submitDisabled,
      setDisabled: handleSubmitDisabled,
      ...(dialogOptions || {}),
      slots,
      slotProps,
    }),
    [
      openDialog,
      handleAccept,
      handleClose,
      dialogOptions,
      submitDisabled,
      slots,
      slotProps,
      handleSubmitDisabled,
    ]
  );

  return (
    <DialogContext.Provider value={memoed}>
      {children}
      <ContextDialog />
    </DialogContext.Provider>
  );
};

// function useSlots<T, P>(inProps: DialogOptions | null, defaultSlots: T, defaultSlotProps: P) {
//   const slots = useMemo(
//     () => ({
//       ...defaultSlots,
//       ...(inProps?.slots || {}),
//     }),
//     [inProps, defaultSlots]
//   );

//   const slotProps = useMemo(
//     () => merge(defaultSlotProps, inProps?.slotProps || {}),
//     [inProps, defaultSlotProps]
//   );

//   return useMemo(() => ({ slots, slotProps }), [slots, slotProps]) as { slots: T; slotProps: P };
// }

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
