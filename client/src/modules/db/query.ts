import type { Collection as TCollection } from '@idemand/common';
import { Collection } from '@idemand/common';
import type { User } from 'firebase/auth';
import { where, type QueryFieldFilterConstraint } from 'firebase/firestore';

export function getPoliciesQueryProps(
  user: User,
  claims: {
    iDemandAdmin: boolean;
    // iDemandUser: boolean;
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

export function getQuoteQueryProps(
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
      // TODO: uncomment once verifying org ID is set on all quotes
      // constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else if (claims?.agent) {
    props = {
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else {
    props = {
      constraints: [where('userId', '==', user.uid)],
    };
  }
  return props;
}

export function getSubmissionQueryProps(
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
      // TODO: uncomment once verifying org ID is set on all quotes
      // constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else if (claims?.agent) {
    props = {
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else {
    props = {
      constraints: [where('userId', '==', user.uid)],
    };
  }
  return props;
}

type GetClaimsQueryPropsRes = {
  constraints: QueryFieldFilterConstraint[];
  // queryProps: {
  colName: TCollection;
  pathSegments?: string[];
  isCollectionGroup?: boolean;
  // };
};

export function getClaimsQueryProps(
  user: User,
  claims: {
    iDemandAdmin: boolean;
    // iDemandUser: boolean;
    orgAdmin: boolean;
    agent: boolean;
  },
  policyId: string | null = null,
  propConstraints: QueryFieldFilterConstraint[] = [],
): GetClaimsQueryPropsRes {
  let queryProps: Omit<GetClaimsQueryPropsRes, 'constraints'>;
  let constraints: GetClaimsQueryPropsRes['constraints'] = [...propConstraints];

  if (policyId) {
    queryProps = {
      colName: 'policies',
      pathSegments: [policyId, Collection.Enum.claims],
      isCollectionGroup: false,
    };
  } else {
    queryProps = {
      colName: 'claims',
      isCollectionGroup: true,
    };
  }
  if (claims?.iDemandAdmin) {
    // no additional constraint — admin sees all
  } else if (claims?.orgAdmin && user.tenantId) {
    constraints.push(where('agency.orgId', '==', user.tenantId));
  } else if (claims?.agent) {
    constraints.push(where('agent.userId', '==', user?.uid));
  } else {
    constraints.push(where('submittedBy.userId', '==', user?.uid));
  }

  return { ...queryProps, constraints };

  // let props: GetClaimsQueryPropsRes = {
  //   constraints: [],
  //   queryProps: {
  //     colName: Collection.enum.policies,
  //     isCollectionGroup: true
  //   }
  // };
  // if (policyId) {
  //   props.queryProps = {
  //     colName: 'policies',
  //     pathSegments: [policyId, CollectionZ.Enum.claims],
  //     isCollectionGroup: false,
  //   },
  // }
  // if (claims?.iDemandAdmin) {
  //   // props = {
  //   //   constraints: [],
  //   // };
  // } else if (claims?.orgAdmin && user.tenantId) {
  //   props.constraints = [where('agency.orgId', '==', `${user.tenantId}`)];
  //   // props = {
  //   //   constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
  //   // };
  // } else if (claims?.agent) {
  //   props.constraints = [where('agent.userId', '==', user.uid)];
  //   // props = {
  //   //   constraints: [where('agent.userId', '==', user.uid)],
  //   // };
  // } else {
  //   // TODO: add or submittedBy.userId == user.uid ??
  //   props.constraints = [where('namedInsured.userId', '==', user.uid)];
  // }
  // return props;
}
