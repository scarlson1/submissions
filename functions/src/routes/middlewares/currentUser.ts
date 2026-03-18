import { NextFunction, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { error, info } from 'firebase-functions/logger';

import { RequestUserAuth } from '../../common/index.js';
import { TokenRevokedError } from '../errors/index.js';

// sets the current users decoded id token on req.user, if included in Authorization header

export const currentUser = async (req: RequestUserAuth, res: Response, next: NextFunction) => {
  info('Setting current users Firebase ID token on request, if present');

  const auth = getAuth();
  let idToken;

  try {
    if (
      (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)
    ) {
      return next();
    }
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      info('Found "Authorization" header');

      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
      info('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    }
  } catch (err: any) {
    error('Error checking for ID token in header', { err });
  }

  if (!idToken) return next();

  try {
    info(`ID TOKEN FOUND`); // { idToken }
    const decodedIdToken = await auth.verifyIdToken(idToken);

    const tenantId = decodedIdToken.firebase.tenant;

    req.user = decodedIdToken;
    req.tenantId = tenantId;
  } catch (err: any) {
    const code = err?.code;
    if (code === 'auth/id-token-revoked') throw new TokenRevokedError();

    error('Error decoding firebase idToken', {
      err,
      code: code || null,
      errMsg: err?.message || null,
    });
  }

  next();
};
