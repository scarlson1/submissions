// https://www.algolia.com/doc/guides/security/api-keys/how-to/user-restricted-access-to-data/

export interface RecordGroupIds {
  orgId: string | null | undefined;
  userId: string | null | undefined;
  agentId: string | null | undefined;
}
export type VisibleByTypes = 'orgAdmin' | 'agent' | 'orgUser' | 'user' | 'all' | 'anon' | 'authed';

export const visibleType = {
  all: 'group/all',
  authed: 'group/authed',
  anon: 'group/anon',
  user: (uid: string) => `${uid}`,
  agent: (uid: string) => `${uid}`,
  orgAdmin: (orgId: string) => `group/admin/${orgId}`,
  // orgAdmin: function (orgId: string) {
  //   return `group/admin/${orgId}`;
  // },
  orgUser: (orgId: string) => `group/${orgId}`,
};

/** generates array of strings used to filter which user's can view the record (filter created when user's search key is generated) */

export function getVisibleBy({ orgId, userId, agentId }: RecordGroupIds, groups: VisibleByTypes[]) {
  const visibleBy: string[] = [];

  groups.forEach((g) => {
    switch (g) {
      case 'orgAdmin':
        // orgId && visibleBy.push(`group/admin/${orgId}`);
        orgId && visibleBy.push(visibleType.orgAdmin(orgId));
      case 'agent':
        agentId && visibleBy.push(visibleType.agent(agentId));
      case 'user':
        userId && visibleBy.push(visibleType.user(userId));
      case 'orgUser':
        orgId && visibleBy.push(visibleType.orgUser(orgId)); // `group/${orgId}`
      case 'all':
        visibleBy.push(visibleType.all); // 'group/all'
      case 'authed':
        visibleBy.push(visibleType.authed); // 'group/authed'
      case 'anon':
        visibleBy.push(visibleType.anon); // 'group/anon'
    }
  });

  return visibleBy;
}
