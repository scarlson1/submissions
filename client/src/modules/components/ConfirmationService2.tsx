export {};
// import {
//   createContext,
//   useContext,
//   useState,
//   useRef,
//   useCallback,
//   useMemo,
//   cloneElement,
//   ReactNode,
//   ReactElement,
// } from 'react';
// import { ButtonProps, DialogContentProps, DialogProps } from '@mui/material';

// import { ConfirmationDialog } from 'components';

// // TODO: set up with ID (useConfirmation('some-id')) ??

// // TODO: optional onSubmit & onError to confirm instead of the component ?? in onAccept ==> try/catch confirmationState.onSubmit && onSubmit(values)
// // if fails, call onError

// export interface ConfirmationOptions {
//   catchOnCancel?: boolean;
//   variant?: 'danger' | 'info';
//   title?: ReactNode;
//   description?: React.ReactNode;
//   confirmButtonText?: string;
//   confirmButtonProps?: Partial<ButtonProps>;
//   cancelButtonProps?: Partial<ButtonProps>;
//   component?: ReactElement;
//   dialogProps?: Partial<DialogProps>; // TODO: move componentProps as object (like slotProps) ?? or pass as children ??
//   dialogContentProps?: Partial<DialogContentProps>;
//   // TODO: handle forms (onSubmit / onError) --> move from passing to component to passing in confirmation options
//   onSubmit?: () => any | (() => Promise<any>);
//   onError?: (msg: string, err: any) => void;
//   // | ((msg: string, err: any) => Promise<void>);
//   onCancel?: () => void;
// }

// const ConfirmationContext = createContext<(options: ConfirmationOptions) => Promise<void | any>>(
//   Promise.reject
// );

// export const useConfirmation2 = () => {
//   const context = useContext(ConfirmationContext);
//   if (context === undefined)
//     throw new Error('useConfirmation must be within a ConfirmationProvider');

//   return context;
// };

// export const ConfirmationProvider2 = ({ children }: any) => {
//   const [confirmationState, setConfirmationState] = useState<ConfirmationOptions | null>(null);

//   const awaitingPromiseRef = useRef<{
//     resolve: (values?: any) => void;
//     reject: () => void;
//   }>();

//   const handleClose = useCallback(() => {
//     if (confirmationState?.catchOnCancel && awaitingPromiseRef.current) {
//       awaitingPromiseRef.current.reject();
//     }

//     setConfirmationState(null);
//   }, [awaitingPromiseRef, confirmationState?.catchOnCancel]);

//   const handleResolve = useCallback(
//     (values?: any) => {
//       if (awaitingPromiseRef.current) {
//         awaitingPromiseRef.current.resolve(values);
//       }

//       setConfirmationState(null);
//     },
//     [awaitingPromiseRef]
//   );

//   // TODO: finish transitioning components over to passing onSubmit in optionns
//   const handleAccept = useCallback(async () => {
//     if (confirmationState?.onSubmit) {
//       try {
//         const result = await confirmationState.onSubmit();

//         handleResolve(result);
//       } catch (err: any) {
//         confirmationState.onError && confirmationState.onError('An error occurred', err);
//       }
//     } else {
//       handleResolve();
//     }
//   }, [confirmationState, handleResolve]); // awaitingPromiseRef,

//   const openConfirmation = useCallback(
//     (options: ConfirmationOptions) => {
//       if (options && !options.component)
//         options.component = (
//           <ConfirmationDialog
//             open={false}
//             // onAccept={options.onSubmit || handleAccept}
//             onAccept={handleAccept}
//             onClose={handleClose}
//           />
//         );
//       setConfirmationState(options);

//       return new Promise<void>((resolve, reject) => {
//         awaitingPromiseRef.current = { resolve, reject };
//       });
//     },
//     [awaitingPromiseRef, handleAccept, handleClose]
//   );

//   // const handleAccept = useCallback((values?: any) => {
//   //   if (awaitingPromiseRef.current) {
//   //     awaitingPromiseRef.current.resolve(values);
//   //   }

//   //   setConfirmationState(null);
//   // }, [awaitingPromiseRef]);

//   // const handleAccept = useCallback(
//   //   async (values: any, helpers: FormikHelpers<any>) => {
//   //     if (confirmationState?.onSubmit) {
//   //       try {
//   //         await confirmationState?.onSubmit(values, helpers)

//   //         if (awaitingPromiseRef.current) {
//   //           awaitingPromiseRef.current.resolve(values);
//   //         }
//   //         setConfirmationState(null);
//   //       } catch (err: any) {
//   //         confirmationState?.onError && confirmationState.onError('Error submitting form', err);
//   //       }
//   //     }

//   //   },
//   //   [awaitingPromiseRef, confirmationState]
//   // );

//   const component = useMemo(() => {
//     if (!confirmationState || !confirmationState.component) return;
//     return cloneElement(confirmationState.component, {
//       ...confirmationState,
//       onAccept: handleAccept,
//       onClose: handleClose,
//       open: Boolean(confirmationState),
//     });
//   }, [confirmationState, handleAccept, handleClose]);

//   return (
//     <>
//       <ConfirmationContext.Provider value={openConfirmation} children={children} />

//       {confirmationState && component}
//     </>
//   );
// };

// // USAGE
// // const confirm = useConfirmation();

// // const handleTest = async () => {
// //   try {
// //     let email = await confirm({
// //       catchOnCancel: true,
// //       variant: 'danger',
// //       title: 'Please enter your email',
// //       description: 'Your email is required to confirm your account',
// //       component: <EmailDialog />,
// //     });
// //     console.log('EMAIL: ', email);
// //   } catch (err) {
// //     console.log('CANCELLED');
// //   }
// // };
