import { versionsCollection } from '@idemand/common';
import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';
import {
  AmendmentTransaction,
  OffsetTransaction,
  PremiumTransaction,
  Transaction,
  getReportErrorFn,
} from '../../common/index.js';
import { getDifference } from '../../utils/getDifference.js';
import { hasOne } from '../../utils/helpers.js';

type TrxKeys = keyof PremiumTransaction | keyof OffsetTransaction | keyof AmendmentTransaction;
const VERSION_TRX_DIFF_KEYS: TrxKeys[] = [
  // @ts-ignore
  'agency', // @ts-ignore
  'agent',
  'locationId',
  'term',
  'bookingDate',
  'issuingCarrier',
  'namedInsured',
  'mailingAddress',
  'homeState',
  'policyEffDate',
  'policyExpDate',
  'trxEffDate',
  'trxExpDate',
  'trxDays',
  'insuredLocation',
  'termPremium',
  'MGACommission',
  'MGACommissionPct',
  'netDWP',
  'netErrorAdj',
  'surplusLinesTax',
  'surplusLinesRegulatoryFee',
  'MGAFee',
  'inspectionFee',
  'cancelReason',
  'ratingPropertyData',
  'deductible',
  'limits',
  'TIV',
  'RCVs',
  'premiumCalcData',
  'locationAnnualPremium',
  'otherInterestedParties',
  'additionalNamedInsured',
  'billingEntityId',
  'billingEntity',
  'billingEntityTotals',
  'trxType',
];

const reportErr = getReportErrorFn('versionTransaction');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { trxId: string }>
) => {
  try {
    const { trxId } = event.params;

    const beforeData = event?.data?.before?.data() as Transaction | undefined;
    const afterData = event?.data?.after?.data() as Transaction | undefined;

    const diff = getDifference(beforeData || {}, afterData || {});
    const shouldVersion = Boolean(beforeData) && hasOne(VERSION_TRX_DIFF_KEYS, Object.keys(diff));

    info('Location version diff', { diff, shouldVersion });

    const currentVersion = afterData?.metadata?.version;
    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Transaction change detected (ID: ${trxId})`, {
      trxId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection<Transaction>(db, 'transactions', trxId);

    const batch = db.batch();

    batch.set(
      event!.data!.after.ref,
      {
        metadata: {
          version: FieldValue.increment(1),
        },
      },
      { merge: true }
    );

    if (shouldVersion && beforeData) {
      info(`creating new version for transaction ${trxId}...`);
      const versionDocId = beforeData.metadata?.version || 0;
      const versionRef = versionsCol.doc(`${versionDocId}`);

      const versionData = merge(beforeData, {
        metadata: { versionCreated: Timestamp.now() },
      });
      batch.set(versionRef, versionData);
    }

    await batch.commit();
  } catch (err: any) {
    let msg = 'Error creating transaction version';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }

  return;
};
