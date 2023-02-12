import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
  useRef,
} from 'react';
import {
  onAuthStateChanged,
  User,
  IdTokenResult,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  UserCredential,
  sendEmailVerification,
  updateEmail,
  verifyBeforeUpdateEmail,
  multiFactor,
  updatePassword,
  getAuth,
} from '@firebase/auth';
import { doc, onSnapshot, DocumentSnapshot } from '@firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { differenceInSeconds } from 'date-fns';
// import { authState } from 'rxfire/auth';
// import { filter } from 'rxjs/operators';

import { userClaimsCollection } from 'common/firestoreCollections';
import { UserClaims } from 'common/types';
// import { queryClient } from 'modules/queryClient';
import { ReauthDialog } from 'components';
import { toast } from 'react-hot-toast';

// TODO: set up reducer & actions
// https://www.youtube.com/watch?v=YmHEzjglRMk

export enum CustomClaims {
  Admin = 'admin',
  iDemandAdmin = 'iDemandAdmin',
  Agent = 'agent',
}
export type CustomClaimsInterface = Record<CustomClaims, boolean>;

interface AuthContextValue {
  user: User | null;
  error: Error | null | unknown;
  loading: boolean;
  loadingInitial: boolean;
  customClaims: CustomClaimsInterface;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: (cb?: VoidFunction) => void;
  sendPasswordReset: (email: string) => Promise<any>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  sendVerification: () => Promise<any>;
  getSecondsFromLastAuth: () => number | null;
  setUpdatedUser: (user: User | null) => void;
  reauthenticateUser: (dialogMsg?: string) => Promise<void>; // Promise<UserCredential>;
  reauthIfRequired: (
    secondLimit?: number,
    dialogMsg?: string
  ) => Promise<void | { user: User | null }>;
  updateUserEmail: (newEmail: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  error: null,
  loading: false,
  loadingInitial: true,
  login: (email, password) => Promise.reject(),
  logout: () => {},
  sendPasswordReset: () => Promise.reject(),
  updateUserPassword: () => Promise.reject(),
  sendVerification: () => Promise.reject(),
  getSecondsFromLastAuth: () => null,
  setUpdatedUser: () => {},
  reauthenticateUser: () => Promise.reject('initialized func'),
  reauthIfRequired: () => Promise.reject(),
  updateUserEmail: () => Promise.reject(),
  customClaims: { admin: false, agent: false, iDemandAdmin: false },
});
// export const AuthContext = createContext({})

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null | unknown>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [customClaims, setCustomClaims] = useState<CustomClaimsInterface>({
    admin: false,
    agent: false,
    iDemandAdmin: false,
  });
  const lastCommittedRef = useRef(null);

  // TODO: refactor to use rxFire observables ??
  // authState(auth)
  //   .pipe(filter((u) => u !== null))
  //   .subscribe((u) => console.log('rxFire authState user: ', u));

  const navigate = useNavigate();

  const updateClaims = useCallback(async () => {
    setLoading(true);
    if (!auth.currentUser) {
      setCustomClaims({
        admin: false,
        agent: false,
        iDemandAdmin: false,
      });
      return;
    }
    await auth.currentUser?.getIdToken(true);
    const idTokenResult: IdTokenResult = await auth.currentUser.getIdTokenResult();
    // Show admin UI. TODO: UI by claim level

    setCustomClaims({
      ...idTokenResult.claims,
      admin: !!idTokenResult.claims.admin,
      agent: !!idTokenResult.claims.agent,
      iDemandAdmin: !!idTokenResult.claims.iDemandAdmin,
    });
    setLoading(false);
  }, [auth]);

  const onNewClaims = useCallback(
    async (snap: DocumentSnapshot<UserClaims>) => {
      const data = snap.data();
      if (data?._lastCommitted) {
        if (lastCommittedRef.current && !data._lastCommitted.isEqual(lastCommittedRef.current)) {
          console.log('Refreshing ID token');
          updateClaims();
        }
        lastCommittedRef.current = data._lastCommitted;
      }
    },
    [updateClaims]
  );

  // listen to changes in userClaims firestore doc
  useEffect(() => {
    if (!user || !user.tenantId) return;
    const unsubscribe = onSnapshot(doc(userClaimsCollection(user.tenantId), user.uid), onNewClaims);

    return () => unsubscribe();
  }, [onNewClaims, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (newUser: User | null) => {
        setLoading(true);
        // console.log('auth state change => ', newUser);

        setUser(newUser);
        await updateClaims();
        if (!newUser) auth.tenantId = null;

        setLoading(false);
        setLoadingInitial(false);
      },
      setError
    );

    return () => unsubscribe();
  }, [auth, updateClaims]);

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
        console.log('SIGN IN RES: ', res);
        await updateClaims();

        return res;
      } catch (err) {
        console.log('error authenticating user => ', err);
        // TODO: error handling in catch from returned error ??
        return Promise.reject(err);
      }
    },
    [auth, updateClaims]
  );

  /**
   * Logs out the current user and clears react-query. Redirects to /auth/login by default
   * @param {VoidFunction} cb - Optional callback
   */
  const logout = useCallback(
    async (cb?: VoidFunction) => {
      setLoading(true);

      await auth.signOut();
      // queryClient.invalidateQueries();

      cb !== undefined ? cb() : navigate(`/auth/login`, { replace: true });
      setLoading(false);
    },
    [auth, navigate]
  );

  /**
   * Sends email verification to currentUser
   * @returns {Promise} returns sendEmailVerification which resolves to void
   */
  const sendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Must be signed in');
    await sendEmailVerification(auth.currentUser);
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
          `${process.env.REACT_APP_HOSTING_URL}/auth/login/${
            auth.currentUser && auth.currentUser.tenantId ? auth.currentUser.tenantId : ''
          }`,
        handleCodeInApp: false,
      };
      try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return `Password reset email sent to ${email}`;
      } catch (err) {
        return Promise.reject(err);
      }
    },
    [auth]
  );

  /**
   * Calculates seconds from last authentication of currentUser or returns null
   * @returns {number} Difference in seconds between now and lastSignInTime
   */
  const getSecondsFromLastAuth = useCallback(() => {
    if (user && user.metadata.lastSignInTime) {
      let lastSignIn = new Date(user.metadata.lastSignInTime);
      return differenceInSeconds(new Date(), lastSignIn);
    }
    return null;
  }, [user]);

  // TODO: decide whether to use updateCurrentUser() or user.reload() from sdk ??
  const setUpdatedUser = useCallback((updatedUser: User | null) => {
    setUser(updatedUser);
  }, []);

  // REAUTHENTICATE USER DIALOG

  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthText, setReauthText] = useState<string>();
  const reauthPromiseRef = useRef<{
    resolve: (userCred?: any) => void;
    reject: () => void;
  }>();

  const reauthenticateUser = useCallback(
    function (dialogMsg?: string) {
      setReauthOpen(true);
      if (dialogMsg) setReauthText(dialogMsg);
      return new Promise<void>((resolve, reject) => {
        reauthPromiseRef.current = { resolve, reject };
      });
    },
    [reauthPromiseRef]
  );

  const reauthIfRequired = useCallback(
    async (secondLimit: number = 300, dialogMsg?: string) => {
      const secsFromAuth = getSecondsFromLastAuth();
      if (!secsFromAuth || secsFromAuth > secondLimit) {
        return reauthenticateUser(dialogMsg);
      }
      return { user };
    },
    [reauthenticateUser, getSecondsFromLastAuth, user]
  );

  // TODO: customize action handler: https://cloud.google.com/identity-platform/docs/work-with-mfa-users#updating_a_users_email
  const updateUserEmail = useCallback(
    async (newEmail: string) => {
      // TODO: validate email
      try {
        if (!user) throw new Error('User must be authenticated to update email.');
        await reauthIfRequired();
        // check if user has mfa enabled
        const enrolledFactors = multiFactor(user).enrolledFactors;
        if (enrolledFactors.length > 0) {
          await verifyBeforeUpdateEmail(user, newEmail);
          toast(`Click the verification link sent to ${newEmail} to complete the email change.`);
          return;
        }
        await updateEmail(user, newEmail);
      } catch (err) {
        return Promise.reject(err);
      }
    },
    [reauthIfRequired, user]
  );

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

  const handleReauthResult = useCallback(
    (userCred: UserCredential) => {
      console.log('handleReauthResult userCred: ', userCred);
      if (reauthPromiseRef.current) {
        reauthPromiseRef.current.resolve(userCred);
      }
      setReauthOpen(false);
      setReauthText(undefined);
    },
    [reauthPromiseRef]
  );

  const handleReauthClose = useCallback(() => {
    if (reauthPromiseRef.current) {
      reauthPromiseRef.current.reject();
    }
    setReauthOpen(false);
    setReauthText(undefined);
  }, [reauthPromiseRef]);

  const memoedValue = useMemo(
    () => ({
      user,
      error,
      loading,
      loadingInitial,
      customClaims,
      login,
      logout,
      sendPasswordReset,
      updateUserPassword,
      sendVerification,
      getSecondsFromLastAuth,
      setUpdatedUser,
      reauthenticateUser,
      reauthIfRequired,
      updateUserEmail,
    }),
    [
      user,
      loading,
      error,
      loadingInitial,
      customClaims,
      login,
      logout,
      sendPasswordReset,
      updateUserPassword,
      sendVerification,
      getSecondsFromLastAuth,
      setUpdatedUser,
      reauthenticateUser,
      reauthIfRequired,
      updateUserEmail,
    ]
  );

  return (
    <AuthContext.Provider value={memoedValue}>
      {!loadingInitial && children}
      <ReauthDialog
        open={reauthOpen}
        onResult={handleReauthResult}
        onClose={handleReauthClose}
        description={reauthText}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const auth: AuthContextValue = useContext(AuthContext);

  return {
    ...auth,
    isAuthenticated: auth.user != null,
    isAnonymous: auth.user?.isAnonymous,
  };
};

