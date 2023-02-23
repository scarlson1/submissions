import * as functions from 'firebase-functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import jwt from 'jsonwebtoken';
import { getFirestore } from 'firebase-admin/firestore';

import { RequestUserAuth, submissionsQuotesCollection } from '../common';
import { validateFirebaseIdToken } from './middlewares';

const emailVerificationKey = defineSecret('EMAIL_VERIFICATION_KEY');

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
    if (!process.env.EMAIL_VERIFICATION_KEY) throw new Error('Missing environment variable');

    const { data } = jwt.verify(token, process.env.EMAIL_VERIFICATION_KEY) as { data: JwtPayload };
    console.log('decoded: ', data);
    const { uid, email } = data;

    if (!uid) throw new Error('Invalid verification token.');

    await getAuth().updateUser(uid, { emailVerified: true });
    res.send(`${email} has been verified!`);
  } catch (err) {
    console.log('ERROR DECODING TOKEN: ', err);
    // "Email verification failed, possibly the link is invalid or expired"
    // throw new BadRequestError('Invalid token. Please generate a new verification email.');
    res.send('Invalid token. Please generate a new verification email.');
  }
});

// TODO: need to add auth middleware and send token with request

// https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js

// TODO: set up redirct
// https://firebase.google.com/docs/hosting/full-config#rewrite-functions

app.get(
  '/assign-quote/:quoteId',
  validateFirebaseIdToken,
  async (req: RequestUserAuth, res: Response) => {
    const { quoteId } = req.params;
    const db = getFirestore();
    console.log('REQ.USER: ', req.user);

    if (!req.user || !req.user.uid) {
      return res.status(403).send('Must be authenticated associate your account with a quote.');
    }

    try {
      const quoteRef = submissionsQuotesCollection(db).doc(quoteId);
      const quoteSnap = await quoteRef.get();
      // TODO: redirect to 404 page
      if (!quoteSnap.exists)
        return res.status(404).send({ message: `quote not found (ID: ${quoteId})` });
      const data = quoteSnap.data();

      // TODO: decide what to do if userId already exists (could be anonymous)

      console.log('quote data: ', data);
      await quoteRef.update({ userId: req.user?.uid });

      return res.redirect(`${process.env.HOSTING_BASE_URL}/quotes/${quoteId}/bind`);
    } catch (err) {
      console.log('ERROR DECODING TOKEN: ', err);
      // "Email verification failed, possibly the link is invalid or expired"
      // throw new BadRequestError('Invalid token. Please generate a new verification email.');
      res.send('Invalid token. Please generate a new verification email.');
    }
  }
);

// app.use(errorHandler);

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey] })
  .https.onRequest(app);
