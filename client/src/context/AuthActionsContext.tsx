import {
  UserCredential,
  multiFactor,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from 'reactfire';

import { AUTH_ROUTES, createPath } from 'router';
import { useAuth as useAuthI } from './AuthContext';

interface AuthActionsContextValue {
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: (cb?: VoidFunction) => void;
  sendPasswordReset: (email: string, continueUrl?: string) => Promise<any>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  sendVerification: () => Promise<any>;
  updateUserEmail: (newEmail: string, onSuccess?: (msg: string) => void) => Promise<void>;
  loading: boolean;
}

export const AuthActionsContext = createContext<AuthActionsContextValue | undefined>(undefined);

export const AuthActionsProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: user } = useUser();
  const [loading, setLoading] = useState(false);
  const { reauthIfRequired } = useAuthI();

  /**
   * Login user using email/password auth
   * @param {string} email - user's email.
   * @param {string} password - provided password.
   * @returns {UserCredential} UserCredential returned from signin method.
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        console.log('auth.tenantId: ', auth.tenantId);
        let res = await signInWithEmailAndPassword(auth, email, password);

        return res;
      } catch (err) {
        console.log('error authenticating user => ', err);
        // TODO: error handling in catch from returned error ??
        return Promise.reject(err);
      }
    },
    [auth]
  );

  /**
   * Logs out the current user and clears react-query. Redirects to /auth/login by default
   * @param {VoidFunction} cb - Optional callback
   */
  const logout = useCallback(
    async (cb?: VoidFunction) => {
      setLoading(true);

      await auth.signOut();

      cb !== undefined
        ? cb()
        : navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { replace: true });
      setLoading(false);
    },
    [auth, navigate]
  );

  /**
   * Sends email verification to currentUser
   * @returns {Promise} returns sendEmailVerification which resolves current users email
   */
  const sendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Must be signed in');
    await sendEmailVerification(auth.currentUser);

    return auth.currentUser.email;
  }, [auth]);

  /**
   * Sends password reset to the provided email. Used for "forgot password" situations.
   * @param {string} email - email to which the reset email is sent.
   * @param {string} continueUrl - url the link redirects to.
   * @returns {string} informational success message which can be display to user
   */
  const sendPasswordReset = useCallback(
    async (email: string, continueUrl?: string) => {
      var actionCodeSettings = {
        url:
          continueUrl ||
          `${import.meta.env.VITE_HOSTING_URL}/auth/login/${
            auth.currentUser && auth.currentUser.tenantId ? auth.currentUser.tenantId : ''
          }`,
        handleCodeInApp: false,
      };
      try {
        setLoading(true);
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setLoading(false);
        return `Password reset email sent to ${email}`;
      } catch (err) {
        setLoading(false);
        return Promise.reject(err);
      }
    },
    [auth]
  );

  // TODO: customize action handler: https://cloud.google.com/identity-platform/docs/work-with-mfa-users#updating_a_users_email
  const updateUserEmail = useCallback(
    async (newEmail: string, onSuccess?: (msg: string) => void) => {
      // TODO: validate email
      try {
        if (!user) throw new Error('User must be authenticated to update email.');
        await reauthIfRequired();

        // check if user has mfa enabled
        const enrolledFactors = multiFactor(user).enrolledFactors;
        if (enrolledFactors.length > 0) {
          await verifyBeforeUpdateEmail(user, newEmail);

          const msg = `Click the verification link sent to ${newEmail} to complete the email change.`;
          toast(msg);

          if (onSuccess) onSuccess(msg);
          return;
        }

        await updateEmail(user, newEmail);
        // TODO: update database email record (currently handled in onSuccess callback)
        if (onSuccess) onSuccess('Email updated!');
      } catch (err) {
        return Promise.reject(err);
      }
    },
    [reauthIfRequired, user]
  );

  // TODO: requires recaptcha and verification code
  // const updateUserPhone = useCallback(async () => {
  //   if (!user) throw new Error('no user authenticated')

  //   await reauthIfRequired();

  //   // const applicationVerifier = new RecaptchaVerifier('recaptcha-container');
  //   // const provider = new PhoneAuthProvider(auth);
  //   // const verificationId = await provider.verifyPhoneNumber('+16505550101', applicationVerifier);
  //   // // Obtain the verificationCode from the user.
  //   // const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);

  //   // await updatePhoneNumber(user)
  //   // const enrolledFactors = multiFactor(user).enrolledFactors;
  //   // if (enrolledFactors.length) {
  //   //   await verifyBeforeUpdateEmail(user, )
  //   // }
  // }, [])

  /**
   * Change password dialog for already authenticated users.
   * @param {string} newPassword - new password for current user.
   */
  const updateUserPassword = useCallback(
    async (newPassword: string) => {
      // TODO: validation
      if (!user) throw new Error('Must be signed in.');
      await reauthIfRequired();
      await updatePassword(user, newPassword);
    },
    [reauthIfRequired, user]
  );

  const memoed = useMemo(
    () => ({
      login,
      logout,
      sendVerification,
      sendPasswordReset,
      updateUserEmail,
      // updateUserPhone,
      updateUserPassword,
      loading,
    }),
    [
      login,
      logout,
      sendVerification,
      sendPasswordReset,
      updateUserEmail,
      // updateUserPhone,
      updateUserPassword,
      loading,
    ]
  );

  return <AuthActionsContext.Provider value={memoed}>{children}</AuthActionsContext.Provider>;
};

export const useAuthActions = () => {
  const authActions = useContext(AuthActionsContext);

  if (authActions === undefined)
    throw new Error('useAuthActions must be used within AuthActionsProvider');

  return authActions;
};
