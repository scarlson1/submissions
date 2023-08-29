import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { StorageEvent } from 'firebase-functions/v2/storage';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

import {
  COLLECTIONS,
  DeepNullable,
  Transaction,
  audience,
  getReportErrorFn,
  hostingBaseURL,
  sendgridApiKey,
  transactionsCollection,
  unlinkFile,
} from '../common';
import {
  ParseStreamToArrayRes,
  eventOlderThan,
  parseStreamToArray,
  shouldReturnEarly,
  transformHeadersCamelCase,
} from '../modules/storage';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';
import { TrxRow } from './models';
import { transformTrxRow } from './transform';

const reportErr = getReportErrorFn('importTransactions ');

function validateTrxRow(row: DeepNullable<Transaction>): boolean {
  // first validation should be transaction type
  //
  return true;
}

// TODO: make enum for folder names ??
const TRX_IMPORT_FOLDER = 'importTransactions';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name;
  const filename = basename(filePath || '');

  if (shouldReturnEarly(event, TRX_IMPORT_FOLDER, 'text/csv', 'processed')) return;

  if (eventOlderThan(event)) return; // return if event older than 1 min

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = join(tmpdir(), `temp_trx_import_${filename}`);

  await bucket.file(filePath).download({ destination: tempFilePath });

  let dataArr: ParseStreamToArrayRes<Omit<Transaction, 'metadata'>>['dataArr'] = [];
  let invalidRows: ParseStreamToArrayRes<Omit<Transaction, 'metadata'>>['invalidRows'] = [];

  const stream = createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<TrxRow, Omit<Transaction, 'metadata'>>(
      stream,
      { headers: transformHeadersCamelCase },
      transformTrxRow,
      validateTrxRow
    );

    dataArr = [...parsed.dataArr];
    invalidRows = [...parsed.invalidRows];

    info(`${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`, {
      invalidRows,
      dataArr,
    });
  } catch (err: any) {
    let msg = `Error parsing transactions from csv: ${filename}`;
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { filename }, err);

    await unlinkFile(tempFilePath);
    return;
  }

  const trxIds = [];
  const importErrors = [];

  for (const t of dataArr) {
    try {
      const data = {
        ...t,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      } as Transaction;
      const trxRef = await trxCol.add(data);

      trxIds.push(trxRef.id);
    } catch (err: any) {
      error('Error saving transaction doc', { err: err || null });
      importErrors.push(t);
    }
  }

  info(`Imported ${trxIds.length} transactions with ${importErrors.length} failures`, {
    trxIds,
    importErrors,
  });

  let summaryRef;
  try {
    const importSummaryColRef = db.collection(COLLECTIONS.DATA_IMPORTS);
    summaryRef = await importSummaryColRef.add({
      importCollection: COLLECTIONS.TRANSACTIONS,
      importDocIds: trxIds,
      docCreationErrors: importErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`Saved import summary to doc ${summaryRef.id}`);
  } catch (err: any) {
    reportErr(`Error saving import summary`, { filename }, err);
  }

  try {
    const to = ['spencer.carlson@idemandinsurance.com'];
    let link;

    if (audience.value() !== 'LOCAL HUMANS') {
      to.push('ron.carlson@idemandinsurance.com');
      link = `${hostingBaseURL.value}/admin/config/imports`;
    }

    await sendAdminPolicyImportNotification(
      sendgridApiKey.value(),
      to,
      trxIds.length,
      importErrors.length,
      invalidRows.length,
      filename,
      link,
      undefined,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'trx_import',
        },
      }
    );
  } catch (err: any) {
    reportErr('Error sending transaction import summary admin notification', {}, err);
  }

  return;
};
