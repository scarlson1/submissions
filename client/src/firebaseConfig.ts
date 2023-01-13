import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FB_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FB_APP_ID,
  // measurementId: process.env.REACT_APP_FB_MESASUREMENT_ID,
};

// const firebaseConfig = {
//   apiKey: 'AIzaSyCwcYgjEUbG-tAVAmrKbQMnBLCjUHStl1Q',
//   authDomain: 'idemand-submissions.firebaseapp.com',
//   projectId: 'idemand-submissions',
//   storageBucket: 'idemand-submissions.appspot.com',
//   messagingSenderId: '234623719115',
//   appId: '1:234623719115:web:dc70d4aa423ca3c91f6d4e',
//   measurementId: 'G-W6V0344BB2',
// };

// TODO: determine how to set firebase config

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

if (process.env.REACT_APP_EMULATORS === 'true') {
  console.log('USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8082);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}
