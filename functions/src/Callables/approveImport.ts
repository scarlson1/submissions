import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

import {
  StageImportRecord,
  WithId,
  getReportErrorFn,
  importSummaryCollection,
  stagedImportsCollection,
} from '../common';
import { onCallWrapper } from '../services/sentry';
import { requireIDemandAdminClaims, validate } from './utils';

const reportErr = getReportErrorFn('approveImport');

interface ApproveImportProps {
  importId: string;
  records: string[] | null; // if only specific records (null --> import all)
  approvedByName?: string;
}

const approveImport = async ({ data, auth }: CallableRequest<ApproveImportProps>) => {
  info(`Approve import called`, { ...data });

  requireIDemandAdminClaims(auth?.token);

  const { importId, records, approvedByName } = data;
  validate(importId, 'failed-precondition', 'importId required');
  validate(
    records === null || Array.isArray(records),
    'failed-precondition',
    'records must be null (import all) or an array of docIds'
  );

  let importDocIds = records;

  const db = getFirestore();

  const importSummaryRef = importSummaryCollection(db).doc(importId);
  const importSummarySnap = await importSummaryRef.get();
  const importSummary = importSummarySnap.data();

  validate(
    importSummarySnap.exists && importSummary,
    'not-found',
    `import summary not found (${importId})`
  );
  // const { importDocIds } = importSummary;
  if (!records) importDocIds = importSummary.importDocIds;

  validate(
    importDocIds && importDocIds.length,
    'failed-precondition',
    'import summary missing staged document IDs'
  );
  // TODO: remove after breaking into batches
  validate(importDocIds.length < 500, 'failed-precondition', 'import must be < 500 items');

  const successIds = [];
  const errorIds = [];

  try {
    // TODO: break into batches of 100
    // let chunks: TRow[][] = data.length > chunkCountVal ? splitChunks(data, chunkCountVal) : [data];
    // promise all to get sub collection docs
    const stagedImportsCol = stagedImportsCollection(db, importId);
    const reads = importDocIds.map((id) => stagedImportsCol.doc(id).get());
    const stagedSnaps = await Promise.all(reads);

    const stagedDocs = stagedSnaps.map((s) => ({
      ...s.data(),
      id: s.id,
    })) as WithId<StageImportRecord>[]; // TODO: handle promise all errors or let the whole thing fail ??

    const targetCollectionRef = db.collection(`${importSummary.targetCollection}`);
    const batch = db.batch();

    for (const doc of stagedDocs) {
      let { id, importMeta, ...data } = doc;

      if (importMeta.status !== 'new') {
        errorIds.push(id);
      } else {
        successIds.push(id);

        const importRef = targetCollectionRef.doc(id);
        batch.set(importRef, {
          ...data,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        const stageDocRef = stagedImportsCol.doc(id);
        batch.set(
          stageDocRef,
          {
            // @ts-ignore
            importMeta: {
              reviewBy: {
                userId: auth.uid,
                name: approvedByName || null,
              },
              status: 'imported',
            },
          },
          { merge: true }
        );
      }
    }

    if (!successIds.length)
      throw new HttpsError('failed-precondition', 'no imports matched "new" status');

    info(`saving batch document import to ${importSummary.targetCollection}...`, { importId });
    await batch.commit();
    info`created ${stagedDocs.length} documents in ${importSummary.targetCollection}`;

    try {
      await importSummaryRef.update({
        status: 'approved',
      });
    } catch (err: any) {
      reportErr(
        `Successfully imported records, but failed to update import summary status`,
        {},
        err
      );
    }

    return {
      successCount: successIds.length,
      errorCount: errorIds.length,
    };
  } catch (err: any) {
    let errMsg = `Error importing documents`;
    if (err?.message) errMsg += err.message;
    reportErr(errMsg, {}, err);

    throw new HttpsError('internal', `import failed`);
  }
};

export default onCallWrapper<ApproveImportProps>('approveimportrequest', approveImport);
