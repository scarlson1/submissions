import { DecodedIdToken } from 'firebase-admin/auth';
// import { AuthData } from 'firebase-functions/lib/common/providers/https.js';
// import type { AuthData } from 'firebase-functions/lib/common/providers/https.js';
import { HttpsError } from 'firebase-functions/v1/auth';

import {
  AgencyDetails,
  AgentDetails,
  NamedInsured,
  type Optional,
} from '@idemand/common';
import type { AuthData } from 'firebase-functions/tasks';
import { Claim } from '../../common/index.js';

export const hasClaim = (token: DecodedIdToken | undefined, claim: Claim) =>
  token ? token[claim] || false : false;

export const isIDemandAdmin = (token: DecodedIdToken | undefined) =>
  hasClaim(token, 'iDemandAdmin');
// token ? token[CLAIMS.IDEMAND_ADMIN] || false : false;

export const isAgent = (token: DecodedIdToken | undefined) =>
  hasClaim(token, 'agent'); // token ? token[CLAIMS.AGENT] || false : false;

export const isOrgAdmin = (token: DecodedIdToken | undefined) =>
  hasClaim(token, 'orgAdmin');
// token ? token[CLAIMS.ORG_ADMIN] || false : false;

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

export function requireAuth(
  auth: AuthData | undefined,
): asserts auth is AuthData {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'must be signed in');
  return;
}

export type AgentAndAgencyDoc = {
  namedInsured?: Optional<NamedInsured>;
  agent: Optional<AgentDetails>;
  agency: Optional<AgencyDetails>;
  userId: string | null;
};
// TODO: doc typing (make generic with extends type with agent & agency)
export function requireOwnerAgentAdmin<T extends AgentAndAgencyDoc>(
  auth: AuthData | undefined,
  doc: T,
  errMsg: string = 'unauthorized',
): asserts auth is AuthData {
  requireAuth(auth);
  const uid = auth.uid;
  const tenantId = auth.token.firebase?.tenant;

  const userIsOwner = uid === doc?.userId;
  const userIsNamedInsured = uid === doc?.namedInsured?.userId;
  const userIsAgent = isAgent(auth?.token) && uid === doc?.agent?.userId;
  const userIsOrgAdmin =
    isOrgAdmin(auth?.token) && tenantId === doc?.agency?.orgId;
  const userIsIDemandAdmin = isIDemandAdmin(auth?.token);

  if (
    !(
      userIsOwner ||
      userIsNamedInsured ||
      userIsAgent ||
      userIsOrgAdmin ||
      userIsIDemandAdmin
    )
  )
    throw new HttpsError('permission-denied', errMsg);

  return;
}
