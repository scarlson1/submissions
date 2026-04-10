import { Policy, type WithId } from '@idemand/common';
import { Timestamp } from 'firebase-admin/firestore';
import { AmendmentTransaction } from '../../common/index.js';
import { getBookingDate, getTermDays } from './utils.js';

export const getPolicyAmendmentTrx = (
  policy: WithId<Policy>,
  trxEffDate: Timestamp,
  eventId: string,
): AmendmentTransaction => {
  const bookingDate = getBookingDate(
    trxEffDate.toMillis(),
    policy.effectiveDate.toMillis(),
  );

  const trxDays = getTermDays(
    bookingDate.toDate(),
    policy.expirationDate.toDate(),
  );

  return {
    trxType: 'amendment',
    trxInterfaceType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: '',
    externalId: '',
    term: policy.term,
    bookingDate,
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    agent: policy.agent,
    agency: policy.agency,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate,
    trxExpDate: policy.expirationDate,
    trxDays,
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
