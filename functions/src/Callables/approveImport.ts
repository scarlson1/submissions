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
}

const approveChangeRequest = async ({ data, auth }: CallableRequest<ApproveImportProps>) => {
  info(`Approve import called`, { ...data });

  requireIDemandAdminClaims(auth?.token);

  const { importId } = data;
  validate(importId, 'failed-precondition', 'importId required');

  const db = getFirestore();

  // TODO: import summary collection type
  const importSummaryRef = importSummaryCollection(db).doc(importId);
  const importSummarySnap = await importSummaryRef.get();
  const importSummary = importSummarySnap.data();

  validate(
    importSummarySnap.exists && importSummary,
    'not-found',
    `import summary not found (${importId})`
  );
  const { importDocIds } = importSummary;
  validate(
    importDocIds && importDocIds.length,
    'failed-precondition',
    'import summary missing staged document IDs'
  );
  // TODO: remove after breaking into batches
  validate(importDocIds.length < 500, 'failed-precondition', 'import must be < 500 items');

  // const successIds = [];
  // const errorIds = [];

  try {
    // TODO: break into batches of 100
    // promise all to get sub collection docs
    const stagedImportsCol = stagedImportsCollection(db, importId);
    const reads = importDocIds.map((id) => stagedImportsCol.doc(id).get());
    const stagedSnaps = await Promise.all(reads);

    const stagedDocs = stagedSnaps.map((s) => ({
      ...s.data(),
      id: s.id,
    })) as WithId<StageImportRecord>[]; // TODO: handle promise all errors

    const targetCollectionRef = db.collection(`${importSummary.importCollection}`);
    const batch = db.batch();

    for (const doc of stagedDocs) {
      let { id, importMeta, ...data } = doc;

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
          importMeta: {
            reviewBy: {
              userId: auth.uid,
              name: null,
            },
            status: 'imported',
          },
        },
        { merge: true }
      );
    }

    info(`saving batch document import to ${importSummary.importCollection}...`);
    await batch.commit();
    info`created ${stagedDocs.length} documents in ${importSummary.importCollection}`;

    return {
      successCount: stagedDocs.length,
      // successCount: successIds.length,
      // errorCount: errorIds.length,
    };
  } catch (err: any) {
    let errMsg = `Error importing documents`;
    if (err?.message) errMsg += err.message;
    reportErr(errMsg, {}, err);

    throw new HttpsError('internal', `import failed`);
  }
};

export default onCallWrapper<ApproveImportProps>('approveimportrequest', approveChangeRequest);
