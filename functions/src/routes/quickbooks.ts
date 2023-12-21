import express, { Response } from 'express';
import { info } from 'firebase-functions/logger';
import { projectID } from 'firebase-functions/params';
import OAuthClient from 'intuit-oauth-ts';
import {
  RequestUserAuth,
  env,
  functionsBaseURL,
  getReportErrorFn,
  quickbooksClientId,
  quickbooksClientSecret,
} from '../common/index.js';
import { currentUser } from './middlewares/index.js';

// forked intuit-oauth w/ types: https://www.npmjs.com/package/intuit-oauth-ts
// ts comment ref (qb auth & qb lib): https://stackoverflow.com/a/75367189
// alternatively add types: https://github.com/intuit/oauth-jsclient/issues/33#issuecomment-1031808025
// types: https://github.com/intuit/oauth-jsclient/blob/typescript/index.d.ts

// sample: https://github.com/intuit/oauth-jsclient/blob/master/sample/app.js

// TODO: set up frontend flow
// TODO: either store refresh token in DB or persistent storage (redis)
// encrypt if saving to DB ??

const reportErr = getReportErrorFn('quickbooks');

let oauth2_token_json = null;
let redirectUri = `${functionsBaseURL.value()}/quickbooks/callback`;
let oauthClient: OAuthClient | null = null;

const getOAuthClient = () => {
  // TODO: refresh if expired ??
  if (oauthClient) return oauthClient;

  const environment =
    projectID.value() === 'idemand-submissions' && env.value() === 'PROD'
      ? 'production'
      : 'sandbox';

  oauthClient = new OAuthClient({
    clientId: quickbooksClientId.value(), // req.query.json.clientId,
    clientSecret: quickbooksClientSecret.value(),
    environment,
    redirectUri, // req.query.json.redirectUri,
  });

  return oauthClient;
};

// const ngrok = process.env.NGROK_ENABLED === 'true' ? require('ngrok') : null;

const app = express();

app.use(express.json());
app.use(currentUser);
// app.use(requireAuth); // TODO: require iDemand Admin ??

/**
 * Get the AuthorizeUri
 */
app.get('/authUri', function (req: RequestUserAuth, res: Response) {
  try {
    // const environment =
    //   projectID.value() === 'idemand-submissions' && env.value() === 'PROD'
    //     ? 'production'
    //     : 'sandbox';

    // oauthClient = new OAuthClient({
    //   clientId: quickbooksClientId.value(), // req.query.json.clientId,
    //   clientSecret: quickbooksClientSecret.value(),
    //   environment,
    //   redirectUri: quickbooksRedirectUri.value(), // req.query.json.redirectUri,
    // })

    const client = getOAuthClient();

    const authUri = client.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'intuit-test',
    });
    info(`AUTH URI: ${authUri}`);

    res.send(authUri);
  } catch (err: any) {
    let msg = 'error getting auth URI for quickbooks OAuth authentication';
    if (err?.message) msg += ` $(${err.message})`;
    reportErr(msg, {}, err);

    res.status(500).send({ message: msg });
  }
});

/**
 * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
 */
app.get('/callback', function (req, res) {
  const client = getOAuthClient();

  client
    .createToken(req.url)
    .then(function (authResponse) {
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
      // TODO: save to DB or persistent storage (redis ??)
      console.log('AUTH RESPONSE: ');
      info(oauth2_token_json); // PRE_DEPLOY: don't log
      // return ??
    })
    .catch(function (e: any) {
      console.error(e);
      let msg = `error creating token`;
      if (e.error_description) msg += ` ${e.error_description}`;
      reportErr(msg, {}, e);
    });

  res.send('');
});

/**
 * Refresh the access-token
 */
app.get('/refreshAccessToken', function (req, res) {
  const client = getOAuthClient();

  // TODO: save to DB ?? or set up persistent storage service in GCP ??
  client
    .refresh()
    .then(function (authResponse) {
      info(`The Refresh Token is  ${JSON.stringify(authResponse.getJson())}`);
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
      // TODO: save to global variable & to DB ??
      res.send(oauth2_token_json);
    })
    .catch(function (e) {
      console.error(e);
    });
});

/**
 * getCompanyInfo ()
 */
app.get('/getCompanyInfo', function (req, res) {
  const client = getOAuthClient();
  const companyID = client.getToken().realmId;

  const url =
    client.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  client // @ts-ignore
    .makeApiCall({ url: `${url}v3/company/${companyID}/companyinfo/${companyID}` })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
    });
});

// TODO: set up community quickbooks node sdk
// https://www.npmjs.com/package/node-quickbooks?activeTab=code
// qbo = new QuickBooks(
//   quickbooksClientId.value(), // consumerKey,
//   quickbooksClientSecret.value(), // consumerSecret,
//   accessToken.oauth_token,
//   accessToken.oauth_token_secret,
//   postBody.oauth.realmId,
//   true, // use the Sandbox
//   true
// ); // turn debugging on

// // test out account access
// qbo.findAccounts(function (_, accounts) {
//   accounts.QueryResponse.Account.forEach(function (account) {
//     console.log(account.Name);
//   });
// });

// const server = app.listen(process.env.PORT || 8000, () => {
//   console.log(`💻 Server listening on port ${(server.address() as AddressInfo)?.port}`);
//   // if (!ngrok) {
//   //   redirectUri = `${server.address().port}` + '/callback';
//   //   console.log(
//   //     `💳  Step 1 : Paste this URL in your browser : ` +
//   //       'http://localhost:' +
//   //       `${server.address().port}`
//   //   );
//   //   console.log(
//   //     '💳  Step 2 : Copy and Paste the clientId and clientSecret from : https://developer.intuit.com'
//   //   );
//   //   console.log(
//   //     `💳  Step 3 : Copy Paste this callback URL into redirectURI :` +
//   //       'http://localhost:' +
//   //       `${server.address().port}` +
//   //       '/callback'
//   //   );
//   //   console.log(
//   //     `💻  Step 4 : Make Sure this redirect URI is also listed under the Redirect URIs on your app in : https://developer.intuit.com`
//   //   );
//   // }
// });

export default app;

/**
 * Optional : If NGROK is enabled
 */
// if (ngrok) {
//   console.log('NGROK Enabled');
//   ngrok
//     .connect({ addr: process.env.PORT || 8000 })
//     .then((url) => {
//       redirectUri = `${url}/callback`;
//       console.log(`💳 Step 1 : Paste this URL in your browser :  ${url}`);
//       console.log(
//         '💳 Step 2 : Copy and Paste the clientId and clientSecret from : https://developer.intuit.com'
//       );
//       console.log(`💳 Step 3 : Copy Paste this callback URL into redirectURI :  ${redirectUri}`);
//       console.log(
//         `💻 Step 4 : Make Sure this redirect URI is also listed under the Redirect URIs on your app in : https://developer.intuit.com`
//       );
//     })
//     .catch(() => {
//       process.exit(1);
//     });
// }
