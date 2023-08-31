import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { StorageEvent } from 'firebase-functions/v2/storage';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

import {
  COLLECTIONS,
  Quote,
  StagedQuoteImport,
  audience,
  getCardFee,
  hostingBaseURL,
  importSummaryCollection,
  sendgridApiKey,
  stagedImportsCollection,
  unlinkFile,
} from '../common';
import { fetchTaxes } from '../modules/db';
import { sumFeesTaxesPremium } from '../modules/rating';
import { eventOlderThan, shouldReturnEarly } from '../modules/storage';
import {
  ParseStreamToArrayRes,
  parseStreamToArray,
  transformHeadersCamelCase,
} from '../modules/storage/parseStreamToArray';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';
import { transformQuoteRow } from './transform';
import { validateQuoteRow } from './validation';

const QUOTE_IMPORT_FOLDER = 'importQuotes';

export interface CSVQuoteRow {
  product: string;
  deductible: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  latitude: string;
  longitude: string;
  countyName?: string;
  fips?: string;
  homeState: string;
  annualPremium: string;
  subproducerCommission: string;
  quoteTotal: string;
  effectiveDate?: string;
  quoteExpirationDate?: string;
  quotePublishDate?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mailingAddressName: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostal: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  agentId: string;
  agencyName: string;
  orgId: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyPostal: string;
  cbrsDesignation: string;
  basement: string;
  distToCoastFeet: string;
  floodZone: string;
  numStories: string;
  propertyCode: string;
  replacementCost: string;
  sqFootage: string;
  yearBuilt: string;
  ffh: string;
  priorLossCount: string;
  ratingDocId?: string;
  locationId?: string;
  submissionId?: string;
  fee1Name?: string;
  fee1Value?: string;
  fee2Name?: string;
  fee2Value?: string;
}

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = basename(filePath || '');

  if (shouldReturnEarly(event, QUOTE_IMPORT_FOLDER, 'text/csv', 'processed')) return;
  if (eventOlderThan(event)) return; // return if event older than 1 min

  const db = getFirestore();
  // const quoteColRef = quotesCollection(db);
  const importSummaryRef = importSummaryCollection(db).doc(event.id);
  const importStagingCol = stagedImportsCollection(db, importSummaryRef.id);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = join(tmpdir(), `temp_portfolio_import_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArr: ParseStreamToArrayRes<Quote>['dataArr'] = [];
  let invalidRows: ParseStreamToArrayRes<Quote>['invalidRows'] = [];

  const stream = createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<CSVQuoteRow, Quote>(
      stream,
      { headers: transformHeadersCamelCase },
      transformQuoteRow,
      validateQuoteRow
    );

    dataArr = [...parsed.dataArr];
    invalidRows = [...parsed.invalidRows];

    info(`${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`, {
      invalidRows,
      dataArr,
    });
    if (!dataArr.length) throw new Error('No valid rows');

    await unlinkFile(tempFilePath);
  } catch (err: any) {
    error(`ERROR PARSING CSV. RETURNING EARLY`, { err });

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  const quoteIds = [];
  const importErrors = [];

  for (const q of dataArr) {
    try {
      // TODO: force homeState instead of address.state
      const taxes = await fetchTaxes(q, 'new');

      const quoteTotal = sumFeesTaxesPremium(q.fees, taxes, q.annualPremium);

      const cardFee = getCardFee(quoteTotal);

      const quote: Quote = {
        ...q,
        taxes,
        quoteTotal,
        cardFee,
      };
      info(`Saving new quote`, quote);

      // const quoteRef = await quoteColRef.add(quote);

      const data: StagedQuoteImport = {
        ...quote,
        importMeta: {
          status: 'new',
          eventId: event.id,
          targetCollection: COLLECTIONS.QUOTES,
        },
      };
      const quoteRef = await importStagingCol.add(data);

      quoteIds.push(quoteRef.id);
    } catch (err: any) {
      error('Error saving quote', { err });
      importErrors.push(q);
    }
  }
  info(`Imported ${quoteIds.length} quotes with ${importErrors.length} failures`, {
    quoteIds,
    importErrors,
  });

  try {
    await importSummaryRef.set({
      importCollection: COLLECTIONS.POLICIES,
      importDocIds: quoteIds,
      docCreationErrors: importErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`SAVED IMPORT SUMMARY TO DOC ${importSummaryRef.id}`);

    const to = ['spencer.carlson@idemandinsurance.com'];
    let link;

    if (audience.value() !== 'LOCAL HUMANS') {
      to.push('ron.carlson@idemandinsurance.com');
      link = `${hostingBaseURL.value}/admin/config/imports`;
    }

    await sendAdminPolicyImportNotification(
      sendgridApiKey.value(),
      to,
      quoteIds.length,
      importErrors.length,
      invalidRows.length,
      fileName,
      link,
      undefined,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'quote_import',
        },
      }
    );
  } catch (err: any) {
    error('Error saving import summary doc or delivering email notification', { err });
  }

  return;
};
