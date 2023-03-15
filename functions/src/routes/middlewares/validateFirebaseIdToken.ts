import * as functions from 'firebase-functions';
import 'firebase-functions';
import { Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

import { RequestUserAuth } from '../../common';

// https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js

export const validateFirebaseIdToken = async (
  req: RequestUserAuth,
  res: Response,
  next: NextFunction
) => {
  functions.logger.log('Check if request is authorized with Firebase ID token');
  try {
    if (
      (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)
    ) {
      functions.logger.error(
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
      functions.logger.log('Found "Authorization" header');
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
      functions.logger.log('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      // throw new NotAuthorizedError('Unauthorized');
      res.status(403).send('Unauthorized');
      return;
    }

    try {
      console.log('ID TOKEN: ', idToken);
      // console.log(auth.)
      const decodedIdToken = await auth.verifyIdToken(idToken);
      functions.logger.log('ID Token correctly decoded: ', decodedIdToken);
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
      console.log('ERROR CODE: ', err.code);
      // throw new NotAuthorizedError('Unauthorized');
      res.status(403).send('Unauthorized');
      return;
    }
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
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
