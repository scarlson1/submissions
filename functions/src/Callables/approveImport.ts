import {
  CollectionGroup,
  DocumentReference,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import invariant from 'tiny-invariant';
import {
  COLLECTIONS,
  StageImportRecord,
  StagedPolicyImport,
  StagedTransactionImport,
  WithId,
  getReportErrorFn,
  importSummaryCollection,
  stagedImportsCollection,
  transactionsCollection,
} from '../common/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { verify } from '../utils/index.js';
import { requireIDemandAdminClaims, validate } from './utils/index.js';

const reportErr = getReportErrorFn('approveImport');

const isPolicyImports = (
  importDocs: WithId<StageImportRecord>[]
): importDocs is WithId<StagedPolicyImport>[] => {
  return (
    importDocs.length > 0 && importDocs[0].importMeta?.targetCollection === COLLECTIONS.POLICIES
  );
};

const hasLcnIdMap = (
  stagedDoc: Omit<StageImportRecord, 'importMeta'>
): stagedDoc is WithId<StagedPolicyImport> => {
  return stagedDoc.hasOwnProperty('lcnIdMap');
};

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
    // TODO: use getAll ??
    const reads = importDocIds.map((id) => stagedImportsCol.doc(id).get());
    const stagedSnaps = await Promise.all(reads);

    const stagedDocs = stagedSnaps.map((s) => ({
      ...s.data(),
      id: s.id,
    })) as WithId<StageImportRecord>[]; // TODO: handle promise all errors or let the whole thing fail ??

    const trxCol = transactionsCollection(db);
    let correspondingTrxImports: [
      DocumentReference<StagedTransactionImport>,
      StagedTransactionImport
    ][] = [];
    // if policy import, must check for staged or existing transaction
    // TODO: execute everything in a firestore transaction ??
    const isPolicyImport = isPolicyImports(stagedDocs);
    if (isPolicyImport) {
      const stagedCollectionGroup = db.collectionGroup(
        COLLECTIONS.STAGED_RECORDS
      ) as CollectionGroup<StageImportRecord>;

      try {
        for (let stagedPolicy of stagedDocs) {
          const { lcnIdMap, ...policy } = stagedPolicy;

          let locationIds = Object.keys(policy.locations || {});

          // check for existing or staged transaction
          for (let lcnId of locationIds) {
            const externalId = lcnIdMap[lcnId];
            invariant(externalId, `failed to map lcn ID to external ID`);

            const stagedTrxQuery = stagedCollectionGroup
              .where('importMeta.targetCollection', '==', COLLECTIONS.TRANSACTIONS)
              .where('externalId', '==', externalId)
              // .where('locationId', '==', lcnId) // Use external ID ?? (not available in policy)
              .where('importMeta.status', '==', 'new')
              .get();

            // TODO: check for at least one of type "new" ??
            // check for offset trx if cancelled location ??

            const existingTrxQuery = trxCol.where('locationId', '==', lcnId).get();

            const [stagedTrxQuerySnap, existingTrxQuerySnap] = await Promise.all([
              stagedTrxQuery,
              existingTrxQuery,
            ]);

            verify(
              !(stagedTrxQuerySnap.empty && existingTrxQuerySnap.empty),
              `could not find staged transaction or existing transaction for location ${lcnId}`
            );
            // TODO: get location doc and set rating doc ID on transaction ?? required for future offset trx calc ??

            // if staged, add to array to get imported with policy
            if (stagedTrxQuerySnap.docs.length) {
              stagedTrxQuerySnap.forEach((snap) => {
                correspondingTrxImports.push([
                  snap.ref as DocumentReference<StagedTransactionImport>,
                  { ...snap.data(), locationId: lcnId } as StagedTransactionImport,
                ]);
              });
            }
          }
        }
      } catch (err: any) {
        let msg = err?.message ?? 'error locating corresponding transaction for location import';
        throw new HttpsError('not-found', msg);
      }
    }

    const targetCollectionRef = db.collection(`${importSummary.targetCollection}`);
    const batch = db.batch();

    for (const doc of stagedDocs) {
      let { id, importMeta, ...stagedData } = doc;
      let data:
        | Omit<StageImportRecord, 'importMeta'>
        | Omit<StageImportRecord, 'importMeta' | 'lcnIdMap'> = stagedData;
      if (hasLcnIdMap(data)) {
        const { lcnIdMap, ...rest } = data;
        data = rest;
      }

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

    // TODO: do everything in a firestore transaction ??
    // import staged transaction for each location
    info(`Importing ${correspondingTrxImports.length} transactions that matched policy locations`);
    correspondingTrxImports.forEach(([trxImportRef, stagedTrx]) => {
      const { importMeta, ...trx } = stagedTrx;
      const trxRef = trxCol.doc(trxImportRef.id);
      batch.set(trxRef, {
        ...trx,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      });

      batch.set(
        trxImportRef,
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
    });

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
    if (err?.message) errMsg += ` - ${err.message}`;
    reportErr(errMsg, {}, err);
    if (err instanceof HttpsError) throw err;

    throw new HttpsError('internal', `import failed`);
  }
};

export default onCallWrapper<ApproveImportProps>('approveimport', approveImport);
