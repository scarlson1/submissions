import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
  useRef,
  ReactNode,
} from 'react';
import { User, IdTokenResult, UserCredential } from '@firebase/auth';
import { setUserId, setUserProperties } from 'firebase/analytics';
import { useAnalytics, useAuth as useFireAuth, useFunctions } from 'reactfire';
import { differenceInSeconds } from 'date-fns';
import { setUser as setSentryUser } from '@sentry/react';
import { isEqual } from 'lodash';
import { matchPath, useLocation } from 'react-router-dom';

import { ReauthDialog } from 'components';
import { useAlgoliaStore, usePrevious, useUserClaims } from 'hooks';
import { UserWithClaimsResult } from 'hooks/useUserClaims';
import { AUTH_ROUTES, createPath } from 'router';
import { CUSTOM_CLAIMS } from 'common';

// TODO: refactor to use rxFire observables ?? https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase

// TODO: set up reducer & actions
// https://www.youtube.com/watch?v=YmHEzjglRMk

// export enum CUSTOM_CLAIMS {
//   ORG_ADMIN = 'orgAdmin',
//   IDEMAND_ADMIN = 'iDemandAdmin',
//   AGENT = 'agent',
// }
export type CustomClaimsInterface = Record<CUSTOM_CLAIMS, boolean> & IdTokenResult['claims'];

interface AuthContextValue extends UserWithClaimsResult {
  getSecondsFromLastAuth: () => number | null;
  reauthenticateUser: (dialogMsg?: string) => Promise<void>; // Promise<UserCredential>;
  reauthIfRequired: (
    secondLimit?: number,
    dialogMsg?: string
  ) => Promise<void | { user: User | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const auth = useFireAuth();
  const functions = useFunctions();
  const analytics = useAnalytics();
  const location = useLocation();
  const { data: userData, status } = useUserClaims();

  const userPrev = usePrevious(userData?.user);
  const claimsPrev = usePrevious(userData?.claims);

  useEffect(() => {
    process.env.REACT_APP_FB_PROJECT_ID !== 'idemand-submissions' &&
      console.log('USER OBS CHANGE: ', userData);
  }, [userData]);

  // const [loading, setLoading] = useState(false);
  // const [loadingInitial, setLoadingInitial] = useState(true);
  // const lastCommittedRef = useRef(null);
  const [generateKey, resetKey] = useAlgoliaStore((state) => [state.generateKey, state.resetKey]);

  // get user in analytics & sentry on change
  useEffect(() => {
    if (!isEqual(userData?.user, userPrev)) {
      if (userData?.user) {
        setUserId(analytics, userData.user.uid);
        setSentryUser({
          id: userData.user.uid,
          email: userData.user.email || undefined,
          username: userData.user.displayName || undefined,
        });
        generateKey(functions);
      } else {
        // only remove auth.tenantId if not on tenant auth page
        const isTenantLoginPage = matchPath(
          { path: createPath({ path: AUTH_ROUTES.TENANT_LOGIN }) },
          location.pathname
        );
        const isTenantCreateAccountPage = matchPath(
          { path: createPath({ path: AUTH_ROUTES.TENANT_CREATE_ACCOUNT }) },
          location.pathname
        );

        if (isTenantLoginPage === null && isTenantCreateAccountPage === null) {
          console.log('SETTING TENANT ID TO NULL');
          auth.tenantId = null;
        }
        setSentryUser(null);
        // localStorage.removeItem(LOCAL_STORAGE.USER_SEARCH_KEY);
        resetKey();
      }
    }
  }, [userData, userPrev, functions, auth, analytics, location, generateKey, resetKey]);

  // update user properties in analytics on claims change
  useEffect(() => {
    if (!isEqual(userData?.claims, claimsPrev)) {
      // if at lease one claim is true, update firebase analytics
      if (userData?.claims && Object.values(userData.claims).some((claim) => claim === true))
        setUserProperties(analytics, { ...userData.claims });
    }
  }, [userData, claimsPrev, analytics]);

  /**
   * Calculates seconds from last authentication of currentUser or returns null
   * @returns {number} Difference in seconds between now and lastSignInTime
   */
  const getSecondsFromLastAuth = useCallback(() => {
    if (userData?.user && userData.user.metadata.lastSignInTime) {
      let lastSignIn = new Date(userData.user.metadata.lastSignInTime);
      return differenceInSeconds(new Date(), lastSignIn);
    }
    return null;
  }, [userData]);

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
      return { user: userData.user };
    },
    [reauthenticateUser, getSecondsFromLastAuth, userData]
  );

  const handleReauthResult = useCallback(
    (userCred: UserCredential) => {
      // console.log('handleReauthResult userCred: ', userCred);
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
      ...userData,
      status,
      getSecondsFromLastAuth,
      reauthenticateUser,
      reauthIfRequired,
    }),
    [userData, status, getSecondsFromLastAuth, reauthenticateUser, reauthIfRequired]
  );

  return (
    <AuthContext.Provider value={memoedValue}>
      {/* {!loadingInitial && children} */}
      {children}
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
  const auth: AuthContextValue | undefined = useContext(AuthContext);

  if (auth === undefined) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }

  if (!auth) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }

  return {
    ...auth,
    // isAuthenticated: auth.user != null,
    isAnonymous: auth.user?.isAnonymous,
  };
};

