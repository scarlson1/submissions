import { DecodedIdToken } from 'firebase-admin/auth';
// import { AuthData } from 'firebase-functions/lib/common/providers/https.js';
import { HttpsError } from 'firebase-functions/v1/auth';
import { AuthData } from 'firebase-functions/v2/tasks';

import { CLAIMS } from '../../common/index.js';

export const isIDemandAdmin = (token?: DecodedIdToken | undefined) =>
  token ? token[CLAIMS.IDEMAND_ADMIN] || false : false;

export function requireIDemandAdminClaims(
  token: DecodedIdToken | undefined,
  errMsg?: string
): asserts token is DecodedIdToken {
  if (!isIDemandAdmin(token)) {
    let msg = errMsg || 'Admin permissions required';

    throw new HttpsError('permission-denied', msg);
  }

  return;
}

export function requireAuth(auth: AuthData | undefined): asserts auth is AuthData {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'must be signed in');
  return;
}
