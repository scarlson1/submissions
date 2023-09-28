import { Timestamp } from 'firebase-admin/firestore';

import { AmendmentTransaction, PolicyNew, WithId } from '../../common/index.js';
import { getBookingDate, getTermDays } from './utils.js';

export const getPolicyAmendmentTrx = (
  policy: WithId<PolicyNew>,
  trxEffDate: Timestamp,
  eventId: string
): AmendmentTransaction => {
  const bookingDate = getBookingDate(trxEffDate.toMillis(), policy.effectiveDate.toMillis());

  const trxDays = getTermDays(bookingDate.toDate(), policy.expirationDate.toDate());

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