// OLD AUTH CONTEXT:

// import {
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   useContext,
//   createContext,
//   useRef,
// } from 'react';
// import { User, IdTokenResult, UserCredential, onAuthStateChanged } from '@firebase/auth';
// import { doc, onSnapshot, DocumentSnapshot } from '@firebase/firestore';
// import { setUserId, setUserProperties } from 'firebase/analytics';
// import {
//   useAnalytics,
//   useAuth as useFireAuth,
//   useFirestore,
//   useFunctions,
//   useUser,
// } from 'reactfire';
// import { differenceInSeconds } from 'date-fns';
// import { setUser as setSentryUser } from '@sentry/react';

// import { userClaimsCollection } from 'common/firestoreCollections';
// import { UserClaims } from 'common'; // LOCAL_STORAGE,
// import { ReauthDialog } from 'components';
// import { useAlgoliaStore, useUserClaims } from 'hooks';

// // TODO: refactor to use rxFire observables ?? https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase

// // TODO: set up reducer & actions
// // https://www.youtube.com/watch?v=YmHEzjglRMk

// // TODO: switch auth user states subscription to useUserClaims
// // to sync user auth, firestore claims doc, and claims in one observable

// export enum CUSTOM_CLAIMS {
//   ORG_ADMIN = 'orgAdmin',
//   IDEMAND_ADMIN = 'iDemandAdmin',
//   AGENT = 'agent',
// }
// export type CustomClaimsInterface = Record<CUSTOM_CLAIMS, boolean> & IdTokenResult['claims'];

// interface AuthContextValue {
//   user: User | null;
//   loading: boolean;
//   loadingInitial: boolean; // TODO: remove (use suspense with useUserClaims hook)
//   claims: CustomClaimsInterface;
//   getSecondsFromLastAuth: () => number | null;
//   reauthenticateUser: (dialogMsg?: string) => Promise<void>; // Promise<UserCredential>;
//   reauthIfRequired: (
//     secondLimit?: number,
//     dialogMsg?: string
//   ) => Promise<void | { user: User | null }>;
// }

// export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
//   const auth = useFireAuth();
//   const firestore = useFirestore();
//   const functions = useFunctions();
//   const analytics = useAnalytics();
//   const { data: user } = useUser();
//   // TODO: useUserClaims once tested
//   const { data: userData } = useUserClaims();

//   useEffect(() => {
//     console.log('USER OBS CHANGE: ', userData);
//   }, [userData]);

//   const [loading, setLoading] = useState(false);
//   const [loadingInitial, setLoadingInitial] = useState(true);
//   const [claims, setClaims] = useState<CustomClaimsInterface>({
//     orgAdmin: false,
//     agent: false,
//     iDemandAdmin: false,
//   });
//   const lastCommittedRef = useRef(null);
//   const [generateKey, resetKey] = useAlgoliaStore((state) => [state.generateKey, state.resetKey]);

//   const updateClaims = useCallback(async () => {
//     setLoading(true);
//     if (!auth.currentUser) {
//       return setClaims({
//         orgAdmin: false,
//         agent: false,
//         iDemandAdmin: false,
//       });
//     }

//     await auth.currentUser?.getIdToken(true);
//     const idTokenResult: IdTokenResult = await auth.currentUser.getIdTokenResult();

//     const orgAdmin = !!idTokenResult.claims.orgAdmin;
//     const agent = !!idTokenResult.claims.agent;
//     const iDemandAdmin = !!idTokenResult.claims.iDemandAdmin;
//     setClaims({
//       ...idTokenResult.claims,
//       orgAdmin,
//       agent,
//       iDemandAdmin,
//     });

//     if (orgAdmin || agent || iDemandAdmin) {
//       setUserProperties(analytics, { ...idTokenResult.claims });
//     }

//     setLoading(false);
//   }, [auth, analytics]);

//   const onNewClaims = useCallback(
//     async (snap: DocumentSnapshot<UserClaims>) => {
//       const data = snap.data();

//       // if _lastCommitted not equal to ref, fetch claims from token
//       if (data?._lastCommitted) {
//         if (lastCommittedRef.current && !data._lastCommitted.isEqual(lastCommittedRef.current)) {
//           updateClaims();
//         }
//         lastCommittedRef.current = data._lastCommitted;
//       }
//     },
//     [updateClaims]
//   );

