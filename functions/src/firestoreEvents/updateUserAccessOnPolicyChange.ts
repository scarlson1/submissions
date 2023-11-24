import { AgencyDetails, AgentDetails, Policy, getUserAccessRef } from '@idemand/common';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, DocumentSnapshot, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { isEqual } from 'lodash-es';
import { getReportErrorFn } from '../common/index.js';

const reportErr = getReportErrorFn('updateUserAccessOnPolicyChange');

// relationship structure alternative - subcollection: https://stackoverflow.com/a/46839558

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      policyId: string;
    }
  >
) => {
  const newData = event?.data?.after.data() as Policy | undefined;
  const prevData = event?.data?.before.data() as Policy | undefined;

  const insuredId = newData?.namedInsured?.userId;

  const prevAgent = prevData?.agent;
  const newAgent = newData?.agent;

  const prevOrg = prevData?.agency;
  const newOrg = prevData?.agency;

  if (!newOrg?.orgId || !newAgent?.userId || !insuredId) return;

  // try {
  //   info(`updating user access doc ${insuredId}`);
  //   await updateUserAccessDoc(insuredId, newAgent, newOrg);
  // } catch (err: any) {
  //   reportErr('error updating user access permissions doc', event.data, err);
  // }

  if (!(isEqual(prevAgent, newAgent) && isEqual(prevOrg, newOrg))) {
    try {
      info(`updating user access doc ${insuredId}`);
      await updateUserAccessDoc(insuredId, newAgent, newOrg);
    } catch (err: any) {
      reportErr('error updating user access permissions doc', event.data, err);
    }
  }

  return;
};

export async function updateUserAccessDoc(userId: string, agent: AgentDetails, org: AgencyDetails) {
  const userAccessRef = getUserAccessRef(getFirestore(), userId);
  const userAccessSnap = await userAccessRef.get();
  if (!userAccessSnap.exists) {
    await userAccessRef.set({
      userId,
      agentIds: [],
      orgIds: [],
      agents: {},
      orgs: {},
      // agentDetails: {},
      // orgDetails: {},
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });
  }

  const otherUpdates: Record<string, any> = {};
  otherUpdates[`agents.${agent.userId}`] = agent;
  otherUpdates[`orgs.${org.orgId}`] = org;

  await userAccessRef.update({
    ...otherUpdates,
    orgIds: FieldValue.arrayUnion(org.orgId),
    agentIds: FieldValue.arrayUnion(agent.userId),
    'metadata.updated': Timestamp.now(),
  });
}
