import { Timestamp } from 'firebase-admin/firestore';
import { round } from 'lodash';

import {
  ILocation,
  OffsetTransaction,
  PolicyNew,
  PremiumTransaction,
  WithId,
  getTermDays,
} from '../../common';
import { getBookingDate, getMGAComm } from './utils';

export const getReinstatementTrx = (
  policy: WithId<PolicyNew>,
  location: ILocation,
  prevTrx: OffsetTransaction,
  eventId: string
): PremiumTransaction => {
  const trxEffDate = prevTrx.trxEffDate;
  const trxExpDate = location.expirationDate; // TODO: verify correct date being used
  const trxDays = getTermDays(trxEffDate.toDate(), trxExpDate.toDate());

  const bookingDate = getBookingDate(location.effectiveDate.toMillis(), trxEffDate.toMillis());

  // TODO: decide whether to calculate or use the term premium from location ?? need to recalc in reinstatement handler before emitting policy.reinstated event
  const termPremium = round(trxDays * prevTrx.dailyPremium, 2);
  const MGACommission = getMGAComm(termPremium, prevTrx);

  return {
    trxType: 'reinstatement',
    product: policy.product,
    policyId: policy.id,
    locationId: location.locationId,
    externalId: location.externalId || null,
    term: policy.term,
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    insuredLocation: location,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    deductible: location.deductible,
    limits: location.limits,
    TIV: location.TIV,
    RCVs: location.RCVs,
    ratingPropertyData: {
      ...location.ratingPropertyData,
      units: 1,
      tier1: false,
      construction: '',
      priorLossCount: location.ratingPropertyData?.priorLossCount ?? null,
    }, // @ts-ignore
    premiumCalcData: null, // TODO: need to fetch from rating data doc.
    locationAnnualPremium: location.annualPremium,
    termPremium,
    MGACommission,
    trxEffDate,
    trxExpDate,
    trxDays,
    bookingDate: Timestamp.fromMillis(bookingDate),
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
