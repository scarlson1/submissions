import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { Invite, InviteClass } from '../types.js';

export const inviteConverter = {
  toFirestore(invite: InviteClass): DocumentData {
    return {
      email: invite.email,
      displayName: invite.displayName ?? '',
      firstName: invite.displayName ?? '',
      lastName: invite.lastName ?? '',
      link: invite.getLink(),
      customClaims: invite.customClaims ?? {},
      orgId: invite.orgId ?? null,
      orgName: invite.orgName ?? '',
      status: invite.status,
      isCreateOrgInvite: invite.isCreateOrgInvite,
      id: invite.id ?? invite.email,
      invitedBy: invite.invitedBy || null,
      metadata: invite.metadata,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<Invite>): InviteClass {
    // it's better to transfer the snapshot directly to the model, in the converter, and do the data access within the model. This becomes more apparent when you need to access other properties, like snapshot.id, for example.
    // TODO: transfer snapshot to model? setting id, etc.
    const data = snapshot.data();
    return new InviteClass({ ...data });
  },
};
