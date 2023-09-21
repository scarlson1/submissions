import * as bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { Auth, TenantAwareAuth, UserImportOptions, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import jwt from 'jsonwebtoken';

import { migrateUser, updateUserDoc } from '../callables/moveUserToTenant.js';
import {
  emailVerificationKey,
  firebaseHashConfig,
  hostingBaseURL,
  invitesCollection,
} from '../common/index.js';

const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

interface JwtPayload {
  uid: string;
  tenantId?: string | null;
  email: string;
}

// Custom email verification for emails generated in blocking function
app.get('/verify-email/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const verificationKey = emailVerificationKey.value();
    if (!verificationKey) throw new Error('Missing environment variable');

    const { data } = jwt.verify(token, verificationKey) as { data: JwtPayload };
    // TODO: use --> getDecodedToken

    info('DECODED TOKEN: ', { data });
    const { uid, email } = data;

    if (!uid) throw new Error('Invalid verification token.');

    await getAuth().updateUser(uid, { emailVerified: true });

    // TODO: send html template ?? with sign in button link
    // or redirect ??

    // res.send(`${email} has been verified!`);
    let url = hostingBaseURL.value();
    if (url.startsWith('http://')) url.replace('http://', '//');
    if (url.startsWith('https://')) url.replace('https://', '//');

    res.redirect(`${url}/auth/email-verified?email=${email}`);
  } catch (err: any) {
    error('ERROR DECODING TOKEN: ', err);
    let msg = 'Invalid token. Please generate a new verification email.';
    if (err?.message) msg += ` (${err.message})`;
    // "Email verification failed, possibly the link is invalid or expired"
    // throw new BadRequestError('Invalid token. Please generate a new verification email.');
    res.send(msg);
  }
});

export interface MoveTenantJwtPayload {
  uid: string;
  fromTenantId: string | null;
  toTenantId: string | null;
  email: string;
}

// verification when user has account, then creates agency --> move account to tenant auth
app.get('/confirm-move-tenant/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const verificationKey = emailVerificationKey.value();
  let decodedToken: MoveTenantJwtPayload;

  try {
    decodedToken = await getDecodedToken<MoveTenantJwtPayload>(verificationKey, token);
  } catch (err: any) {
    let msg = 'Error verifying link';
    if (err?.message) msg += ` (${err.message})`;

    res.send(msg);
    return;
  }

  try {
    const firestore = getFirestore();
    const { uid, email, fromTenantId, toTenantId } = decodedToken;

    if (toTenantId) {
      await verifyInviteValid(firestore, email, toTenantId);
    }

    const hashConfigStr = firebaseHashConfig.value();
    const parsedHashConfig = JSON.parse(hashConfigStr);
    const { algorithm, base64_signer_key, base64_salt_separator, rounds, mem_cost } =
      parsedHashConfig;

    if (!(algorithm && base64_signer_key && base64_salt_separator && rounds && mem_cost)) {
      throw new Error('Missing required environment variables (password hash config)');
    }

    let authFrom: Auth | TenantAwareAuth = getAuth();
    let authTo: Auth | TenantAwareAuth = getAuth();

    if (fromTenantId) {
      authFrom = authFrom.tenantManager().authForTenant(fromTenantId);
    }
    if (toTenantId) {
      authTo = authTo.tenantManager().authForTenant(toTenantId);
    }

    const userImportOptions: UserImportOptions = {
      hash: {
        algorithm,
        key: Buffer.from(base64_signer_key, 'base64'),
        saltSeparator: Buffer.from(base64_salt_separator, 'base64'),
        rounds,
        memoryCost: mem_cost,
      },
    };
    await migrateUser(authFrom, authTo, uid, userImportOptions);

    info(`USER ${uid} moved from ${fromTenantId} to tenant ${toTenantId}`, {
      userId: uid,
      fromTenantId,
      toTenantId,
    });

    await updateUserDoc(firestore, uid, toTenantId);

    // TODO: emit user-moved-tenants event
    // TODO: redirect to tenant sign in page

    const tenantAuthLink = `${hostingBaseURL.value()}/auth/login${
      toTenantId ? '/' + toTenantId : ''
    }?email=${encodeURIComponent(email)}`;

    res.send(
      `Account moved to tenant ${toTenantId}. Please use the following URL to sign in: ${tenantAuthLink}`
    );
  } catch (err: any) {
    let msg = 'Error migrating user';
    if (err?.message) msg += ` (${err.message})`;

    res.send(msg);
  }
});

async function getDecodedToken<T>(key: string, token: any) {
  try {
    const { data } = jwt.verify(token, key) as { data: T };
    info('DECODED TOKEN: ', { data });

    return data;
  } catch (err: any) {
    error('Error decoding token: ', { err });
    throw err;
  }
}

async function verifyInviteValid(firestore: Firestore, email: string, toTenantId: string) {
  const inviteSnap = await invitesCollection(firestore, toTenantId).doc(email).get();

  if (!inviteSnap.exists) throw new Error(`Invite not found for ${email} in orgId ${toTenantId}`);

  if (inviteSnap.data()?.status === 'revoked')
    throw new Error(
      `Invite has been revoked. If you believe this was by mistake, please contact the org admin.`
    );
}

export default app;
// export const authRequests = functions
//   .runWith({ secrets: [emailVerificationKey] })
//   .https.onRequest(app);

// TODO: need to add auth middleware and send token with request

// https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js

// TODO: set up redirect
// https://firebase.google.com/docs/hosting/full-config#rewrite-functions

// app.get(
//   '/assign-quote/:quoteId',
//   validateFirebaseIdToken,
//   async (req: RequestUserAuth, res: Response) => {
//     const { quoteId } = req.params;
//     const db = getFirestore();
//     console.log('REQ.USER: ', req.user);

//     if (!req.user || !req.user.uid) {
//       return res.status(403).send('Must be authenticated associate your account with a quote.');
//     }

//     try {
//       const quoteRef = quotesCollection(db).doc(quoteId);
//       const quoteSnap = await quoteRef.get();
//       // TODO: redirect to 404 page
//       if (!quoteSnap.exists)
//         return res.status(404).send({ message: `quote not found (ID: ${quoteId})` });
//       const data = quoteSnap.data();

//       // TODO: decide what to do if userId already exists (could be anonymous)

//       console.log('quote data: ', data);
//       await quoteRef.update({ userId: req.user?.uid });
//       console.log(`UPDATED QUOTE USER ID TO ${req.user?.uid}`);

//       // return res.redirect(`${process.env.HOSTING_BASE_URL}/quotes/${quoteId}/bind`);
//       return res.redirect(`//localhost:3000/quotes/${quoteId}/bind`);
//     } catch (err) {
//       console.log('ERROR DECODING TOKEN: ', err);
//       // "Email verification failed, possibly the link is invalid or expired"
//       // throw new BadRequestError('Invalid token. Please generate a new verification email.');
//       res.send('Invalid token. Please generate a new verification email.');
//     }
//   }
// );

// app.use(errorHandler);
