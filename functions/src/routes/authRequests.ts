import * as functions from 'firebase-functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import jwt from 'jsonwebtoken';

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

// app.use(errorHandler);

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey] })
  .https.onRequest(app);
