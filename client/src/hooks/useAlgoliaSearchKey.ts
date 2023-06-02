import { useEffect } from 'react';
import { useFunctions } from 'reactfire';

import { useLocalStorage } from './useLocalStorage';
import { generateSearchKey } from 'modules/api';

export function useAlgoliaSearchKey() {
  const functions = useFunctions();
  const [apiKey, setApiKey] = useLocalStorage<string>('userSearchKey');

  // TODO: move loading var outside useEffect ??
  useEffect(() => {
    // let keyFetched = false;
    let loading = false;
    // TODO: if user not authed - use default key ??
    if (!apiKey && !loading) {
      // && !keyFetched
      // keyFetched = true;
      loading = true;
      console.log('NO SEARCH KEY FOUND. FETCHING NEW KEY...');
      generateSearchKey(functions)
        .then(({ data }) => {
          if (data && data.key) {
            console.log('RES: ', data);
            setApiKey(data.key);
          } else {
            // TODO: use general search key
            setApiKey(process.env.REACT_APP_ALGOLIA_NOT_AUTHED_SEARCH_KEY);
          }
          loading = false;
        })
        .catch((err) => {
          console.log('ERROR FETCHING SEARCH KEY: ', err);
          setApiKey(process.env.REACT_APP_ALGOLIA_NOT_AUTHED_SEARCH_KEY);
          loading = false;
        });
    }

    return () => {
      loading = false;
    };
    // return () => {
    //   keyFetched = false;
    // };
  }, [functions, apiKey, setApiKey]);

  // TODO: check expiration date

  // useEffect(() => {
  //   if (!apiKey) return;
  //   let checkedExpDate = false;

  //   if (!checkedExpDate) {
  //     client.getSecuredApiKeyRemainingValidity('YourSecuredAPIkey');
  //   }

  //   return () => {

  //   }
  // }, [apiKey])

  return apiKey;
}
