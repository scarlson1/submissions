import {
  ReactElement,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@mui/material';

import { CtxDialog } from 'components';

// Option: accept onSubmit prop
// pass formikRef.current.submitForm()
// which will in submit the form --> within the submit handler trigger onAccept()

interface DialogOptions {
  onSubmit?: (values?: any) => void;
  catchOnCancel?: boolean;
  variant?: 'danger' | 'info';
  title?: React.ReactNode;
  description?: React.ReactNode;
  component?: ReactElement;
  // TODO: slots & slotsProps --> allow replacing header & actions area
}

interface DialogCtx extends DialogOptions {
  isOpen: boolean;
  prompt: (options: DialogOptions) => Promise<any>;
  handleAccept: (values?: any) => void;
  handleClose: () => void;
}

const DialogContext = createContext<DialogCtx | null>(null); // {open: false, handleAccept: noop, handleClose: noop}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) throw new Error('useDialog must be within a DialogProvider');

  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

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
      // if (options && !options.component)
      //   options.component = (
      //     <ConfirmationDialog open={false} onAccept={handleAccept} onClose={handleClose} />
      //   );
      setDialogOptions({ ...options }); // open: true

      return new Promise<any>((resolve, reject) => {
        awaitingPromiseRef.current = { resolve, reject };
      });
    },
    [awaitingPromiseRef] // , handleAccept, handleClose
  );

  const memoed = useMemo(
    () => ({
      prompt: openDialog,
      handleAccept,
      handleClose,
      isOpen: Boolean(dialogOptions) || false,
      ...(dialogOptions || {}),
    }),
    [openDialog, handleAccept, handleClose, dialogOptions]
  );

  return (
    <DialogContext.Provider value={memoed}>
      {children}
      <CtxDialog>{dialogOptions?.component ? dialogOptions.component : null}</CtxDialog>
    </DialogContext.Provider>
  );
};

export function Usage() {
  const dialog = useDialog();
  // const formikRef = useRef()

  const handleSubmit = useCallback((vals?: any) => {
    console.log('on submit values: ', vals);
    // formikRef.submitForm()
  }, []);

  const runTest = useCallback(async () => {
    const result = await dialog?.prompt({
      onSubmit: handleSubmit,
      catchOnCancel: false,
      variant: 'danger',
      title: 'Are you sure?',
      description: 'test description content',
      // component: <SomeForm innerRef={formikRef} />
    });
    console.log('DIALOG RESULT: ', result);
  }, [dialog, handleSubmit]);

  return (
    <Button variant='contained' onClick={runTest}>
      Example
    </Button>
  );
}
