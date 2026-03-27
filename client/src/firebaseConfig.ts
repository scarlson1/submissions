// import { initializeApp } from 'firebase/app';
// import { getAuth, connectAuthEmulator } from 'firebase/auth';

// import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
// import { getStorage, connectStorageEmulator } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// export const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const functions = getFunctions(app);
// export const storage = getStorage(app);

// if (import.meta.env.VITE_EMULATORS === 'true') {
//   console.log('USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS');
//   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//   connectFirestoreEmulator(db, 'localhost', 8082);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
//   // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }
