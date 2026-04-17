import { useAuth } from 'context/AuthContext';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  // fetchSignInMethodsForEmail,
  // signInWithPopup,
  linkWithCredential,
  sendEmailVerification,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { User as DBUser } from '@idemand/common';
import { usersCollection } from 'common';
import { useAuthActions } from 'context';
import { getErrorDetails, logDev } from 'modules/utils';
import { AUTH_ROUTES, createPath } from 'router';
import { useAsyncToast } from './useAsyncToast';
// import { getProviderForProviderId } from 'modules/utils/getProviderForProviderId';
// import {
//   getErrorCode,
//   getFirebaseAuthErrorMessage,
//   getErrorDetails,
// } from 'modules/utils/errorHandler';

// list of auth error codes: https://firebase.google.com/docs/reference/js/auth#autherrorcodes

// TODO: refactor login to hook/useAuthActions (context)
// bread into smaller components/functions

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
  const navigate = useNavigate();
  const { user, isSignedIn, isAnonymous } = useAuth();
  const { logout } = useAuthActions();
  const toast = useAsyncToast();

  // const [errCode, setErrCode] = useState<string | null>(null);
  // const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: use useUpdateProfile hook
  const updateUserDocOnCreate = useCallback(
    async (
      user: User,
      { firstName, lastName }: { firstName: string; lastName: string },
    ) => {
      let displayName =
        `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();
      await updateProfile(user, { displayName });

      let userRef = doc(usersCollection(getFirestore()), user.uid);

      let initUserProperties: Partial<DBUser> = {
        displayName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        tenantId: auth.tenantId || null,
        email: user.email || null,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };
      if (auth.tenantId) initUserProperties.orgId = auth.tenantId;

      await setDoc(userRef, initUserProperties, { merge: true });
    },
    [auth],
  );

  const createAccount = useCallback(
    async ({ firstName, lastName, email, password }: CreatePasswordProps) => {
      // setErrCode(null);
      // setErrMsg(null);
      setLoading(true);

      try {
        // TODO: implement password validation in google auth
        // const validPassword = await validatePassword(auth, 'some-password').catch(console.log);
        // console.log('password val: ', validPassword);

        // don't link if new user is tenant user ?? (for now - requires backend)
        if (isAnonymous && isSignedIn && user && !auth.tenantId) {
          logDev('linking anonymous user');
          const credential = EmailAuthProvider.credential(
            email.trim().toLowerCase(),
            password.trim(),
          );
          const { user: userLinkRes } = await linkWithCredential(
            user,
            credential,
          );

          await userLinkRes.getIdToken(true);

          await updateUserDocOnCreate(userLinkRes, { firstName, lastName });
          await sendEmailVerification(userLinkRes);

          setLoading(false);
          return userLinkRes;
        } else {
          logDev('creating new user');
          const { user: userCreateRes } = await createUserWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password.trim(),
          );

          await updateUserDocOnCreate(userCreateRes, { firstName, lastName });
          await sendEmailVerification(userCreateRes);

          setLoading(false);
          return user;
        }
      } catch (err) {
        console.log('ERROR: ', err);

        // TODO: delete ?? could be out of sync with error handling that handles rejected promise
        // if (err instanceof FirebaseError) {
        //   setErrCode(err.code);
        //   setErrMsg(err.message);
        // } else {
        //   setErrCode('Unknown Error');
        //   setErrMsg('See console for error details');
        // }
        // setErrCode(getErrorCode(err));
        // setErrMsg(getFirebaseAuthErrorMessage(err) || 'An error occurred');
        setLoading(false);
        return Promise.reject(err);
      }
    },
    [auth, isAnonymous, isSignedIn, updateUserDocOnCreate, user],
  );

  // TODO: move to it's own hook (shared error handling with sign in) ??
  const handleEmailAuthError = useCallback(
    async (
      err: unknown,
      email: string,
      password: string,
      successRedirect: string,
      firstName?: string,
      lastName?: string,
    ) => {
      console.log('AUTH ERROR: ', err);

      const { code, message: msg } = getErrorDetails(err);
      logDev(`error code: ${code}`);
      logDev(`error message: ${msg}`);

      // BLOCKING FUNCTION ERRORS:
      //    - if not tenant, email matched outstanding invite
      //    - tenant doc not found (retrieved for domain restriction)
      //    - invitation not found under tenant for email
      //    - user doc already exists with email
      if (code === 'auth/internal-error') {
        // if (msg.indexOf('Cloud Function') !== -1) {
        if (msg.indexOf('verify your email') !== -1) {
          // registration succeeded
          logDev('registration succeeded. need to handle blocking function');
          if (
            msg.indexOf('needs to be verified') !== -1 ||
            msg.indexOf('verify your email') !== -1
          ) {
            toast.info('Email verification required');

            return navigate(
              createPath({
                path: AUTH_ROUTES.LOGIN,
                params: { tenantId: params.tenantId },
                search: { email },
              }),
              {
                state: { ...location.state },
              },
            );
          }
          // TODO: handle other blocking fn errors, if any

          // TODO: figure out how to update user name - handle in blocking fn ??
          // await updateUserDocOnCreate(userCreateRes, { firstName, lastName });
        }
        if (
          msg.indexOf('ALREADY_EXISTS') !== -1 ||
          msg.indexOf('already exists') !== -1
        ) {
          let msg = 'Account already exists.';
          if (msg.indexOf('click link in email') !== -1) {
            msg += ' Check your email to move account to new org.';
          } else msg += ' Please sign in.';

          return toast.error(msg);
        }
        if (msg.indexOf('tenant doc not found') !== -1) {
          return toast.error(
            'Tenant not found. Please verify the ID in the URL is correct.',
          );
        }
        if (msg.indexOf('Unauthorized email') !== -1) {
          return toast.error(
            `Org has email domain restrictions enabled that do not match "@${email.split('@')[1]}"`,
            { duration: 6000 },
          );
        }
        if (msg.indexOf('Invitation required') !== -1) {
          return toast.error(
            `Invite required to join org. Please contact the organization to create an invite.`,
            { duration: 6000 },
          );
        }
        // }
        if (msg.indexOf('Email matched invite') !== -1) {
          return toast.error(
            `Your email matched an outstanding invite. Please check your inbox and use the provided link.`,
          );
        }
        if (msg.indexOf('Cloud function deadline exceeded') !== -1) {
          // TODO: set variable & only retry once ??

          logDev('Blocking function deadline exceeded. Retrying createAccount');
          return createAccount({
            email,
            password,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
          });
        }

        toast.error(`Auth error: ${code}`);
      } else if (code === 'auth/email-already-in-use') {
        if (!isAnonymous) {
          toast.error(
            `Account with email ${email} already exists. Please login.`,
          );
          // TODO: forward success redirect, if in state (move logic to this hook from component?)
          navigate(
            createPath({
              path: AUTH_ROUTES.LOGIN,
              params: { tenantId: params.tenantId },
              search: { email },
            }),
            {
              state: { ...location.state },
            },
          );
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
            { duration: 8000 },
          );
          logout(() =>
            navigate('/auth/login', {
              replace: true,
              state: { redirectPath: '/application/flood' },
            }),
          );
        }
      } else if (code === 'auth/network-request-failed') {
        toast.error('Network request failed'); // 'Timeout error - server took too long to respond.'
      } else {
        toast.error(`Auth error: ${code}`);
      }
    },
    [isAnonymous, logout, navigate, location, params, toast, createAccount],
  );

  return useMemo(
    () => ({
      createAccount,
      handleEmailAuthError,
      // errMsg,
      // errCode,
      loading,
    }),
    [createAccount, handleEmailAuthError, loading],
  );
};
