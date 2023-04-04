import * as functions from 'firebase-functions';
import 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

import { invitesCollection, orgsCollection } from '../common/dbCollections';
import { inviteConverter } from '../common/converters';
import { InviteClass } from '../common/types';

// TODO: allow invites without tenant association ??

export interface NewUser {
  email: string;
  name: string;
  access: 'admin' | 'agent' | ''; // AccessLevels | '';
}

export interface InviteUsersRequest {
  users: NewUser[];
  tenantId?: string | null;
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

export const inviteUsers = functions.https.onCall(
  async (data: { users: NewUser[]; tenantId?: string }, context) => {
    const { auth } = context;
    if (!auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin permissions required');
    }

    // TODO: check for company ID? allow invites using different function if not inviting agents ? inviteUsers vs inviteOrgUsers

    if (!context.auth?.token.firebase.tenant && !auth?.token.iDemandAdmin) {
      throw new functions.https.HttpsError('failed-precondition', 'User missing tenantId');
    }
    // allow other users to invite (super admins, etc. ??)
    if (!data.users || !Array.isArray(data.users)) {
      throw new functions.https.HttpsError('failed-precondition', 'Request body missing users');
    }

    let { users, tenantId } = data;
    if (!tenantId) {
      tenantId = context.auth?.token.firebase.tenant;
    }
    if (!tenantId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Missing user tenant and request tenantId'
      );
    }

    const db = getFirestore();
    const inviteColRef = invitesCollection(db, tenantId);
    const orgsColRef = orgsCollection(db);
    const orgSnap = await orgsColRef.doc(tenantId).get();
    if (!orgSnap.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Org doc not found with ID ${tenantId}`
      );
    }
    const orgData = orgSnap.data();
    // Require email domain matches org ? make it a setting ?
    const tenantAuth = getAuth().tenantManager().authForTenant(tenantId);
    const reqUser = await tenantAuth.getUser(auth.uid);
    console.log('users: ', users);
    try {
      const batch = db.batch();
      // eslint-disable-next-line
      const res: { [key: string]: any } = {};

      for (const user of users) {
        const inviteDocRef = inviteColRef.withConverter(inviteConverter).doc(user.email);

        functions.logger.log(
          `invite doc created for ${user.name} - ${user.email} with permission level: ${user.access}`
        );
        // TODO: check if already exist? allow multiple accounts in different tenants?

        const customClaims = user.access ? { [user.access]: true } : {};
        const newInvite = new InviteClass({
          email: user.email,
          displayName: user.name,
          firstName: user.name.split(' ')[0] || '',
          lastName: user.name.split(' ')[1] || '',
          // link,
          customClaims,
          orgId: tenantId,
          orgName: orgData?.orgName,
          status: 'pending',
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
        });
        console.log('New Invite: ', newInvite);

        batch.set(inviteDocRef, newInvite);

        res[user.email] = {
          status: 'pending',
          inviteId: inviteDocRef.id,
          inviteRef: inviteDocRef.path,
          email: user.email,
          recipientName: user.name,
          customClaims,
        };
        console.log('res: ', res);
      }

      console.log('committing batch...');
      await batch.commit();

      return { ...res };
    } catch (err) {
      return err;
    }
  }
);
