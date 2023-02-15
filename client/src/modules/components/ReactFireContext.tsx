import React from 'react';
import {
  AuthProvider,
  FirebaseAppProvider,
  FirestoreProvider,
  FunctionsProvider,
  StorageProvider,
  useFirebaseApp,
} from 'reactfire';

import { firebaseConfig } from 'firebaseConfig';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

initializeApp(firebaseConfig);

export function ReactFireServicesContext({ children }: { children: React.ReactNode }) {
  const app = useFirebaseApp();

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const functions = getFunctions(app);
  const storage = getStorage(app);

  console.log('REACT_APP_EMULATORS: ', process.env.REACT_APP_EMULATORS);
  if (process.env.REACT_APP_EMULATORS === 'true') {
    console.log('USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8082);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
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
  return <FirebaseAppProvider firebaseConfig={firebaseConfig}>{children}</FirebaseAppProvider>;
}
