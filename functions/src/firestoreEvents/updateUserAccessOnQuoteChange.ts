import { AgencyDetails, AgentDetails, Quote } from '@idemand/common';
import { Change, DocumentSnapshot, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { isEqual } from 'lodash-es';
import { getReportErrorFn } from '../common';
import { updateUserAccessDoc } from './updateUserAccessOnPolicyChange';

const reportErr = getReportErrorFn('updateUserAccessOnQuoteChange');

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      quoteId: string;
    }
  >
) => {
  const newData = event?.data?.after.data() as Quote | undefined;
  const prevData = event?.data?.before.data() as Quote | undefined;

  const insuredId = newData?.namedInsured?.userId;

  const prevAgent = prevData?.agent;
  let agent = newData?.agent;

  const prevOrg = prevData?.agency;
  let org = prevData?.agency;

  if (!org?.orgId || !agent?.userId || !insuredId) return;

  agent = {
    email: agent.email || '',
    phone: agent.phone || '',
    name: agent.name || '',
    userId: agent.userId,
  };
  org = {
    orgId: org.orgId,
    name: org?.name,
    address: {
      addressLine1: org.address?.addressLine1 || '',
      addressLine2: org.address?.addressLine2 || '',
      city: org.address?.city || '',
      state: org.address?.state || '',
      postal: org.address?.postal || '',
    },
  };

  if (!(isEqual(prevAgent, agent) && isEqual(prevOrg, org))) {
    try {
      await updateUserAccessDoc(insuredId, agent as AgentDetails, org as AgencyDetails);
    } catch (err: any) {
      reportErr('error updating user access permissions doc', event.data, err);
    }
  }

  return;
};
