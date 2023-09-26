import { add } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

import {
  CancellationReason,
  OffsetTransaction,
  PolicyNew,
  PremiumTransaction,
  WithId,
} from '../../common/index.js';
import { getTrxTaxesAndFees } from './taxes.js';
import { getBookingDate, getMGAComm, getNetDWP, getOffsetTermPremium } from './utils.js';

/**
 * get formatted offset transaction for cancellation or premium endorsement transactions
 * @param {PolicyNew} policy policy document
 * @param {PremiumTransaction} prevTrx most recent premium transaction for location
 * @param {Timestamp} trxEffDate new transaction effective date
 * @param {string} eventId cloud event id
 * @param {string} trxType transaction type
 * @param {string | null} cancelReason cancel reason, if cancellation transaction
 * @returns {OffsetTransaction} offsetting transaction for cancellation or premium endorsement transactions
 */
export const getOffsetTrx = (
  policy: PolicyNew,
  prevTrx: WithId<PremiumTransaction | OffsetTransaction>,
  trxEffDate: Timestamp,
  eventId: string,
  trxType: OffsetTransaction['trxType'],
  cancelReason: CancellationReason | null = null
): OffsetTransaction => {
  const bookingDate = getBookingDate(trxEffDate.toMillis(), policy.effectiveDate.toMillis());

  const trxExpDate = add(trxEffDate.toDate(), { days: 1 });
  const trxDays = 1;

  // term premium is negative in offset trx (premium uncollected b/c after change/cancel date)
  const termPremium = getOffsetTermPremium(prevTrx, trxEffDate); // negative
  const MGACommission = getMGAComm(termPremium, prevTrx); // negative
  const netDWP = getNetDWP(termPremium, MGACommission); // negative

  const dailyPremium = termPremium / trxDays;

  const { surplusLinesTax, surplusLinesRegulatoryFee, MGAFee, inspectionFee } =
    getTrxTaxesAndFees(policy);

  return {
    trxType,
    trxInterfaceType: 'offset',
    product: prevTrx.product,
    term: prevTrx.term,
    policyId: prevTrx.policyId,
    policyEffDate: prevTrx.policyEffDate,
    policyExpDate: prevTrx.policyExpDate,
    issuingCarrier: prevTrx.issuingCarrier,
    namedInsured: prevTrx.namedInsured,
    mailingAddress: prevTrx.mailingAddress,
    homeState: prevTrx.homeState || '',
    locationId: prevTrx.locationId,
    externalId: prevTrx.externalId,
    insuredLocation: prevTrx.insuredLocation,
    trxEffDate,
    trxExpDate: Timestamp.fromDate(trxExpDate),
    trxDays,
    bookingDate,
    termPremium,
    MGACommission,
    MGACommissionPct: prevTrx.MGACommissionPct,
    netDWP,
    dailyPremium,
    surplusLinesTax,
    surplusLinesRegulatoryFee,
    MGAFee,
    inspectionFee,
    cancelReason,
    eventId,
    previousPremiumTrxId: prevTrx.id,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
