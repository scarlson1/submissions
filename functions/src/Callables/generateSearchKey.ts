export {};

// https://firebase.google.com/docs/firestore/solutions/search?provider=algolia#adding_security

// EXAMPLE FROM POLICY CONSOLE:

// import * as functions from 'firebase-functions';
// import 'firebase-functions';
// import algoliasearch from 'algoliasearch';
// import { defineSecret } from 'firebase-functions/params'; // defineString
// import { SecuredApiKeyRestrictions } from '@algolia/client-search';

// // const algoliaAppID = defineString('ALGOLIA_APP_ID');
// // const algoliaSearchKey = defineString('ALGOLIA_SEARCH_KEY');
// const algoliaAdminKey = defineSecret('ALGOLIA_ADMIN_API_KEY');
// // TODO: api key inherites from base key
// //    - create base keys for agent, admin (transactions, etc.), iDemandAdmin, etc.

// export const generateSearchKey = functions
//   .runWith({ secrets: [algoliaAdminKey] })
//   .https.onCall(async (data, context) => {
//     console.log('Generating new user search api key...');
//     try {
//       const { auth } = context;
//       const algoliaClient = algoliasearch(
//         process.env.ALGOLIA_APP_ID || '',
//         process.env.ALGOLIA_ADMIN_API_KEY || ''
//       ); // algoliaAppID.value()
//       let apiKeyParams: SecuredApiKeyRestrictions;

//       // IF NO USER, CREATE NON AUTHED SEARCH KEY
//       if (!auth || !auth.uid) {
//         apiKeyParams = {
//           // This filter ensures that only documents where owner == uid will be readable
//           // filters: `owner:${auth.uid}`,
//           // We also proxy the uid as a unique token for this key.
//           // userToken: auth.uid,
//           // restrictIndices: 'index1,index2'
//         };
//       } else {
//         // IF AUTHED -> GENERATE KEY WITH PERMISSIONS FOR USER
//         // https://www.algolia.com/doc/guides/security/api-keys/#generating-api-keys
//         apiKeyParams = {
//           // This filter ensures that only documents where owner == uid will be readable
//           // filters: `owner:${auth.uid}`,
//           // We also proxy the uid as a unique token for this key.
//           userToken: auth.uid,
//         };
//       }

//       // console.log('SEARCH KEY: ', algoliaSearchKey.value());
//       const apiKey = algoliaClient.generateSecuredApiKey(
//         process.env.ALGOLIA_SEARCH_KEY || '',
//         apiKeyParams
//       ); // algoliaSearchKey.value()
//       console.log('USER API KEY: ', apiKey);

//       return { apiKey };
//     } catch (err: unknown) {
//       console.log('ERROR: ', err);
//       throw new functions.https.HttpsError('unknown', 'Error generating search api key');
//     }
//   });
