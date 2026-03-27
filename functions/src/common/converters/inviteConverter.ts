import { Invite, InviteClass } from '@idemand/common';
import {
  QueryDocumentSnapshot,
  type FirestoreDataConverter,
} from 'firebase-admin/firestore';
import { hostingBaseURL, iDemandOrgId } from '../environmentVars.js';

export const inviteConverter: FirestoreDataConverter<InviteClass, Invite> = {
  // toFirestore(invite: InviteClass): DocumentData {
  toFirestore(invite: InviteClass): Invite {
    return {
      email: invite.email,
      displayName: invite.displayName ?? '',
      firstName: invite.displayName ?? '',
      lastName: invite.lastName ?? '',
      link: (invite as InviteClass).getLink
        ? (invite as InviteClass).getLink()
        : invite.link || '', // invite.getLink(),
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
    return new InviteClass(
      { ...data },
      hostingBaseURL.value(),
      iDemandOrgId.value(),
    );
  },
};

// export class InviteConverter implements FirestoreDataConverter<
//   InviteClass,
//   Invite,
//   Invite
// > {
//   toFirestore(invite: Invite | InviteClass): WithFieldValue<Invite> {
//     return {
//       email: invite.email,
//       displayName: invite.displayName ?? '',
//       firstName: invite.displayName ?? '',
//       lastName: invite.lastName ?? '',
//       link: (invite as InviteClass).getLink
//         ? (invite as InviteClass).getLink()
//         : invite.link || '',
//       customClaims: invite.customClaims ?? {},
//       orgId: invite.orgId ?? null,
//       orgName: invite.orgName ?? '',
//       status: invite.status,
//       isCreateOrgInvite: invite.isCreateOrgInvite,
//       id: invite.id ?? invite.email,
//       invitedBy: invite.invitedBy || null,
//       metadata: this._updateMetadata(invite.metadata),
//     };
//   }

//   fromFirestore(snapshot: QueryDocumentSnapshot): InviteClass {
//     const data = snapshot.data() as Invite;
//     return new InviteClass(
//       { ...data },
//       hostingBaseURL.value(),
//       iDemandOrgId.value(),
//     );
//   }

//   _updateMetadata(meta: Invite['metadata']) {
//     return {
//       ...meta,
//       created: meta.created ?? Timestamp.now(),
//       updated: Timestamp.now(),
//     };
//   }
// }

// class PostConverter implements FirestoreDataConverter<Post, PostDbModel> {
//   toFirestore(post: WithFieldValue<Post>): WithFieldValue<PostDbModel> {
//     return {
//       ttl: post.title,
//       aut: this._autFromAuthor(post.author),
//       lut: this._lutFromLastUpdatedMillis(post.lastUpdatedMillis),
//     };
//   }

//   fromFirestore(snapshot: QueryDocumentSnapshot): Post {
//     const data = snapshot.data() as PostDbModel;
//     const author = `${data.aut.firstName} ${data.aut.lastName}`;
//     return new Post(data.ttl, author, data.lut.toMillis());
//   }

//   _autFromAuthor(
//     author: string | FieldValue,
//   ): { firstName: string; lastName: string } | FieldValue {
//     if (typeof author !== 'string') {
//       // `author` is a FieldValue, so just return it.
//       return author;
//     }
//     const [firstName, lastName] = author.split(' ');
//     return { firstName, lastName };
//   }

//   _lutFromLastUpdatedMillis(
//     lastUpdatedMillis: number | FieldValue,
//   ): Timestamp | FieldValue {
//     if (typeof lastUpdatedMillis !== 'number') {
//       // `lastUpdatedMillis` must be a FieldValue, so just return it.
//       return lastUpdatedMillis;
//     }
//     return Timestamp.fromMillis(lastUpdatedMillis);
//   }
// }
