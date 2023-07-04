import { useCallback } from 'react';
import {
  linkWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  UserCredential,
  // MultiFactorError,
  reauthenticateWithPopup,
  AuthProvider,
  PopupRedirectResolver,
  getAuth,
  // getAdditionalUserInfo,
  // AdditionalUserInfo,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { setDoc, doc, getFirestore } from 'firebase/firestore';

// import { auth, db } from 'firebaseConfig';
import { useAuth } from 'modules/components/AuthContext';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { getProviderForProviderId } from 'modules/utils/getProviderById';
import { toast } from 'react-hot-toast';
import { getRedirectPath } from 'modules/utils/helpers';
import InputDialog from 'components/InputDialog';
import { AuthProviders } from 'common/types';
// import { useMultiFactorAuth } from './useMultiFactorAuth';

// TODO: create useLinkAccount hook

const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

interface UseSocialAuthProps {
  onSuccess?: (userCred: UserCredential) => void;
  onError?: (err: any, providerName?: string) => void;
  skipRedirect?: boolean;
}

export const useSocialAuth = ({ onSuccess, onError, skipRedirect }: UseSocialAuthProps) => {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAnonymous } = useAuth();
  // const { handleMFA } = useMultiFactorAuth({});
  const confirm = useConfirmation();

  const handleReturnUserOrRedirect = useCallback(
    (userCred: UserCredential) => {
      if (!!skipRedirect) return userCred;
      navigate(getRedirectPath(location), { replace: true });
    },
    [location, navigate, skipRedirect]
  );

  // TODO: split error handling into separate functions ??
  const handleError = useCallback(
    async (err: FirebaseError, providerName: AuthProviders) => {
      const { code, message } = err;
      console.log('Auth Error: ', `${code} - ${message}`);

      try {
        if (code === 'auth/account-exists-with-different-credential') {
          // @ts-ignore
          const { credential, email } = err;
          console.log('email: ', email);
          console.log('cred: ', credential);

          const methods = await fetchSignInMethodsForEmail(auth, email);
          console.log('methods: ', methods);
          if (methods[0] === 'password') {
            let password = await confirm({
              catchOnCancel: false,
              variant: 'danger',
              title: 'Link Account',
              description: 'Please enter your password to link a new authentication provider.',
              component: (
                <InputDialog
                  onAccept={() => {}}
                  onClose={() => {}}
                  open={false}
                  inputProps={{ type: 'password', label: 'Password', name: 'password' }}
                />
              ),
            });
            if (!password) return;
            const emailSignInResult = await signInWithEmailAndPassword(auth, email, password);
            const userCred = await linkWithCredential(emailSignInResult.user, credential);

            if (onSuccess) onSuccess(userCred);
            toast.success(`${providerName} auth successfully linked to your account!`);

            return handleReturnUserOrRedirect(userCred);
          }

          // All the other cases are external providers.
          const provider = getProviderForProviderId(methods[0]);
          if (!provider) {
            console.log('getProviderForProviderId did not return a match');
            toast.error('Account already exists.');
            return;
          }

          console.log(`Linking provider ${provider} to existing account...`);
          // User has account. Verify they want to link new account.
          try {
            confirm({
              variant: 'danger',
              title: 'Confirm you want to link to existing account',
              description: `You already have an account. Please confirm whether you would like to continue to add ${providerName} as an authentication option.`,
              catchOnCancel: true,
            });
          } catch (err) {
            return;
          }

          const providerResult = await signInWithPopup(auth, provider);
          // Remember that the user may have signed in with an account that has a different email address than the first one. Link credential.
          const linkResult = await linkWithCredential(providerResult.user, credential);
          console.log('linked providers: ', linkResult);
          toast.success(`${providerName} auth successfully linked to your account`);
          if (onSuccess) onSuccess(linkResult);

          return handleReturnUserOrRedirect(linkResult);
        }
        // if (code === 'auth/multi-factor-auth-required') {
        //   // TODO: integrate with useHandleAuthError ??
        //   // https://cloud.google.com/identity-platform/docs/work-with-mfa-users#re-authenticating_a_user

        //   const userCred = await handleMFA(err as MultiFactorError);
        //   if (userCred) {
        //     console.log('Provider MFA success: ', userCred);
        //     if (onSuccess) onSuccess(userCred);
        //     return handleReturnUserOrRedirect(userCred);
        //   } else {
        //     toast.error('Multi-factor auth unsuccessful.');
        //   }
        // }
        if (code === 'auth/email-already-in-use') {
          toast.error('Email already in use. Please login.');
          return;
        }
        if (code === 'auth/internal-error') {
          let alreadyExists = message.includes('ALREADY_EXISTS');
          let toastMsg = alreadyExists ? 'account already exists' : 'An error occurred';

          toast.error(toastMsg);
          return;
        }
        // TODO: return error ?? allow handle on case by case basis by calling function ??
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
        // if (code === 'auth/credential-already-in-use') {}

        toast.error(message);
        return;
      } catch (error) {
        console.log('Error handling error => ', err);
        if (onError) {
          onError(err, providerName);
          return;
        } else {
          const errCode = error instanceof FirebaseError ? error.code : 'unknown';
          toast.error(`An error occurred. See console for details (${errCode})`);
          return;
        }
      }
    },
    [auth, handleReturnUserOrRedirect, onSuccess, onError, confirm]
  );

  // TODO: use shared logic with linking any new provider
  const linkAnonymous = useCallback(
    async (provider: OAuthProvider | GoogleAuthProvider) => {
      try {
        const result = await linkWithPopup(user!, provider);

        await setDoc(
          doc(db, 'users', result.user.uid),
          {
            displayName: result.user.displayName,
            email: result.user.email,
            phone: result.user.phoneNumber,
            photoURL: result.user.photoURL,
          },
          { merge: true }
        );

        if (onSuccess) onSuccess(result);
        handleReturnUserOrRedirect(result);
        return result;
      } catch (err) {
        console.log('error: ', err);

        if (err instanceof FirebaseError)
          return handleError(err, provider.providerId as AuthProviders);
        if (onError) onError(err, 'Microsoft');

        return;
      }
    },
    [db, handleReturnUserOrRedirect, onSuccess, onError, handleError, user]
  );

  // can add scopes (ex: https://www.googleapis.com/auth/user.birthday.read)
  // provider.addScope('https://www.googleapis.com/auth/user.birthday.read')
  // https://stackoverflow.com/a/65515176
  // https://developers.google.com/people/quickstart/js?hl=en_US
  const loginWithGoogle = useCallback(async () => {
    if (isAnonymous && user) {
      // TODO: prompt for confirmation ??
      // try {
      return linkAnonymous(googleProvider);
      // } catch (err) {
      //   if (err instanceof FirebaseError) return handleError(err, 'microsoft.com');
      //   if (onError) onError(err, 'Microsoft');
      // }
    }

    try {
      const loginResult = await signInWithPopup(auth, googleProvider);
      console.log('google auth result: ', loginResult);

      // Google Access Token. You can use it to access the Google API. (cred.accessToken)
      const credential = GoogleAuthProvider.credentialFromResult(loginResult);
      console.log('credential: ', credential);

      if (onSuccess) onSuccess(loginResult);
      return handleReturnUserOrRedirect(loginResult);
    } catch (err) {
      if (err instanceof FirebaseError) return handleError(err, 'google.com'); // 'Google');
      if (onError) onError(err, 'Google');
    }
  }, [
    auth,
    handleError,
    handleReturnUserOrRedirect,
    linkAnonymous,
    onSuccess,
    onError,
    user,
    isAnonymous,
  ]);

  const loginWithMicrosoft = useCallback(async () => {
    if (isAnonymous && user) {
      // TODO: prompt for confirmation ??
      // try {
      return linkAnonymous(microsoftProvider);
      // } catch (err) {
      //   if (err instanceof FirebaseError) return handleError(err, 'microsoft.com');
      //   if (onError) onError(err, 'Microsoft');
      // }
    }

    try {
      const authResult: UserCredential = await signInWithPopup(auth, microsoftProvider);
      console.log('microsoft UserCred: ', authResult);

      // Check if new user (not currently doing anything with response)
      // can use for welcome notification / UI etc.
      // const additionalInfo: AdditionalUserInfo | null = getAdditionalUserInfo(authResult);
      // console.log('additionalInfo: ', additionalInfo);

      if (onSuccess) onSuccess(authResult);
      return handleReturnUserOrRedirect(authResult);
    } catch (err) {
      console.log('error: ', err);
      if (err instanceof FirebaseError) return handleError(err, 'microsoft.com'); // 'Microsoft');

      if (onError) onError(err, 'Microsoft');
    }
  }, [
    auth,
    handleReturnUserOrRedirect,
    handleError,
    linkAnonymous,
    onSuccess,
    onError,
    user,
    isAnonymous,
  ]);

  const reauthWithProvider = useCallback(
    async (provider: AuthProvider, resolver?: PopupRedirectResolver) => {
      try {
        if (!user) {
          throw new Error('must be signed in to reauthenticate.');
        }
        const userCred = await reauthenticateWithPopup(user, provider, resolver);
        console.log('reauth provider cred: ', userCred);
        if (onSuccess) onSuccess(userCred);
        return userCred;
      } catch (err) {
        console.log('reauth error: ', err);
        if (err instanceof FirebaseError)
          return handleError(err, provider.providerId as AuthProviders);
        if (onError) onError(err, provider.providerId);
        // return Promise.reject(err);
      }
    },
    [handleError, onError, user, onSuccess]
  );

  const reauthWithGoogle = useCallback(
    (resolver?: PopupRedirectResolver) => {
      return reauthWithProvider(googleProvider, resolver);
    },
    [reauthWithProvider]
  );

  const reauthWithMicrosoft = useCallback(
    (resolver?: PopupRedirectResolver) => {
      return reauthWithProvider(microsoftProvider, resolver);
    },
    [reauthWithProvider]
  );

  return {
    loginWithGoogle,
    loginWithMicrosoft,
    reauthWithProvider,
    reauthWithGoogle,
    reauthWithMicrosoft,
  };
};
