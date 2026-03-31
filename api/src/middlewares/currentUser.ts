// cloud run docs ref: https://cloud.google.com/run/docs/tutorials/identity-platform

import { NextFunction, Request, Response } from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

import { AuthError } from '../errors/index.js';

// only extracts & decodes token -- does NOT block access or require auth

export interface RequestUserAuth extends Request {
  user?: DecodedIdToken;
  tenantId?: string;
}

export const currentUser = async (
  req: RequestUserAuth,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth();
  let idToken;

  try {
    if (
      (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)
    ) {
      return next();
    }
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      console.log('Found "Authorization" header');

      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
      console.log('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    }
  } catch (err: any) {
    console.error('Error checking for ID token in header', { err });
  }

  if (!idToken) return next();

  try {
    console.log(`ID TOKEN FOUND: ${idToken}`);
    const decodedIdToken = await auth.verifyIdToken(idToken);

    const tenantId = decodedIdToken.firebase.tenant;

    req.user = decodedIdToken;
    req.tenantId = tenantId;
  } catch (err: any) {
    const code = err?.code;
    if (code === 'auth/id-token-revoked')
      throw new AuthError(
        code,
        'Token revoked. Reauthenticate to refresh token.',
        401,
      );

    // handle other error types ??

    console.error(
      'Error decoding firebase idToken. continuing to next middleware without setting user...',
      {
        err,
        code: code || null,
        errMsg: err?.message || null,
      },
    );
  }

  next();
};
