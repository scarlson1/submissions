import { Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { error, info } from 'firebase-functions/logger';

import { RequestUserAuth } from '../../common';

// sets the current users decoded id token on req.user, if included in Authorization header

export const currentUser = async (req: RequestUserAuth, res: Response, next: NextFunction) => {
  info('Setting current users Firebase ID token on reqest, if present');

  try {
    if (
      (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)
    ) {
      return next();
    }

    const auth = getAuth();
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      info('Found "Authorization" header');

      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
      info('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    }

    if (!idToken) return next();

    try {
      info(`ID TOKEN FOUND`, { idToken });
      const decodedIdToken = await auth.verifyIdToken(idToken);
      // info('ID Token correctly decoded: ', { decodedIdToken });

      const tenantId = decodedIdToken.firebase.tenant;
      req.user = decodedIdToken;
      req.tenantId = tenantId;
    } catch (err: any) {
      error('Error decoding firebase idToken');
    }
  } catch (err: any) {
    error('Error validating token and setting token on req.user');
  }

  next();
};
