import { error, info } from 'firebase-functions/logger';
import { Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

import { RequestUserAuth } from '../../common/index.js';

// https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js

// TODO: separate out setting taken on req.user, then delete
// and require auth into separate middleware
// ex: https://github.com/StephenGrider/ticketing/blob/master/common/src/middlewares/current-user.ts

// throws if token not found in Authorization or cookie
// sets decoded token on req.user, if present

export const validateFirebaseIdToken = async (
  req: RequestUserAuth,
  res: Response,
  next: NextFunction
) => {
  info('Checking if request is authorized with Firebase ID token');
  try {
    if (
      (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)
    ) {
      error(
        'No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.'
      );

      // throw new NotAuthorizedError('Unauthorized');
      res.status(403).send('Unauthorized');
      return;
    }

    const auth = getAuth();
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      info('Found "Authorization" header');
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
      info('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      // throw new NotAuthorizedError('Unauthorized');
      res.status(403).send('Unauthorized');
      return;
    }

    try {
      info(`ID TOKEN: ${idToken}`);
      const decodedIdToken = await auth.verifyIdToken(idToken);
      info('ID Token correctly decoded: ', { decodedIdToken });
      // if (decodedIdToken.firebase.tenant === 'TENANT-ID1') {
      //   // Allow appropriate level of access for TENANT-ID1.
      // } else if (decodedIdToken.firebase.tenant === 'TENANT-ID2') {
      //   // Allow appropriate level of access for TENANT-ID2.
      // }
      // else {
      //   // Block access for all other tenants.
      //   throw new Error('Access not allowed.');
      // }
      const tenantId = decodedIdToken.firebase.tenant;
      req.user = decodedIdToken;
      req.tenantId = tenantId;

      next();
      return;
    } catch (err) {
      // eslint-disable-next-line
      // @ts-ignore
      error('error verifying ID token', { err });
      // throw new NotAuthorizedError('Unauthorized');
      res.status(403).send('Unauthorized');
      return;
    }
  } catch (error: any) {
    error('Error while verifying Firebase ID token:', { ...error });
    // TODO: handle revolked tokens - https://cloud.google.com/identity-platform/docs/multi-tenancy-managing-tenants#managing_user_sessions

    // const { code, message } =
    //   error instanceof FirebaseError ? error : { code: 'unknown', message: 'an error occurred' };

    // // TRIGGER REAUTH ON FRONT END
    // // eslint-disable-next-line
    // // @ts-ignore
    // if (code === 'auth/id-token-revoked') {
    //   console.log('TODO: HANDLE AUTH TOKEN REVOLKED');
    //   next(new NotAuthorizedError('Token revoked. Please try logging ouot and logging back in.'));
    //   return;
    // }
    // console.log(message);
    // throw new NotAuthorizedError(message);
    next(error);
    return;
  }
};
