import { IdTokenResult, User, UserCredential } from '@firebase/auth';
import { setUser as setSentryUser } from '@sentry/react';
import { differenceInSeconds } from 'date-fns';
import { setUserId, setUserProperties } from 'firebase/analytics';
import { isEqual } from 'lodash';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useAnalytics, useAuth as useFireAuth, useFunctions } from 'reactfire';

import { CLAIMS } from 'common';
import { ReauthDialog } from 'components';
import { useUserClaims } from 'hooks';
import { useTypesenseStore } from 'hooks/useAlgoliaStore';
import { UserWithClaimsResult } from 'hooks/useUserClaims';
import { usePrevious } from 'hooks/utils';
import { logDev } from 'modules/utils';
import { AUTH_ROUTES, createPath } from 'router';

// TODO: new feature: authStateReady - https://firebase.google.com/support/release-notes/js

// TODO: refactor to use rxFire observables ?? https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase

// TODO: set up reducer & actions
// https://www.youtube.com/watch?v=YmHEzjglRMk

// export enum CLAIMS {
//   ORG_ADMIN = 'orgAdmin',
//   IDEMAND_ADMIN = 'iDemandAdmin',
//   AGENT = 'agent',
// }
export type CustomClaimsInterface = Record<CLAIMS, boolean> &
  IdTokenResult['claims'];

interface AuthContextValue extends UserWithClaimsResult {
  getSecondsFromLastAuth: () => number | null;
  reauthenticateUser: (dialogMsg?: string) => Promise<void>; // Promise<UserCredential>;
  reauthIfRequired: (
    secondLimit?: number,
    dialogMsg?: string,
  ) => Promise<void | { user: User | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

// TODO: fix useUserClaims hook not running fast enough (observable already loads, so doesn't suspended on future renders)
// using useAuth from AuthContext in components is behind useSignInCheck

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useFireAuth();
  const functions = useFunctions();
  const analytics = useAnalytics();
  const location = useLocation();
  // TODO: rename useClaimsSubscription()
  const { data: userData } = useUserClaims();

  const userPrev = usePrevious(userData?.user);
  const claimsPrev = usePrevious(userData?.claims);

  useEffect(() => {
    import.meta.env.VITE_FB_PROJECT_ID !== 'idemand-submissions' &&
      logDev('USER OBS CHANGE: ', userData);
  }, [userData]);

  const [generateKey, resetKey] = useTypesenseStore((state) => [
    state.generateKey,
    state.resetKey,
  ]);

  // TODO: use method or already handled by reactfire ?? const authReady = auth.authStateReady()

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
          location.pathname,
        );
        const isTenantCreateAccountPage = matchPath(
          { path: createPath({ path: AUTH_ROUTES.TENANT_CREATE_ACCOUNT }) },
          location.pathname,
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
  }, [
    userData,
    userPrev,
    functions,
    auth,
    analytics,
    location,
    generateKey,
    resetKey,
  ]);

  // update user properties in analytics on claims change
  useEffect(() => {
    if (!isEqual(userData?.claims, claimsPrev)) {
      // if at lease one claim is true, update firebase analytics
      if (
        userData?.claims &&
        Object.values(userData.claims).some((claim) => claim === true)
      )
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
    [reauthPromiseRef],
  );

  const reauthIfRequired = useCallback(
    async (secondLimit: number = 300, dialogMsg?: string) => {
      const secsFromAuth = getSecondsFromLastAuth();
      if (!secsFromAuth || secsFromAuth > secondLimit) {
        return reauthenticateUser(dialogMsg);
      }
      return { user: userData.user };
    },
    [reauthenticateUser, getSecondsFromLastAuth, userData],
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
    [reauthPromiseRef],
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

      getSecondsFromLastAuth,
      reauthenticateUser,
      reauthIfRequired,
    }),
    [userData, getSecondsFromLastAuth, reauthenticateUser, reauthIfRequired],
  );

  return (
    <AuthContext.Provider value={memoedValue}>
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
    throw new Error('useAuth must be used within AuthProvider');
  }

  return {
    ...auth,
    // isAuthenticated: auth.user != null,
    isAnonymous: auth.user?.isAnonymous,
  };
};
