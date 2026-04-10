import type { User } from 'firebase/auth';
import { where, type QueryFieldFilterConstraint } from 'firebase/firestore';

export function getPoliciesQueryProps(
  user: User,
  claims: {
    iDemandAdmin: boolean;
    orgAdmin: boolean;
    agent: boolean;
  },
): { constraints: QueryFieldFilterConstraint[] } {
  let props: { constraints: QueryFieldFilterConstraint[] } = {
    constraints: [],
  };
  if (claims?.iDemandAdmin) {
    props = {
      constraints: [],
    };
  } else if (claims?.orgAdmin && user.tenantId) {
    props = {
      constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
    };
  } else if (claims?.agent) {
    props = {
      constraints: [where('agent.userId', '==', user.uid)],
    };
  } else {
    props = {
      constraints: [where('namedInsured.userId', '==', user.uid)],
      // constraints: [where('userId', '==', user.uid)],
    };
  }
  return props;
}
