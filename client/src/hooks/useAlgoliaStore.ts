import { Functions } from 'firebase/functions';
import { create } from 'zustand';

import { generateSearchKey } from 'api';
import { logDev } from 'modules/utils';

// TODO: SAVE KEY IN USER CLAIMS ??

// use useSyncExternalStore ??

interface AlgoliaStore {
  apiKey: string | undefined;
  generateKey: (functions: Functions) => Promise<void>;
  resetKey: () => void;
}

export const useAlgoliaStore = create<AlgoliaStore>((set) => ({
  apiKey: import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY,
  generateKey: async (functions: Functions) => {
    try {
      const { data } = await generateSearchKey(functions);
      logDev('API KEY RES: ', data);
      if (data?.key) set({ apiKey: data.key });
    } catch (err: any) {
      console.log('ERROR GENERATING SEARCH KEY: ', err);
    }
  },
  resetKey: () => set(() => ({ apiKey: import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY })),
}));

// const apiKey = useAlgoliaStore((state) => state.apiKey);

// const [generateKey, resetKey]= useAlgoliaStore((state) => [state.generateKey, state.resetKey]);

// import { useCallback, useEffect, useState } from 'react';
// import { useFunctions } from 'reactfire';
// import { create } from 'zustand';
// import { Functions } from 'firebase/functions';

// import { generateSearchKey } from 'modules/api';
// import { useLocalStorage } from './useLocalStorage';
// import { LOCAL_STORAGE } from 'common';

// export function useAlgoliaSearchKey(filters?: string) {
//   const functions = useFunctions();
//   const [apiKey, setApiKey] = useLocalStorage<string>(LOCAL_STORAGE.USER_SEARCH_KEY);
//   const [loading, setLoading] = useState(false);
//   // const [error, setError] = useState()
//   console.log('API KEY STORAGE: ', apiKey);

//   const generateKey = useCallback(async () => {
//     console.log('FETCHING NEW SEARCH KEY...');
//     try {
//       setLoading(true);
//       // setError(undefined)
//       const { data } = await generateSearchKey(functions);
//       console.log('RES: ', data);
//       return data.key;
//       // if (data && data.key) {
//       //   console.log('RES: ', data);
//       //   setApiKey(data.key);

//       // } else {
//       //   // TODO: use general search key
//       //   const fallbackKey = import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY;
//       //   if (!fallbackKey) throw new Error('missing fallback search key')
//       //   setApiKey(fallbackKey);
//       //   return fallbackKey;
//       // }
//     } catch (err) {
//       console.log('ERROR FETCHING SEARCH KEY: ', err);
//       // setApiKey(import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY);
//       setLoading(false);
//     }
//   }, [functions]);

//   useEffect(() => {
//     // let loading = false;
//     // TODO: if user not authed - use default key ??
//     console.log('LOADING: ', loading);

//     if (!apiKey && !loading) {
//       generateKey();
//       // .then(key => {
//       //   if (key) setApiKey(key)
//       // })

//       // setLoading(true);
//       // // loading = true;

//       // generateSearchKey(functions)
//       //   .then(({ data }) => {
//       //     if (data && data.key) {
//       //       console.log('RES: ', data);
//       //       setApiKey(data.key);
//       //     } else {
//       //       // TODO: use general search key
//       //       setApiKey(import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY);
//       //     }
//       //     setLoading(false);
//       //     // loading = false;
//       //   })
//       //   .catch((err) => {
//       //     console.log('ERROR FETCHING SEARCH KEY: ', err);
//       //     setApiKey(import.meta.env.VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY);
//       //     setLoading(false);
//       //     // loading = false;
//       //   });
//     }

//     // return () => {
//     //   loading = false;
//     // };
//   }, [functions, apiKey, setApiKey, loading]);

//   // TODO: check expiration date

//   // useEffect(() => {
//   //   if (!apiKey) return;
//   //   let checkedExpDate = false;

//   //   if (!checkedExpDate) {
//   //     client.getSecuredApiKeyRemainingValidity('YourSecuredAPIkey');
//   //   }

//   //   return () => {

//   //   }
//   // }, [apiKey])

//   return apiKey;
// }
