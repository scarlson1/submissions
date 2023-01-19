import { useCallback } from 'react';
import {
  AuthError,
  MultiFactorError,
  OperationType,
  sendEmailVerification,
  // signInWithEmailAndPassword,
} from 'firebase/auth';
// import { httpsCallable } from 'firebase/functions';
// import { FirebaseError } from 'firebase/app';
import { toast } from 'react-hot-toast';

import { auth } from 'firebaseConfig';
import { LoginValues } from 'views/Login';
// import { useMultiFactorAuth } from 'hooks/auth';

// TODO: combine all auth error handling here - microsoft, google, email, etc.

// interface GetTenantRequest {
//   email: string;
// }
// interface GetTenantResponse {
//   tenantId: string;
// }

// TODO: handle each error code. If resolves error, do not return err / promise.reject

export const useHandleAuthError = () => {
  // const { handleMFA } = useMultiFactorAuth({});

  const toastGenericError = useCallback(() => {
    toast.error('An error occured. See console for details.');
  }, []);

  const handleUserNotFound = useCallback((err: AuthError, { email, password }: LoginValues) => {
    toast.error('User not found');

    return Promise.reject(err);
  }, []);

  // const handleUserNotFound = useCallback(
  //   async (err: AuthError, { email, password }: LoginValues) => {
  //     let getTenantIdFromEmail = httpsCallable<GetTenantRequest, GetTenantResponse>(
  //       functions,
  //       'getTenantIdFromEmail'
  //     );
  //     try {
  //       console.log(`Checking for tenant with user under ${email}...`);
  //       let {
  //         data: { tenantId },
  //       } = await getTenantIdFromEmail({ email: email.trim() });
  //       console.log('tenantId: ', tenantId);

  //       if (!!tenantId) {
  //         // TODO: set tenantId in url without refreshing page ?? old comment ??
  //         console.log(`Setting tenantId (${tenantId}) and reauthenticating...`);
  //         auth.tenantId = tenantId;
  //         const userRes = await signInWithEmailAndPassword(auth, email.trim(), password.trim());

  //         return userRes;
  //       } else {
  //         return Promise.reject({ ...err });
  //       }
  //     } catch (error) {
  //       console.log('error getting tenantId and reauthenticating: ', error);
  //       const errCode = error instanceof FirebaseError ? error.code : 'unknown';
  //       const errMsg = error instanceof FirebaseError ? error.code : 'An error occurred';

  //       return Promise.reject({ code: errCode, message: errMsg });
  //     }
  //   },
  //   []
  // );

  const handleInternalError = useCallback(
    (err: AuthError, values?: LoginValues) => {
      // Error thrown by auth blocking function
      if (err.message.indexOf('Cloud Function') !== -1) {
        toast('Verification required. Please check your email.');
        if (
          err.message.indexOf('needs to be verified') !== -1 ||
          err.message.indexOf('verify your email') !== -1
        ) {
          console.log('indexOf needs to be verified or verify your email returned true');
        }
        // TODO: handle other blocking error types, if any ??
        // what do errors returned from before create look like ??
      } else if (err.message.indexOf('verify your email') !== -1) {
        toast.error('Email verification required');
      } else toastGenericError();

      return Promise.reject(err);
    },
    [toastGenericError]
  );

  const handleCredentialAlreadyInUse = useCallback((err: AuthError) => {
    // providerId: error._tokenResponse.providerId
    toast(`Credential is already in use (${err.customData.email}).`);
    return Promise.reject({ ...err });
  }, []);

  const handleUnverifiedEmail = useCallback(async (err: AuthError) => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      // Need to verify email first before enrolling second factors.
      toast(`Email verification required. Please check your inbox.`);
    }

    return Promise.reject({ ...err });
  }, []);

  const handleWrongPassword = useCallback((err: AuthError) => {
    toast('Provided credential does not match our records. Please check email/password.');
    return Promise.reject(new Error('Provided credentials do not match our records.')); // Promise.reject({ ...err });
  }, []);

  // const handleAccountExistsWithDifferentCredential = useCallback((err: AuthError) => {}, []);

  // const handleMFA = useCallback(
  //   async (err: MultiFactorError, values: LoginValues) => {
  //     try {
  //       // The user is a multi-factor user. Second factor challenge is required.
  //       const resolver = getMultiFactorResolver(auth, err);
  //       let options: RadioLabelDetailedOption[] = resolver.hints.map((hint, index) => ({
  //         primaryLabel: hint.displayName || `MFA option ${index}`,
  //         secondaryLabel: hint.factorId, // resolver.hints[index].phoneNumber,
  //         value: index.toString(), // { ...hint, index },
  //       }));
  //       console.log('hints: ', resolver.hints);
  //       console.log('options: ', options);

  //       // Ask user which second factor to use.
  //       // You can get the masked phone number via resolver.hints[selectedIndex].phoneNumber
  //       // You can get the display name via resolver.hints[selectedIndex].displayName
  //       let selectedIndex = await confirm({
  //         catchOnCancel: true,
  //         variant: 'danger',
  //         title: 'Multi-Factor Auth',
  //         description: "Please select the multi-factor option you'd like to use.",
  //         component: (
  //           <RadioInputDialog
  //             onAccept={() => {}}
  //             onClose={() => {}}
  //             open={false}
  //             options={options}
  //             confirmText='Send Code'
  //           />
  //         ),
  //       });
  //       console.log('selected hint: ', selectedIndex);
  //       selectedIndex = parseInt(selectedIndex);

  //       if (resolver.hints[selectedIndex].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
  //         // User selected a phone second factor
  //         const phoneInfoOptions = {
  //           multiFactorHint: resolver.hints[selectedIndex],
  //           session: resolver.session,
  //         };

  //         const recaptchaVerifier = new RecaptchaVerifier(
  //           'recaptcha-button',
  //           { size: 'invisible' },
  //           auth
  //         );

  //         // TODO: move to mfa hook (same logic as enable)
  //         const phoneAuthProvider = new PhoneAuthProvider(auth);
  //         let verificationId = await phoneAuthProvider.verifyPhoneNumber(
  //           phoneInfoOptions,
  //           recaptchaVerifier
  //         );

  //         let verificationCode = await confirm({
  //           catchOnCancel: true,
  //           variant: 'danger',
  //           title: 'Multi-Factor Auth',
  //           description: 'Please enter the verification code sent to your phone.',
  //           component: (
  //             <InputDialog
  //               onAccept={() => {}}
  //               onClose={() => {}}
  //               open={false}
  //               inputProps={{ label: 'Verification Code', name: 'verificationCode' }}
  //               validation={(val: string) =>
  //                 fbCodeValidation.isValidSync({ verificationCode: val })
  //               }
  //             />
  //           ),
  //         });

  //         if (!verificationCode) throw new Error('no code');
  //         // Prompt for verification code, then:
  //         const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  //         const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

  //         // Complete sign-in
  //         let usercred = await resolver.resolveSignIn(multiFactorAssertion);
  //         return usercred;
  //       } else {
  //         // unsupported second factor (only phone second factors currently supported)
  //         throw new Error('Only phone MFA currently supported');
  //       }
  //     } catch (error) {
  //       console.log('MFA ERROR: ', error);
  //       toast.warn('Multi-Factor Auth unsuccessful');
  //     }
  //   },
  //   [confirm]
  // );

  const handleError = useCallback(
    (
      err: AuthError | MultiFactorError,
      values?: LoginValues,
      recaptchaId?: string,
      fallbackOpType?: keyof typeof OperationType
    ) => {
      console.log('err code: ', err.code);
      switch (err.code) {
        case 'auth/user-not-found':
          if (values && values.email) {
            return handleUserNotFound(err, values);
          }
          return Promise.reject({ ...err });
        case 'auth/internal-error':
          return handleInternalError(err, values);
        // case 'auth/multi-factor-auth-required':
        //   return handleMFA(err as MultiFactorError, recaptchaId, fallbackOpType);
        case 'auth/no-such-provider':
          toast(`Provider is not set up as a provider for your account.`); //  (${providerId})
          return Promise.reject({ ...err });
        case 'auth/credential-already-in-use':
          return handleCredentialAlreadyInUse(err);
        // case 'auth/account-exists-with-different-credential':
        //   return handleAccountExistsWithDifferentCredential(err);
        case 'auth/unverified-email':
          return handleUnverifiedEmail(err);
        case 'auth/wrong-password':
          return handleWrongPassword(err);
        default:
          // TODO: create getMessage handler to create custom messages (firebase messages not intended for user)
          return Promise.reject({ ...err });
      }
    },
    [
      handleUserNotFound,
      // handleMFA,
      handleInternalError,
      handleCredentialAlreadyInUse,
      handleUnverifiedEmail,
      handleWrongPassword,
    ]
  );

  return { handleError };
};
