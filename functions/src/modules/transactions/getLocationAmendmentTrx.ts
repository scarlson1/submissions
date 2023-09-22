import { Timestamp } from 'firebase-admin/firestore';

import {
  AmendmentTransaction,
  ILocation,
  PolicyNew,
  WithId,
  getTermDays,
} from '../../common/index.js';

export const getLocationAmendmentTrx = (
  policy: WithId<PolicyNew>,
  location: ILocation,
  eventId: string
): AmendmentTransaction => {
  // TODO: share logic with other trx types
  const currentDateMS = new Date().getTime();
  const locationEffDate = location.effectiveDate.toMillis();
  const trxEffDateMS = currentDateMS < locationEffDate ? locationEffDate : currentDateMS;

  const trxEffDate = Timestamp.fromMillis(trxEffDateMS);

  return {
    trxType: 'amendment',
    trxInterfaceType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: location.locationId,
    externalId: location.externalId || null,
    term: policy.term,
    bookingDate: Timestamp.now(),
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    insuredLocation: location,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate,
    trxExpDate: location.expirationDate,
    trxDays: getTermDays(trxEffDate.toDate(), location.expirationDate.toDate()),
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
