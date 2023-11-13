import { InviteClass } from '@idemand/common';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { inviteConverter } from '../common/converters/index.js';
import {
  CLAIMS,
  INVITE_STATUS,
  hostingBaseURL,
  iDemandOrgId,
  invitesCollection,
  orgsCollection,
} from '../common/index.js';
import { onCallWrapper } from '../services/sentry/index.js';

// TODO: allow invites without tenant association ??
// TODO: rename to inviteOrgUsers
// MOVE TO FRONT END ?? IS CLOUD FUNCTION NEEDED ?? BATCH ??

export interface NewUser {
  email: string;
  name: string;
  access: CLAIMS.ORG_ADMIN | CLAIMS.AGENT | CLAIMS.IDEMAND_ADMIN | CLAIMS.IDEMAND_USER | ''; // AccessLevels | '';
}

export interface InviteUsersRequest {
  users: NewUser[];
  tenantId?: string | null;
  orgId?: string | null;
}
export interface InviteUsersResponse {
  [email: string]: {
    status: string;
    inviteId: string;
    inviteRef: string;
    email: string;
    recipientName: string; // eslint-disable-next-line
    customClaims: { [key: string]: any };
  };
}

const inviteUsers = async ({ data, auth }: CallableRequest<InviteUsersRequest>) => {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Must be signed in.');

  const isIDemandAdmin = auth?.token[CLAIMS.IDEMAND_ADMIN];

  if (!(auth?.token[CLAIMS.ORG_ADMIN] || isIDemandAdmin))
    throw new HttpsError('permission-denied', 'Admin permissions required');

  // TODO: check for org ID? allow invites using different function if not inviting agents ? inviteUsers vs inviteOrgUsers

  if (!auth?.token.firebase.tenant && !isIDemandAdmin)
    throw new HttpsError('failed-precondition', 'User missing tenantId');

  // allow other users to invite (super admins, etc. ??)
  if (!data.users || !Array.isArray(data.users))
    throw new HttpsError('failed-precondition', 'Request body missing array of users');

  const userTenantId = auth?.token.firebase.tenant;
  let { users, tenantId, orgId } = data;

  if (orgId !== iDemandOrgId.value()) {
    if (!tenantId) tenantId = userTenantId;
    if (!orgId) orgId = tenantId;

    if (!tenantId)
      throw new HttpsError('failed-precondition', 'Missing user tenant and request tenantId');
  }

  if (userTenantId !== tenantId && !isIDemandAdmin)
    throw new HttpsError('permission-denied', 'Invites must be to your organization');

  if (!tenantId && !isIDemandAdmin) throw new HttpsError('failed-precondition', 'Missing tenantId');

  if (!orgId) throw new HttpsError('failed-precondition', 'Missing orgId');

  const db = getFirestore();
  const inviteColRef = invitesCollection(db, orgId);
  const orgsColRef = orgsCollection(db);
  const orgSnap = await orgsColRef.doc(orgId).get();
  if (!orgSnap.exists) {
    throw new HttpsError('failed-precondition', `Org doc not found with ID ${orgId}`);
  }
  const orgData = orgSnap.data();

  let reqUser;
  if (!isIDemandAdmin) {
    // Require email domain matches org ? make it a setting ?
    const tenantAuth = getAuth().tenantManager().authForTenant(tenantId!);
    reqUser = await tenantAuth.getUser(auth.uid);
  } else {
    reqUser = await getAuth().getUser(auth.uid);
  }

  info('creating invite docs for users: ', { users });
  try {
    const batch = db.batch();
    // eslint-disable-next-line
    const res: { [key: string]: any } = {};

    for (const user of users) {
      const inviteDocRef = inviteColRef
        .withConverter(inviteConverter)
        .doc(user.email.toLocaleLowerCase().trim());

      info(
        `Creating invite doc for ${user.name} - ${user.email} with permission level: ${user.access}`
      );
      // TODO: check if already exist? allow multiple accounts in different tenants?

      // link, set in firestore converter - move outside so error can be handled if there is one ?
      // TODO: better data validation ??
      const customClaims = user.access ? { [user.access]: true } : {};
      const newInvite = new InviteClass(
        {
          email: user.email.toLowerCase().trim(),
          displayName: user.name.trim(),
          firstName: user.name.split(' ')[0] || '',
          lastName: user.name.split(' ')[1] || '',
          customClaims,
          // orgId: tenantId,
          orgId,
          orgName: orgData?.orgName || '',
          status: INVITE_STATUS.PENDING,
          sent: false,
          id: inviteDocRef.id,
          invitedBy: {
            name: reqUser.displayName || '',
            email: auth.token.email || '',
            userId: auth.uid,
          },
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        },
        hostingBaseURL.value(),
        iDemandOrgId.value()
      );

      batch.set(inviteDocRef, newInvite);

      res[user.email] = {
        status: INVITE_STATUS.PENDING,
        inviteId: inviteDocRef.id,
        inviteRef: inviteDocRef.path,
        email: user.email,
        recipientName: user.name,
        customClaims,
      };
    }

    info('committing batch...');
    await batch.commit();

    info('INVITE USERS RES: ', { res });
    return { ...res };
  } catch (err: any) {
    // return err;
    let msg = `Error generating invite docs`;
    if (err?.message) msg = err.message;

    error(msg, { err });
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<InviteUsersRequest>('inviteusers', inviteUsers);