//   // TODO: use rxjs to pipe user auth && subscribe to claims doc?
//   // TODO: does subscription terminate when user signs out ??
//   // listen to changes in userClaims firestore doc (orgs/{orgId}/userClaims/{uid})
//   useEffect(() => {
//     if (!user) return;
//     if (!user.tenantId && !claims.iDemandAdmin) return;

//     const userOrgId = !!claims.iDemandAdmin ? 'idemand' : user.tenantId;

//     const unsubscribe = onSnapshot(
//       doc(userClaimsCollection(firestore, userOrgId as string), user.uid),
//       onNewClaims
//     );

//     return () => unsubscribe();
//   }, [onNewClaims, firestore, user, claims]);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(
//       auth,
//       async (newUser: User | null) => {
//         setLoading(true);
//         await updateClaims();

//         if (newUser) {
//           setUserId(analytics, newUser.uid);
//           setSentryUser({
//             id: newUser.uid,
//             email: newUser.email || undefined,
//             username: newUser.displayName || undefined,
//           });
//           generateKey(functions);
//         } else {
//           auth.tenantId = null;
//           setSentryUser(null);
//           // localStorage.removeItem(LOCAL_STORAGE.USER_SEARCH_KEY);
//           resetKey();
//         }

//         setLoading(false);
//         setLoadingInitial(false);
//       },
//       console.error
//     );

//     return () => unsubscribe();
//   }, [auth, analytics, functions, updateClaims, generateKey, resetKey]);

//   /**
//    * Calculates seconds from last authentication of currentUser or returns null
//    * @returns {number} Difference in seconds between now and lastSignInTime
//    */
//   const getSecondsFromLastAuth = useCallback(() => {
//     if (user && user.metadata.lastSignInTime) {
//       let lastSignIn = new Date(user.metadata.lastSignInTime);
//       return differenceInSeconds(new Date(), lastSignIn);
//     }
//     return null;
//   }, [user]);

//   // REAUTHENTICATE USER DIALOG

//   const [reauthOpen, setReauthOpen] = useState(false);
//   const [reauthText, setReauthText] = useState<string>();
//   const reauthPromiseRef = useRef<{
//     resolve: (userCred?: any) => void;
//     reject: () => void;
//   }>();

//   const reauthenticateUser = useCallback(
//     function (dialogMsg?: string) {
//       setReauthOpen(true);
//       if (dialogMsg) setReauthText(dialogMsg);
//       return new Promise<void>((resolve, reject) => {
//         reauthPromiseRef.current = { resolve, reject };
//       });
//     },
//     [reauthPromiseRef]
//   );

//   const reauthIfRequired = useCallback(
//     async (secondLimit: number = 300, dialogMsg?: string) => {
//       const secsFromAuth = getSecondsFromLastAuth();
//       if (!secsFromAuth || secsFromAuth > secondLimit) {
//         return reauthenticateUser(dialogMsg);
//       }
//       return { user };
//     },
//     [reauthenticateUser, getSecondsFromLastAuth, user]
//   );

//   const handleReauthResult = useCallback(
//     (userCred: UserCredential) => {
//       // console.log('handleReauthResult userCred: ', userCred);
//       if (reauthPromiseRef.current) {
//         reauthPromiseRef.current.resolve(userCred);
//       }
//       setReauthOpen(false);
//       setReauthText(undefined);
//     },
//     [reauthPromiseRef]
//   );

//   const handleReauthClose = useCallback(() => {
//     if (reauthPromiseRef.current) {
//       reauthPromiseRef.current.reject();
//     }
//     setReauthOpen(false);
//     setReauthText(undefined);
//   }, [reauthPromiseRef]);

//   const memoedValue = useMemo(
//     () => ({
//       user,
//       loading,
//       loadingInitial,
//       claims,
//       getSecondsFromLastAuth,
//       reauthenticateUser,
//       reauthIfRequired,
//     }),
//     [
//       user,
//       loading,
//       loadingInitial,
//       claims,
//       getSecondsFromLastAuth,
//       reauthenticateUser,
//       reauthIfRequired,
//     ]
//   );

//   return (
//     <AuthContext.Provider value={memoedValue}>
//       {!loadingInitial && children}
//       <ReauthDialog
//         open={reauthOpen}
//         onResult={handleReauthResult}
//         onClose={handleReauthClose}
//         description={reauthText}
//       />
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const auth: AuthContextValue | undefined = useContext(AuthContext);

//   if (auth === undefined) {
//     throw new Error('useAuth must be used within AuthContextProvider');
//   }

//   if (!auth) {
//     throw new Error('useAuth must be used within AuthContextProvider');
//   }

//   return {
//     ...auth,
//     isAuthenticated: auth.user != null,
//     isAnonymous: auth.user?.isAnonymous,
//   };
// };
