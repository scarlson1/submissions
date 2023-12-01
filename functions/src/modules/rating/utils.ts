import {
  Organization,
  PrivilegedPolicyData,
  Product,
  User,
  orgsCollection,
  secureCollection,
  usersCollection,
} from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { warn } from 'firebase-functions/logger';
import { defaultCommissionAsInt } from '../../common/environmentVars.js';
import { hasAny } from '../../utils/index.js';
import { createDocId, getDocData } from '../db/utils.js';

// TODO: need to also check property details that go to SR (optionally pass propertyDetails as second arg ??)
const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

export const requiresRerate = (changesKeys: string[]) => {
  return hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);
};

export const getDefaultComm = async ({
  agentId,
  orgId,
  product,
}: {
  orgId?: string;
  agentId?: string;
  product: Product;
}) => {
  const db = getFirestore();

  try {
    if (agentId) {
      const agentRef = usersCollection(db).doc(agentId);
      const agent = await getDocData<User>(agentRef);
      if (agent.defaultCommission) {
        let agentComm = agent.defaultCommission[product];
        if (agentComm && typeof agentComm === 'number' && agentComm >= 0 && agentComm <= 0.3) {
          return {
            subproducerCommissionPct: agentComm,
            commPctSource: 'agent',
          };
        }
      }
    }
  } catch (err: any) {
    warn(`Error fetching commission from agent record`);
  }

  try {
    if (orgId) {
      const orgRef = orgsCollection(db).doc(orgId);
      const org = await getDocData<Organization>(orgRef);
      if (org.defaultCommission) {
        let orgComm = org.defaultCommission[product];
        if (orgComm && typeof orgComm === 'number' && orgComm >= 0 && orgComm <= 0.3) {
          return {
            subproducerCommissionPct: orgComm,
            commPctSource: 'org',
          };
        }
      }
    }
  } catch (err: any) {
    warn(`Error fetching commission from agent record`);
  }

  return {
    subproducerCommissionPct: defaultCommissionAsInt.value() / 100,
    commPctSource: 'default',
  };
};

const createNewCommDoc = async (options: {
  orgId?: string;
  agentId?: string;
  product: Product;
}) => {
  let initialData = await getDefaultComm(options);

  const db = getFirestore();
  const secureCol = secureCollection<PrivilegedPolicyData>(db);
  const newCommDocId = createDocId(8);
  // @ts-ignore delete after updating common
  await secureCol.doc(newCommDocId).set({
    ...initialData,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  });

  return { ...initialData, commDocId: newCommDocId };
};

const getCommDocData = async (commDocId: string) => {
  const db = getFirestore();
  const commDocRef = secureCollection<PrivilegedPolicyData>(db).doc(commDocId);
  return getDocData<PrivilegedPolicyData>(commDocRef);
};

// don't create new on failure if policy already bound (only submission / quote stages)
export const getCommData = async (
  commDocId: string | undefined,
  options: { orgId?: string; agentId?: string; product: Product },
  createNewOnFailure?: boolean
) => {
  if (!commDocId) return createNewCommDoc(options);

  try {
    const commDocData = await getCommDocData(commDocId);

    return commDocData;
  } catch (err: any) {
    warn(`failed to retrieve provided commission doc... creating new one...`);
    if (createNewOnFailure) return createNewCommDoc(options);
    throw err;
  }
};
