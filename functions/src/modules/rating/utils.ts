import { CommSource, Product, orgsCollection, usersCollection } from '@idemand/common';
import { getFirestore } from 'firebase-admin/firestore';
import { info, warn } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';
import { defaultCommissionAsInt } from '../../common/environmentVars.js';
import { hasAny } from '../../utils/index.js';
import { getDocData } from '../db/utils.js';

// TODO: need to also check property details that go to SR (optionally pass propertyDetails as second arg ??)
const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

export const requiresRerate = (changesKeys: string[]) => {
  return hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);
};

function isValidComm(comm: unknown): asserts comm is number {
  invariant(typeof comm === 'number' && comm > 0 && comm <= 0.3);
}

function logCommMsg(comm: number, source: string) {
  info(`using subproducer comm of ${comm} from ${source} defaults`);
}

export const defaultComm = defaultCommissionAsInt.value() / 100;

export const getComm = async (
  prefSource: CommSource | null | undefined,
  orgId: string | null | undefined,
  agentId: string | null | undefined,
  product: Product
): Promise<{ subproducerCommissionPct: number; source: CommSource }> => {
  if (prefSource === 'default') return { subproducerCommissionPct: defaultComm, source: 'default' }; // TODO: verify can store .value() as const

  const db = getFirestore();
  if (prefSource === 'agent' && agentId) {
    try {
      const agentRef = usersCollection(db).doc(agentId);
      const agentData = await getDocData(agentRef);
      const agentComm = agentData?.defaultCommission && agentData?.defaultCommission[product];
      isValidComm(agentComm);
      logCommMsg(agentComm, 'agent');
      return { subproducerCommissionPct: agentComm, source: 'agent' };
    } catch (err: any) {
      warn(`Fetching comm from agent returned error --> falling back to org`, {
        errMsg: err?.message || null,
      });
    }
  }

  // will run if source === 'org' or retrieving from agent fails
  if (orgId) {
    try {
      const orgRef = orgsCollection(db).doc(orgId);
      const orgData = await getDocData(orgRef);
      const orgComm = orgData?.defaultCommission && orgData?.defaultCommission[product];
      isValidComm(orgComm);
      logCommMsg(orgComm, 'org');
      // @ts-ignore - until common update
      return { subproducerCommissionPct: orgComm, source: 'org' };
    } catch (err: any) {
      warn(`Fetching comm from org returned error --> falling back to default`, {
        errMsg: err?.message || null,
      });
    }
  }

  logCommMsg(defaultComm, 'fallback');
  return { subproducerCommissionPct: defaultComm, source: 'default' };
};

// export const getDefaultComm = async ({
//   agentId,
//   orgId,
//   product,
// }: {
//   orgId?: string;
//   agentId?: string;
//   product: Product;
// }) => {
//   const db = getFirestore();

//   try {
//     if (agentId) {
//       const agentRef = usersCollection(db).doc(agentId);
//       const agent = await getDocData<User>(agentRef);
//       if (agent.defaultCommission) {
//         let agentComm = agent.defaultCommission[product];
//         if (agentComm && typeof agentComm === 'number' && agentComm >= 0 && agentComm <= 0.3) {
//           return {
//             subproducerCommissionPct: agentComm,
//             commPctSource: 'agent',
//           };
//         }
//       }
//     }
//   } catch (err: any) {
//     warn(`Error fetching commission from agent record`);
//   }

//   try {
//     if (orgId) {
//       const orgRef = orgsCollection(db).doc(orgId);
//       const org = await getDocData<Organization>(orgRef);
//       if (org.defaultCommission) {
//         let orgComm = org.defaultCommission[product];
//         if (orgComm && typeof orgComm === 'number' && orgComm >= 0 && orgComm <= 0.3) {
//           return {
//             subproducerCommissionPct: orgComm,
//             commPctSource: 'org',
//           };
//         }
//       }
//     }
//   } catch (err: any) {
//     warn(`Error fetching commission from agent record`);
//   }

//   return {
//     subproducerCommissionPct: defaultCommissionAsInt.value() / 100,
//     commPctSource: 'default',
//   };
// };

// const createNewCommDoc = async (options: {
//   orgId?: string;
//   agentId?: string;
//   product: Product;
// }) => {
//   let initialData = await getDefaultComm(options);

//   const db = getFirestore();
//   const secureCol = secureCollection<PrivilegedPolicyData>(db);
//   const newCommDocId = createDocId(8);
//   // @ts-ignore delete after updating common
//   await secureCol.doc(newCommDocId).set({
//     ...initialData,
//     metadata: {
//       created: Timestamp.now(),
//       updated: Timestamp.now(),
//     },
//   });

//   return { ...initialData, commDocId: newCommDocId };
// };

// const getCommDocData = async (commDocId: string) => {
//   const db = getFirestore();
//   const commDocRef = secureCollection<PrivilegedPolicyData>(db).doc(commDocId);
//   return getDocData<PrivilegedPolicyData>(commDocRef);
// };

// // don't create new on failure if policy already bound (only submission / quote stages)
// export const getCommData = async (
//   commDocId: string | undefined,
//   options: { orgId?: string; agentId?: string; product: Product },
//   createNewOnFailure?: boolean
// ) => {
//   if (!commDocId) return createNewCommDoc(options);

//   try {
//     const commDocData = await getCommDocData(commDocId);

//     return commDocData;
//   } catch (err: any) {
//     warn(`failed to retrieve provided commission doc... creating new one...`);
//     if (createNewOnFailure) return createNewCommDoc(options);
//     throw err;
//   }
// };