// useHooks reference example: https://usehooks.com/useAuth/

// https://dev.to/jsbroks/firebase-authentication-with-react-and-guarded-routes-41nm
// https://dev.to/finiam/predictable-react-authentication-with-the-context-api-g10

// EMAIL LINK SIGN IN
// useEffect(() => {
//   // TODO: disable ?? conflicts with email/password
//   if (isSignInWithEmailLink(auth, window.location.href)) {
//     // TODO: set email action handlers in firebase settings??
//     // if want to support both - change sign in view to prompt for email only,
//     // then check type of sign in -> send link or prompt for PW depending on result

//     // https://firebase.google.com/docs/auth/custom-email-handler#create_the_email_action_handler_page

//     const mode = getParamByName(window.location.href, 'mode');
//     // Get the one-time code from the query parameter.
//     const actionCode = getParamByName(window.location.href, 'oobCode');
//     // (Optional) Get the continue URL from the query parameter if available.
//     const continueUrl = getParamByName(window.location.href, 'continueUrl');
//     console.log('ACTION CODE => ', actionCode);
//     console.log('CONTINUE URL => ', continueUrl);

//     switch (mode) {
//       case 'resetPassword':
//         // TODO: handle pw reset email
//         alert('password email reset action not implemented yet.');
//         break;
//       case 'recoverEmail':
//         // Display email recovery handler and UI.
//         alert('recover email action not implemented yet.');
//         //handleRecoverEmail(actionCode, lang);
//         break;
//       case 'verifyEmail':
//         navigate('/auth/verify-email', {
//           replace: true,
//           state: {
//             firebaseSignInUrl: window.location.href,
//           },
//         });

//         break;
//       case 'signIn':
//         const name = getParamByName(window.location.href, 'name');
//         const email = getParamByName(window.location.href, 'email');
//         const companyId = getParamByName(window.location.href, 'companyId');
//         const orgName = getParamByName(window.location.href, 'orgName');
//         const inviteId = getParamByName(window.location.href, 'inviteId');

//         navigate('/auth/verify-email', {
//           replace: true,
//           state: {
//             firebaseSignInUrl: window.location.href,
//             signInUrl: window.location.href,
//             name,
//             email,
//             companyId,
//             orgName,
//             inviteId,
//           },
//         });
//         break;
//       default:
//         // Error: invalid mode.
//         alert(`link mode not found. Value: ${mode}`);
//     }
//   }
// }, [path, navigate]);
