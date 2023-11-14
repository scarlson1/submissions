import { Timestamp } from 'firebase-admin/firestore';

import { ILocationPolicy, Policy, WithId } from '@idemand/common';
import { AmendmentTransaction } from '../../common/index.js';
import { getBookingDate, getTermDays } from './utils.js';

export const getLocationAmendmentTrx = (
  policy: WithId<Policy>,
  location: ILocationPolicy,
  trxEffDate: Timestamp,
  eventId: string
): AmendmentTransaction => {
  // TODO: share logic with other trx types
  // const currentDateMS = new Date().getTime();
  // const locationEffDate = location.effectiveDate.toMillis();
  // const trxEffDateMS = currentDateMS < locationEffDate ? locationEffDate : currentDateMS;

  // const trxEffDate = Timestamp.fromMillis(trxEffDateMS);

  const bookingDate = getBookingDate(trxEffDate.toMillis(), location.effectiveDate.toMillis());

  const trxDays = getTermDays(trxEffDate.toDate(), location.expirationDate.toDate());

  return {
    trxType: 'amendment',
    trxInterfaceType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: location.locationId,
    externalId: location.externalId || null,
    term: policy.term,
    bookingDate,
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    insuredLocation: location,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate,
    trxExpDate: location.expirationDate,
    trxDays,
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
