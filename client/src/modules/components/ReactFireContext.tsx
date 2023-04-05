import React from 'react';
// import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import {
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  FunctionsProvider,
  StorageProvider,
  useFirebaseApp,
} from 'reactfire';

import { firebaseConfig } from 'firebaseConfig';

// initializeApp(firebaseConfig);

export let db: Firestore;

export function ReactFireServicesContext({ children }: { children: React.ReactNode }) {
  const app = useFirebaseApp();

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  db = firestore;
  const functions = getFunctions(app);
  const storage = getStorage(app);

  if (process.env.REACT_APP_EMULATORS === 'true') {
    console.log('USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8082);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
  }

  return (
    <AuthProvider sdk={auth}>
      <FirestoreProvider sdk={firestore}>
        <FunctionsProvider sdk={functions}>
          <StorageProvider sdk={storage}>{children}</StorageProvider>
        </FunctionsProvider>
      </FirestoreProvider>
    </AuthProvider>
  );
}

export function ReactFireAppContext({ children }: { children: React.ReactNode }) {
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
