import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { StorageEvent } from 'firebase-functions/v2/storage';

import { Collection, Quote } from '@idemand/common';
import {
  getCardFee,
  hostingBaseURL,
  importSummaryCollection,
  resendKey,
  stagedImportsCollection,
  StagedQuoteImport,
} from '../common/index.js';
import { createRatingDoc, fetchTaxes } from '../modules/db/index.js';
import { getRCVs, sumFeesTaxesPremium } from '../modules/rating/index.js';
import { eventOlderThan, shouldReturnEarly } from '../modules/storage/index.js';
import {
  parseStreamToArray,
  ParseStreamToArrayRes,
  transformHeadersCamelCase,
} from '../modules/storage/parseStreamToArray.js';
import { sendAdminPolicyImportNotification } from '../services/sendgrid/index.js';
import { randomFileName, unlinkFile } from '../utils/index.js';
import { CSVQuoteRow, CSVTransformedQuote } from './models/index.js';
import { transformQuoteRow } from './transform/index.js';
import { validateQuoteRow } from './validation/index.js';

const QUOTE_IMPORT_FOLDER = 'importQuotes';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = basename(filePath || '');

  if (shouldReturnEarly(event, QUOTE_IMPORT_FOLDER, 'text/csv', 'processed'))
    return;
  if (eventOlderThan(event)) return; // return if event older than 1 min

  const db = getFirestore();
  // const quoteColRef = quotesCollection(db);
  const importSummaryRef = importSummaryCollection(db).doc(event.id);
  const importStagingCol = stagedImportsCollection(db, importSummaryRef.id);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = join(tmpdir(), randomFileName(filePath));

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArr: ParseStreamToArrayRes<CSVTransformedQuote>['dataArr'] = [];
  let invalidRows: ParseStreamToArrayRes<CSVTransformedQuote>['invalidRows'] =
    [];

  const stream = createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<CSVQuoteRow, CSVTransformedQuote>(
      stream,
      { headers: transformHeadersCamelCase },
      transformQuoteRow,
      validateQuoteRow,
    );

    dataArr = [...parsed.dataArr];
    invalidRows = [...parsed.invalidRows];

    info(
      `${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`,
      {
        invalidRows,
        dataArr,
      },
    );
    if (!dataArr.length) throw new Error('No valid rows');

    await unlinkFile(tempFilePath);
  } catch (err: unknown) {
    error('ERROR PARSING CSV. RETURNING EARLY', { err });

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  const quoteIds = [];
  const importErrors = [];

  for (const q of dataArr) {
    try {
      // TODO: create rating doc (and reusable function between quotes and policies)
      const { premCalcData, AALs, ...quoteValues } = q;
      const ratingData = {
        submissionId: q.submissionId || null,
        locationId: null, // TODO: locationId for quotes (once multi-location)
        limits: q.limits,
        TIV: Object.values(q.limits).reduce((acc, curr) => acc + curr, 0), // TODO: move to quote interface & validate
        deductible: q.deductible,
        RCVs: getRCVs(
          q.ratingPropertyData?.replacementCost as number,
          q.limits,
        ),
        ratingPropertyData: q.ratingPropertyData,
        premiumCalcData: premCalcData,
        AALs,
        coordinates: q.coordinates,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };
      const ratingDocRef = await createRatingDoc(db, ratingData);

      const taxes = await fetchTaxes(q, 'new');

      const quoteTotal = sumFeesTaxesPremium(q.fees, taxes, q.annualPremium);

      const cardFee = getCardFee(quoteTotal);

      const quote: Quote = {
        ...quoteValues,
        ratingDocId: ratingDocRef.id,
        taxes,
        quoteTotal,
        cardFee,
      };
      info('Saving new quote', quote);

      // const quoteRef = await quoteColRef.add(quote);

      const data: StagedQuoteImport = {
        ...quote,
        importMeta: {
          status: 'new',
          eventId: event.id,
          targetCollection: Collection.enum.quotes,
        },
      };
      const quoteRef = await importStagingCol.add(data);

      quoteIds.push(quoteRef.id);
    } catch (err: unknown) {
      error('Error saving quote', { err });
      importErrors.push(q);
    }
  }
  info(
    `Imported ${quoteIds.length} quotes with ${importErrors.length} failures`,
    {
      quoteIds,
      importErrors,
    },
  );

  try {
    await importSummaryRef.set({
      targetCollection: Collection.enum.quotes,
      importDocIds: quoteIds,
      docCreationErrors: importErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`SAVED IMPORT SUMMARY TO DOC ${importSummaryRef.id}`);

    const to = ['spencer@s-carlson.com'];

    // if (audience.value() !== 'LOCAL HUMANS') {
    // to.push('noreply@s-carlson.com');
    const link = `${hostingBaseURL.value()}/admin/config/imports`;
    // }

    await sendAdminPolicyImportNotification(
      resendKey.value(),
      to,
      quoteIds.length,
      importErrors.length,
      invalidRows.length,
      fileName,
      link,
      undefined,
      // {
      //   customArgs: {
      //     firebaseEventId: event.id,
      //     emailType: 'quote_import',
      //   },
      // },
    );
  } catch (err: unknown) {
    error('Error saving import summary doc or delivering email notification', {
      err,
    });
  }

  return;
};
