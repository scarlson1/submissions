import { DecodedIdToken } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/v1/auth';

import { CLAIMS } from '../../common/index.js';

export function requireIDemandAdminClaims(
  token: DecodedIdToken | undefined,
  errMsg?: string
): asserts token is DecodedIdToken {
  const isIDemandAdmin = token ? token[CLAIMS.IDEMAND_ADMIN] || false : false;
  if (!isIDemandAdmin) {
    let msg = errMsg || 'Admin permissions required';

    throw new HttpsError('permission-denied', msg);
  }

  return;
}
