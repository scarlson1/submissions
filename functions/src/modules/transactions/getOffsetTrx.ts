import { Policy, WithId } from '@idemand/common';
import { add } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { CancellationReason, OffsetTransaction, PremiumTransaction } from '../../common/index.js';
import { getTrxTaxesAndFees } from '../taxes/index.js';
import { getBookingDate, getMGAComm, getNetDWP, getOffsetTermPremium } from './utils.js';

// TODO: cancelReason - some subject to minEarnedPremium

/**
 * get formatted offset transaction for cancellation or premium endorsement transactions
 * @param {Policy} policy policy document
 * @param {PremiumTransaction} prevTrx most recent premium transaction for location
 * @param {Timestamp} trxEffDate new transaction effective date
 * @param {string} eventId cloud event id
 * @param {string} trxType transaction type
 * @param {string | null} cancelReason cancel reason, if cancellation transaction
 * @returns {OffsetTransaction} offsetting transaction for cancellation or premium endorsement transactions
 */
export const getOffsetTrx = (
  policy: Policy,
  prevTrx: WithId<PremiumTransaction | OffsetTransaction>,
  trxEffDate: Timestamp,
  eventId: string,
  trxType: OffsetTransaction['trxType'],
  cancelReason: CancellationReason | null = null
): OffsetTransaction => {
  const bookingDate = getBookingDate(trxEffDate.toMillis(), policy.effectiveDate.toMillis());

  const trxExpDate = add(trxEffDate.toDate(), { days: 1 });
  const trxDays = 1;

  const termPremium = getOffsetTermPremium(prevTrx, trxEffDate); // negative
  const MGACommission = getMGAComm(termPremium, prevTrx); // negative
  const netDWP = getNetDWP(termPremium, MGACommission); // negative

  const dailyPremium = termPremium / trxDays;

  // TODO: check offset calculations (negative, prorata, non-refundable)
  // create new function getTrxOffsetTaxesAndFees (derive from refund calc ??) batch refund & trx
  const { surplusLinesTax, surplusLinesRegulatoryFee, MGAFee, inspectionFee } =
    getTrxTaxesAndFees(policy);

  // TODO: calc taxItems and feeItems (needed for refund record) or separate fn ??

  // need to add billing entity totals ??

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
    agent: prevTrx.agent || {}, // TODO: fix agent not being set on CSV imported transactions
    agency: prevTrx.agency || {},
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
