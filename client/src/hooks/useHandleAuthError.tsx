import { useCallback } from 'react';
import {
  AuthError,
  AuthErrorCodes,
  getAuth,
  MultiFactorError,
  OperationType,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useFunctions } from 'reactfire';

import { LoginValues } from 'views/Login';
import { getTenantIdFromEmail } from 'modules/api';
import { useAsyncToast } from './useAsyncToast';
// import { useMultiFactorAuth } from 'hooks/auth';

// TODO: combine all auth error handling here - microsoft, google, email, etc.
// TODO: handle each error code. If resolves error, do not return err / promise.reject

export const useHandleAuthError = () => {
  const functions = useFunctions();
  const auth = getAuth();
  // const { handleMFA } = useMultiFactorAuth({});
  const toast = useAsyncToast();

  const toastGenericError = useCallback(() => {
    toast.error('An error occured. See console for details.');
  }, [toast]);

  /**
   * Search users collection in case user is a tenant auth user
   * @param {AuthError} err
   * @param {LoginValues}
   * @returns {UserCredential}
   * */
  const handleUserNotFound = useCallback(
    async (err: AuthError, { email, password }: LoginValues) => {
      try {
        console.log(`Checking for tenant with user under ${email}...`);

        const {
          data: { tenantId },
        } = await getTenantIdFromEmail(functions, { email: email.trim().toLowerCase() });
        console.log(`${email} tenantId: ${tenantId}`);

        // Set tenant ID and retry sign in
        if (!!tenantId) {
          console.log(`Setting tenantId (${tenantId}) and reauthenticating...`);
          auth.tenantId = tenantId;
          const userRes = await signInWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password.trim()
          );

          return userRes;
        } else {
          toast.error(`Account not found for ${email}`);
          return Promise.reject({ ...err });
        }
      } catch (error) {
        console.log('error getting tenantId and reauthenticating: ', error);
        let msg = 'Account not found';
        if (error instanceof FirebaseError) msg = error.message;
        // const errCode = error instanceof FirebaseError ? error.code : 'unknown';
        // const errMsg = error instanceof FirebaseError ? error.code : 'An error occurred';

        toast.error(msg);
        return Promise.reject({ ...err });
      }
    },
    [auth, functions, toast]
  );

  const handleInternalError = useCallback(
    (err: AuthError, values?: LoginValues) => {
      // Error thrown by auth blocking function
      if (err.message.indexOf('Cloud Function') !== -1) {
        toast.info('Verification required. Please check your email.');
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
    [toastGenericError, toast]
  );

  // const handleCredentialAlreadyInUse = useCallback(
  //   (err: AuthError) => {
  //     // providerId: error._tokenResponse.providerId
  //     toast.warn(`Credential is already in use (${err.customData.email}).`);
  //     return Promise.reject({ ...err });
  //   },
  //   [toast]
  // );

  const handleUnverifiedEmail = useCallback(
    async (err: AuthError) => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        // Need to verify email first before enrolling second factors.
        toast.warn(`Email verification required. Please check your inbox.`);
      } else {
        toast.warn(`Email verification required.`);
      }

      return Promise.reject({ ...err });
    },
    [auth, toast]
  );

  const handleDefault = useCallback(
    (err: AuthError) => {
      let msg = `An error occurred. See console for details`;
      if (err.message) msg += ` (err.message)`;
      toast.error(msg);

      return Promise.reject({ ...err });
    },
    [toast]
  );

  const handleRejectErr = useCallback(
    (msg: string, err: AuthError) => {
      toast.error(msg);

      return Promise.reject({ ...err });
    },
    [toast]
  );

  const handleRejectWarn = useCallback(
    (msg: string, err: AuthError) => {
      toast.warn(msg);

      return Promise.reject({ ...err });
    },
    [toast]
  );

  // const x = useCallback(
  //   (err: AuthError) => {
  //     toast.error('');

  //     return Promise.reject({ ...err });
  //   },
  //   [toast]
  // );

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
        case AuthErrorCodes.USER_DELETED:
          if (values && values.email) {
            return handleUserNotFound(err, values);
          }
          return Promise.reject({ ...err });
        case AuthErrorCodes.INTERNAL_ERROR:
          return handleInternalError(err, values);
        // case 'auth/multi-factor-auth-required':
        //   return handleMFA(err as MultiFactorError, recaptchaId, fallbackOpType);
        case AuthErrorCodes.NO_SUCH_PROVIDER:
          toast.error(`Provider is not set up as a provider for your account.`); //  (${providerId})
          return Promise.reject({ ...err });
        case AuthErrorCodes.CREDENTIAL_ALREADY_IN_USE:
          return handleRejectWarn(`Credential is already in use (${err.customData.email}).`, err);
        // case AuthErrorCodes.NEED_CONFIRMATION: // 'auth/account-exists-with-different-credential':
        //   return handleAccountExistsWithDifferentCredential(err);
        case AuthErrorCodes.UNVERIFIED_EMAIL:
          return handleUnverifiedEmail(err);
        case AuthErrorCodes.INVALID_EMAIL:
          return handleRejectErr('Invalid email', err);
        case AuthErrorCodes.EMAIL_EXISTS:
          return handleRejectWarn('Email already in use', err);
        case AuthErrorCodes.INVALID_PASSWORD:
          return handleRejectErr(
            'Provided credential does not match our records. Please check email/password.',
            err
          );
        case AuthErrorCodes.WEAK_PASSWORD:
          return handleRejectErr('Password is too week', err);
        case AuthErrorCodes.UNSUPPORTED_TENANT_OPERATION:
          return handleRejectErr('Unsupported operation', err);
        // return handleUnsupportedOperation(err);
        case AuthErrorCodes.USER_MISMATCH:
          return handleRejectErr('User mismatch. Please logout and try again.', err);
        // return handleUserMismatch(err);
        case AuthErrorCodes.TENANT_ID_MISMATCH:
          return handleRejectErr('Tenant ID mismatch', err);
        case AuthErrorCodes.INVALID_TENANT_ID:
          return handleRejectErr('Invalid tenant ID', err);
        case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
          return handleRejectErr('Too many attempts. Please try again later.', err);
        case AuthErrorCodes.TIMEOUT:
          return handleRejectWarn('Authentication timed out. Please try again.', err);
        case AuthErrorCodes.POPUP_BLOCKED:
          return handleRejectWarn('Popup blocked', err);
        case AuthErrorCodes.POPUP_CLOSED_BY_USER:
          return handleRejectWarn('Popup close. Action aborted.', err);
        case AuthErrorCodes.NETWORK_REQUEST_FAILED:
          return handleRejectErr(
            'Request failed. Please check your connection and try again.',
            err
          );
        case AuthErrorCodes.MFA_REQUIRED:
          return handleRejectWarn('MFA required', err);
        case AuthErrorCodes.INVALID_RECIPIENT_EMAIL:
          return handleRejectErr('Invalid recipient email', err);
        case AuthErrorCodes.INVALID_PHONE_NUMBER:
          return handleRejectErr('Invalid phone number', err);
        case AuthErrorCodes.INVALID_ORIGIN:
          return handleRejectWarn('Unauthorized domain', err);
        case AuthErrorCodes.INVALID_MFA_SESSION:
          return handleRejectErr('MFA invalid. Please refresh and try again', err);
        case AuthErrorCodes.ADMIN_ONLY_OPERATION:
          return handleRejectErr('Admin permissions required', err);
        case AuthErrorCodes.CAPTCHA_CHECK_FAILED:
          return handleRejectErr('Captcha check failed. Please refresh and try again.', err);
        default:
          // TODO: create getMessage handler to create custom messages (firebase messages not intended for user)
          return handleDefault(err);
        // return Promise.reject({ ...err });
      }
    },
    [
      handleUserNotFound,
      // handleMFA,
      handleInternalError,
      handleUnverifiedEmail,
      handleDefault,
      handleRejectErr,
      handleRejectWarn,
      toast,
    ]
  );

  return { handleError };
};
