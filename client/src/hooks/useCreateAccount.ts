import { useAuth } from 'context/AuthContext';
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  // fetchSignInMethodsForEmail,
  // signInWithPopup,
  linkWithCredential,
  sendEmailVerification,
  updateProfile,
  validatePassword,
} from 'firebase/auth';
import { Timestamp, doc, getFirestore, setDoc } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { User as DBUser } from 'common';
import { usersCollection } from 'common/firestoreCollections';
import { useAuthActions } from 'context';
import { FirebaseError } from 'firebase/app';
import { getErrorDetails } from 'modules/utils/helpers';
import { AUTH_ROUTES, createPath } from 'router';
// import { getProviderForProviderId } from 'modules/utils/getProviderForProviderId';
// import {
//   getErrorCode,
//   getFirebaseAuthErrorMessage,
//   getErrorDetails,
// } from 'modules/utils/errorHandler';

// list of auth error codes: https://firebase.google.com/docs/reference/js/auth#autherrorcodes

// TODO: refactor login to hook/useAuthActions (context)

interface CreatePasswordProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const useCreateAccount = () => {
  const auth = getAuth();
  const params = useParams();
  const location = useLocation();
  const { user, isSignedIn, isAnonymous } = useAuth();
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const [errCode, setErrCode] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: use useUpdateProfile hook
  const updateUserDocOnCreate = useCallback(
    async (user: User, { firstName, lastName }: { firstName: string; lastName: string }) => {
      let displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateProfile(user, { displayName });

      let userRef = doc(usersCollection(getFirestore()), user.uid);

      let initUserProperties: Partial<DBUser> = {
        displayName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // orgId: auth.tenantId || null,
        tenantId: auth.tenantId || null,
        email: user.email || null,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };
      if (auth.tenantId) initUserProperties.orgId = auth.tenantId;

      await setDoc(userRef, initUserProperties, { merge: true });

      await sendEmailVerification(user);
    },
    [auth]
  );

  const createAccount = useCallback(
    async ({ firstName, lastName, email, password }: CreatePasswordProps) => {
      setErrCode(null);
      setErrMsg(null);
      setLoading(true);

      try {
        // don't link if new user is tenant user ?? (for now - requires backend)
        if (isAnonymous && isSignedIn && user && !auth.tenantId) {
          // TODO: implement password validation in google auth
          const validPassword = await validatePassword(auth, 'some-password').catch(console.log);
          console.log('password val: ', validPassword);
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
            email.trim().toLowerCase(),
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
        // setErrMsg(getFirebaseAuthErrorMessage(err) || 'An error occurred');
        setLoading(false);
        return Promise.reject(err);
      }
    },
    [auth, isAnonymous, isSignedIn, updateUserDocOnCreate, user]
  );

  // TODO: move to it's own hook ??
  const handleEmailAuthError = useCallback(
    async (
      err: unknown,
      email: string,
      password: string,
      successRedirect: string,
      firstName?: string,
      lastName?: string
    ) => {
      console.log('AUTH ERROR: ', err);

      const { code, message: msg } = getErrorDetails(err);
      console.log(`error code: ${code}`);
      console.log(`error message: ${msg}`);

      // BLOCKING FUNCTION ERRORS:
      //    - if not tenant, email matched outstanding invite
      //    - tenant doc not found (retrieved for domain restriction)
      //    - invitation not found under tenant for email
      //    - user doc already exists with email
      if (code === 'auth/internal-error') {
        // if (msg.indexOf('Cloud Function') !== -1) {
        if (msg.indexOf('verify your email') !== -1) {
          // registration succeeded
          console.log('registration succeeded. need to handle blocking function');
          if (
            msg.indexOf('needs to be verified') !== -1 ||
            msg.indexOf('verify your email') !== -1
          ) {
            // toast.info('Email verification required');
            toast('Email verification required');

            // TODO: use createPath
            return navigate(
              `/auth/login${
                params.tenantId ? `/${params.tenantId}` : ''
              }?email=${encodeURIComponent(email)}`,
              {
                state: { ...location.state },
              }
            );
          }
          // TODO: handle other blocking fn errors, if any

          // TODO: figure out how to update user name - handle in blocking fn ??
          // await updateUserDocOnCreate(userCreateRes, { firstName, lastName });
        }
        if (msg.indexOf('ALREADY_EXISTS') !== -1 || msg.indexOf('already exists') !== -1) {
          let msg = 'Account already exists.';
          if (msg.indexOf('click link in email') !== -1) {
            msg += ' Check your email to move account to new org.';
          } else msg += ' Please sign in.';

          return toast.error(msg);
        }
        if (msg.indexOf('tenant doc not found') !== -1) {
          return toast.error('Tenant not found. Please verify the ID in the URL is correct.');
        }
        if (msg.indexOf('Unauthorized email') !== -1) {
          return toast.error(
            `Org has email domain restrictions enabled that do not match "@${email.split('@')[1]}"`,
            { duration: 6000 }
          );
        }
        if (msg.indexOf('Invitation required') !== -1) {
          return toast.error(
            `Invite required to join org. Please contact the organization to create an invite.`,
            { duration: 6000 }
          );
        }
        // }
        if (msg.indexOf('Email matched invite') !== -1) {
          return toast.error(
            `Your email matched an outstanding invite. Please check your inbox and use the provided link.`
          );
        }
        if (msg.indexOf('Cloud function deadline exceeded') !== -1) {
          // s7nQCvsiarxC5Azk1CXSsLgVfPxF

          console.log('Blocking function deadline exceeded. Retrying createAccount');
          return createAccount({
            email,
            password,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
          });
          // return toast('Timeout error. Please try again!');
        }

        toast.error(`Auth error: ${code}`);
        // Emulator doesn't return response with 'Cloud Function' added || above as work around
        // Firebase: ((HTTP request to http://127.0.0.1:5001/idemand-dev/us-central1/beforeSignIn returned HTTP error 400: {"error":{"message":"Please verify your email before proceeding (atest@idemandinsurance.com)","status":"INVALID_ARGUMENT"}})) (auth/internal-error).
      } else if (code === 'auth/email-already-in-use') {
        if (!isAnonymous) {
          toast.error(`Account with email ${email} already exists. Please login.`);
          // TODO: forward success redirect, if in state (move logic to this hook from component?)
          navigate(
            createPath({
              path: AUTH_ROUTES.LOGIN,
              params: { tenantId: params.tenantId || undefined },
              search: { email },
            }),
            {
              state: { ...location.state },
            }
          );
          // navigate(`/auth/login/${params.tenantId || ''}?email=${encodeURIComponent(email)}`, {
          //   state: { ...location.state },
          // });
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
    [isAnonymous, logout, navigate, location, params, createAccount]
  );

  return useMemo(
    () => ({
      createAccount,
      handleEmailAuthError,
      errMsg,
      errCode,
      loading,
    }),
    [createAccount, handleEmailAuthError, errMsg, errCode, loading]
  );

  // return { ...memoizedValues };
};
