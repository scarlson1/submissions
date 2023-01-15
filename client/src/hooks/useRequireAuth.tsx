export {};

// import { useEffect, useRef } from 'react';
// import { useAuth, CustomClaims } from 'modules/components/AuthContext';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { toast } from 'react-hot-toast';
// import { signInAnonymously, UserCredential, getAuth } from 'firebase/auth';

// import { auth } from 'firebaseConfig';

// export type CustomClaimKeys = keyof typeof CustomClaims;

// export interface UseRequireAuthProps {
//   redirectPath?: string;
//   returnToPath?: string;
//   requiredClaims?: null | CustomClaimKeys[];
//   allowAnonymous?: boolean;
//   shouldSignInAnonymously?: boolean;
//   unauthorizedCallback?: () => void;
// }

// export const useRequireAuth = ({
//   redirectPath = '/auth/login',
//   returnToPath,
//   requiredClaims,
//   allowAnonymous = false,
//   shouldSignInAnonymously = false,
//   unauthorizedCallback,
// }: UseRequireAuthProps) => {
//   const { error, loading, isAuthenticated, loadingInitial, isAnonymous, customClaims } = useAuth();
//   let toastId = useRef<any>(null);
//   let location = useLocation();
//   const navigate = useNavigate();

//   let user = getAuth().currentUser;

//   const notify = (msg: string, options?: any) => (toastId.current = toast(msg, { ...options }));

//   const closeToast = () => toast.dismiss(toastId.current);

//   useEffect(() => {
//     if (loadingInitial || loading) {
//       return;
//     }

//     // if (!isAuthenticated && !!shouldSignInAnonymously) {
//     if (!(user && user.uid) && !!shouldSignInAnonymously) {
//       signInAnonymously(auth)
//         .then((userCred: UserCredential) => {
//           console.log('SIGNED IN ANONYMOUSLY: ', userCred);
//         })
//         .catch((err: unknown) => {
//           console.log('ERROR => ', err);
//         });
//     }

//     // if (!isAuthenticated && !shouldSignInAnonymously) {
//     if (!(user && user.uid) && !shouldSignInAnonymously) {
//       notify('Protected route. Please sign in or create an account', { type: toast.TYPE.INFO });

//       if (unauthorizedCallback) unauthorizedCallback();

//       navigate(redirectPath, {
//         replace: true,
//         state: { from: location, redirectPath: returnToPath },
//       });
//       return;
//     }

//     if (!allowAnonymous && isAnonymous && !shouldSignInAnonymously) {
//       notify('You need an login or create an account to access that route.', {
//         type: toast.TYPE.INFO,
//       });

//       if (unauthorizedCallback) unauthorizedCallback();

//       navigate('/auth/create-account', {
//         replace: true,
//         state: { from: location, redirectPath: returnToPath },
//       });
//       return;
//     }

//     if (requiredClaims && requiredClaims.length > 0) {
//       // checks if all claims are falsy (user does not have any of the roles in required)
//       let notAuthorized = requiredClaims.every((key) => !customClaims[CustomClaims[key]]);

//       if (!!notAuthorized) {
//         if (unauthorizedCallback) unauthorizedCallback();

//         notify(`Missing required permissions to access this route`, {
//           type: toast.TYPE.WARNING,
//           autoClose: 8000,
//         });

//         navigate(-1);
//         return;
//       }
//     }
//     closeToast();
//   }, [
//     user,
//     loading,
//     isAuthenticated,
//     loadingInitial,
//     isAnonymous,
//     customClaims,
//     requiredClaims,
//     allowAnonymous,
//     redirectPath,
//     returnToPath,
//     location,
//     shouldSignInAnonymously,
//     unauthorizedCallback,
//     navigate,
//   ]);

//   return {
//     user,
//     loading: Boolean(loadingInitial || loading),
//     error,
//     isAuthenticated,
//     isAnonymous,
//     customClaims,
//   };
// };
