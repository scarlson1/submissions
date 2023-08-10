import { Timestamp } from 'firebase-admin/firestore';

import { AmendmentTransaction, Policy, WithId, getTermDays } from '../../common';

export const getPolicyAmendmentTrx = (
  policy: WithId<Policy>,
  eventId: string
): AmendmentTransaction => {
  return {
    trxType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: '',
    externalId: '',
    term: policy.term,
    bookingDate: Timestamp.now(),
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate: Timestamp.now(),
    trxExpDate: policy.expirationDate,
    trxDays: getTermDays(new Date(), policy.expirationDate.toDate()),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
