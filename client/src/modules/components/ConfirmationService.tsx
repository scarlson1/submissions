import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';

import { ConfirmationDialog } from 'components';
import { DialogContentProps, DialogProps } from '@mui/material';

// TODO: set up with ID (useConfirmation('some-id')) ??

export interface ConfirmationOptions {
  catchOnCancel?: boolean;
  variant?: 'danger' | 'info';
  title?: React.ReactNode; // string;
  description?: React.ReactNode; // string
  confirmButtonText?: string;
  component?: React.ReactElement;
  dialogProps?: Partial<DialogProps>;
  dialogContentProps?: Partial<DialogContentProps>;
}

const ConfirmationContext = createContext<(options: ConfirmationOptions) => Promise<void | any>>(
  Promise.reject
);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (context === undefined)
    throw new Error('useConfirmation must be within a ConfirmationProvider');

  return context;
};

export const ConfirmationProvider = ({ children }: any) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationOptions | null>(null);

  const awaitingPromiseRef = useRef<{
    resolve: (values?: any) => void;
    reject: () => void;
  }>();

  const openConfirmation = useCallback(
    (options: ConfirmationOptions) => {
      if (options && !options.component)
        options.component = (
          <ConfirmationDialog open={false} onAccept={() => {}} onClose={() => {}} />
        );
      setConfirmationState(options);

      return new Promise<void>((resolve, reject) => {
        awaitingPromiseRef.current = { resolve, reject };
      });
    },
    [awaitingPromiseRef]
  );

  const handleClose = useCallback(() => {
    if (confirmationState?.catchOnCancel && awaitingPromiseRef.current) {
      awaitingPromiseRef.current.reject();
    }

    setConfirmationState(null);
  }, [awaitingPromiseRef, confirmationState?.catchOnCancel]);

  const handleAccept = useCallback(
    (values?: any) => {
      if (awaitingPromiseRef.current) {
        awaitingPromiseRef.current.resolve(values);
      }

      setConfirmationState(null);
    },
    [awaitingPromiseRef]
  );

  let component = useMemo(() => {
    if (!confirmationState || !confirmationState.component) return;
    return React.cloneElement(confirmationState.component, {
      ...confirmationState,
      onAccept: handleAccept,
      onClose: handleClose,
      open: Boolean(confirmationState),
    });
  }, [confirmationState, handleAccept, handleClose]);

  return (
    <>
      <ConfirmationContext.Provider value={openConfirmation} children={children} />

      {confirmationState && component}
    </>
  );
};

// USAGE
// const confirm = useConfirmation();

// const handleTest = async () => {
//   try {
//     let email = await confirm({
//       catchOnCancel: true,
//       variant: 'danger',
//       title: 'Please enter your email',
//       description: 'Your email is required to confirm your account',
//       component: <EmailDialog />,
//     });
//     console.log('EMAIL: ', email);
//   } catch (err) {
//     console.log('CANCELLED');
//   }
// };
