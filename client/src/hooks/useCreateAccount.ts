import { useCallback, useState, useMemo } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  EmailAuthProvider,
  // fetchSignInMethodsForEmail,
  // signInWithPopup,
  linkWithCredential,
  User,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from 'modules/components/AuthContext';
import { auth } from 'firebaseConfig';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { usersCollection } from 'common/firestoreCollections';
import { FirebaseError } from 'firebase/app';
import { getErrorDetails } from 'modules/utils/helpers';
// import { getProviderForProviderId } from 'modules/utils/getProviderForProviderId';
// import {
//   getErrorCode,
//   getFirebaseAuthErrorMessage,
//   getErrorDetails,
// } from 'modules/utils/errorHandler';

// list of auth error codes: https://firebase.google.com/docs/reference/js/auth#autherrorcodes

interface CreatePasswordProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const useCreateAccount = () => {
  const { user, isAuthenticated, isAnonymous, logout } = useAuth();
  const navigate = useNavigate();

  const [errCode, setErrCode] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateUserDocOnCreate = useCallback(
    async (user: User, { firstName, lastName }: { firstName: string; lastName: string }) => {
      let displayName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, { displayName });

      let userRef = doc(usersCollection, user.uid);
      await setDoc(
        userRef,
        { displayName, firstName: firstName.trim(), lastName: lastName.trim() },
        { merge: true }
      );

      await sendEmailVerification(user);
    },
    []
  );

  const createAccount = useCallback(
    async ({ firstName, lastName, email, password }: CreatePasswordProps) => {
      setErrCode(null);
      setErrMsg(null);
      setLoading(true);

      try {
        if (isAnonymous && isAuthenticated && user) {
          console.log('linking anonymous user');
          const credential = EmailAuthProvider.credential(
            email.trim().toLowerCase(),
            password.trim()
          );
          const { user: userLinkRes } = await linkWithCredential(user, credential);

          await userLinkRes.getIdToken(true);

          await updateUserDocOnCreate(userLinkRes, { firstName, lastName });

          setLoading(false);
          return userLinkRes;
        } else {
          console.log('creating new user');
          const { user: userCreateRes } = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password.trim()
          );

          await updateUserDocOnCreate(userCreateRes, { firstName, lastName });

          setLoading(false);
          return user;
        }
      } catch (err) {
        console.log('ERROR: ', err);

        if (err instanceof FirebaseError) {
          setErrCode(err.code);
          setErrMsg(err.message);
        } else {
          setErrCode('Unknown Error');
          setErrMsg('See console for error details');
        }
        // setErrCode(getErrorCode(err));
        // setErrMsg(getFirebaseAuthErrorMessage(err) || 'An error occured');
        setLoading(false);
        return Promise.reject(err);
      }
    },
    [isAnonymous, isAuthenticated, updateUserDocOnCreate, user]
  );

  const handleEmailAuthError = useCallback(
    async (
      err: unknown,
      email: string,
      password: string,
      successRedirect: string
      // firstName?: string,
      // lastName?: string
    ) => {
      const { code, message: msg } = getErrorDetails(err);
      console.log(`error code: ${code}`);
      console.log(`error message: ${msg}`);

      // if (code !== 'auth/internal-error' && msg.indexOf('Cloud Function') !== -1) {
      //   console.log('BLOCKING FUNCTION ERROR');
      // } else {
      //   // registration succeeded
      // }
      if (code === 'auth/internal-error') {
        if (msg.indexOf('Cloud Function') !== -1 || msg.indexOf('verify your email') !== -1) {
          // registration succeeded
          console.log('registration succeeded. need to handle blocking function');
          if (
            msg.indexOf('needs to be verified') !== -1 ||
            msg.indexOf('verify your email') !== -1
          ) {
            toast('Email verification required');

            return navigate(`/auth/login?email=${encodeURIComponent(email)}`);
          }
          // TODO: handle other blocking fn errors, if any
          // what do errors returned from before create look like ??

          // TODO: figure out how to update user name - handle in blocking fn ??
          // await updateUserDocOnCreate(userCreateRes, { firstName, lastName });
        }
        // Emulator doesn't return response with 'Cloud Function' added || above as work around
        // Firebase: ((HTTP request to http://127.0.0.1:5001/idemand-dev/us-central1/beforeSignIn returned HTTP error 400: {"error":{"message":"Please verify your email before proceeding (atest@idemandinsurance.com)","status":"INVALID_ARGUMENT"}})) (auth/internal-error).
      } else if (code === 'auth/email-already-in-use') {
        if (!isAnonymous) {
          toast.error(`Account with email ${email} already exists. Please login.`);
          // TODO: forward success redirect, if in state (move logic to this hook from component?)
          navigate('/auth/login');
          // try {
          //   // TODO: set up to handle below when attempting to sign in with provider instead of email ??
          //   // SignInMethod.EMAIL_PASSWORD vs SignInMethod.EMAIL_LINK.
          // TODO: need to create get provider for methodId ??
          //   // TODO: fix getProviderForProviderId to handle each option
          //   const methods = await fetchSignInMethodsForEmail(auth, email);

          //   var provider = getProviderForProviderId(methods[0]);
          //   if (!provider) {
          //     console.log('getProviderForProviderId did not return a match');
          //     return;
          //   }
          //   // toast error if only sign in provider is password ?? otherwise results in auth/argument-error ??
          //   // const emailProviderAlreadyEnabled = methods.some((m) => m.)
          //   if ()

          //   // TODO: useConfirmation provider
          //   if (
          //     !window.confirm(
          //       'You already have an account. Would you link to link email/password auth with your existing account?'
          //     )
          //   )
          //     return;

          //   console.log('ATTEMPTING TO LINK PROVIDER');
          //   const pwCredential = EmailAuthProvider.credential(email, password);

          //   const result = await signInWithPopup(auth, provider);
          //   const userCred = await linkWithCredential(result.user, pwCredential);

          //   console.log('linked success userCred: ', userCred);
          //   toast.info('Email/password auth successfully linked to your account!');

          //   navigate(successRedirect, { replace: true });
          // } catch (error) {
          //   console.log('LINK ACCOUNT ERROR: ', error);
          //   let errorCode = getErrorCode(err);
          //   setErrCode(errorCode);
          //   setErrMsg(getFirebaseAuthErrorMessage(error));

          //   if (errorCode === 'auth/popup-blocked') {
          //     toast.error(
          //       'Popup to sign into your Authentication Provider was blocked by your browser.'
          //     );
          //   } else {
          //     toast.error(`Auth error: ${errorCode}`);
          //   }
          // }
        } else {
          // TODO: abstract this out to handle in quote component ?? return err
          toast.error(
            `Account with email ${email} already exists. Please sign into your existing account and start a new quote.`,
            { duration: 8000 }
          );
          logout(() =>
            navigate('/auth/login', {
              replace: true,
              state: { redirectPath: '/application/flood' },
            })
          );
        }
      } else if (code === 'auth/network-request-failed') {
        toast.error('Timeout error - server took too long to respond.');
      } else {
        toast.error(`Auth error: ${code}`);
      }
    },
    [isAnonymous, logout, navigate]
  );

  let memoizedValues = useMemo(
    () => ({
      createAccount,
      handleEmailAuthError,
      errMsg,
      errCode,
      loading,
    }),
    [createAccount, handleEmailAuthError, errMsg, errCode, loading]
  );

  return { ...memoizedValues };
};
