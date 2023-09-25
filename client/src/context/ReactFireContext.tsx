import { getAnalytics } from 'firebase/analytics';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { ReactNode, useEffect } from 'react';
import {
  AnalyticsProvider,
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  FunctionsProvider,
  StorageProvider,
  useFirebaseApp,
  useInitPerformance,
} from 'reactfire';

import { firebaseConfig } from 'firebaseConfig';

// look at: https://stackoverflow.com/a/67257713
// experimentalAutoDetectLongPolling: true,
//     experimentalForceLongPolling: true

// requires preloading ?? https://github.com/FirebaseExtended/reactfire/pull/205

// TODO: set up remote config: https://github.com/FirebaseExtended/reactfire/blob/main/example/withSuspense/RemoteConfig.tsx

// TODO: ONLY WRAP REMOTE CONFIG PROVIDER AROUND COMPONENTS THAT USE IT

export function ReactFireServicesContext({ children }: { children: ReactNode }) {
  const app = useFirebaseApp();

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const functions = getFunctions(app);
  const storage = getStorage(app);
  const analytics = getAnalytics(app);

  // const { status, data: remoteConfigInstance } = useInitRemoteConfig(async (fbApp) => {
  //   const remoteConfig = getRemoteConfig(fbApp);
  //   remoteConfig.settings = {
  //     minimumFetchIntervalMillis: 10000,
  //     fetchTimeoutMillis: 10000,
  //   };

  //   await fetchAndActivate(remoteConfig);
  //   return remoteConfig;
  // });

  useInitPerformance(
    async (app) => {
      const { getPerformance } = await import('firebase/performance');
      return getPerformance(app);
    },
    { suspense: false }
  ); // don't wait to load

  useEffect(() => {
    if (process.env.REACT_APP_EMULATORS === 'true') {
      console.log('USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS');
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, 'localhost', 8082);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  }, [auth, firestore, functions, storage]);

  return (
    <AuthProvider sdk={auth}>
      <FirestoreProvider sdk={firestore}>
        <FunctionsProvider sdk={functions}>
          <StorageProvider sdk={storage}>
            {/* <RemoteConfigProvider sdk={remoteConfigInstance}> */}
            <AnalyticsProvider sdk={analytics}>{children}</AnalyticsProvider>
            {/* </RemoteConfigProvider> */}
          </StorageProvider>
        </FunctionsProvider>
      </FirestoreProvider>
    </AuthProvider>
  );
}

export function ReactFireAppContext({ children }: { children: ReactNode }) {
  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig} suspense={true}>
      {children}
    </FirebaseAppProvider>
  );
}

// https://github.com/FirebaseExtended/reactfire/blob/main/example/withSuspense/Firestore.tsx
// const { data: firestoreInstance } = useInitFirestore(async (firebaseApp) => {
//   const db = initializeFirestore(firebaseApp, {});
//   await enableIndexedDbPersistence(db);
//   return db;
// });
