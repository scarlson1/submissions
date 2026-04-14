import { type Claim } from '@idemand/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { HttpsError } from 'firebase-functions/v1/auth';

export const hasClaim = (token: DecodedIdToken | undefined, claim: Claim) =>
  token ? token[claim] || false : false;

export const isIDemandAdmin = (token: DecodedIdToken | undefined) =>
  hasClaim(token, 'iDemandAdmin');

export function requireIDemandAdminClaims(
  token: DecodedIdToken | undefined,
  errMsg?: string,
): asserts token is DecodedIdToken {
  if (!isIDemandAdmin(token)) {
    const msg = errMsg || 'Admin permissions required';

    throw new HttpsError('permission-denied', msg);
  }

  return;
}
