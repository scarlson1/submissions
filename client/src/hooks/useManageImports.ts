import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore, useFunctions } from 'reactfire';

import { approveImport } from 'api';
import {
  DeepPartial,
  importSummaryCollection,
  stagedImportsCollection,
  StageImportRecord,
} from 'common';
import { useClaims } from './useClaims';

export const useManageImports = (
  importId: string,
  onSuccess?: (msg: string) => void,
  onError?: (msg: string, err: any) => void,
) => {
  const firestore = useFirestore();
  const functions = useFunctions();
  // const { user, claims } = useAuth();
  const { user, claims } = useClaims();
  const [loading, setLoading] = useState({
    decline: false,
    approve: false,
  });

  const handleApproveImport = useCallback(
    async (records: string[] | null = null) => {
      try {
        if (!claims?.iDemandAdmin) throw new Error('missing required claims');
        setLoading((prev) => ({ ...prev, approve: true }));

        const { data } = await approveImport(functions, {
          importId,
          records,
          approvedByName: user?.displayName || null,
        });

        setLoading((prev) => ({ ...prev, approve: false }));
        onSuccess && onSuccess(`imported ${data.successCount} record(s)`);
      } catch (err: any) {
        console.log('Error: ', err);
        setLoading((prev) => ({ ...prev, approve: false }));
        let errMsg = `Import failed`;
        if (err?.message) errMsg += ` (${err.message})`;
        onError && onError(errMsg, err);
      }
    },
    [functions, user, claims, importId, onSuccess, onError],
  );

  const stagedDocsCol = stagedImportsCollection(firestore, importId);

  const setDeclined = useCallback(
    (docId: string) => {
      const updates: DeepPartial<StageImportRecord> = {
        importMeta: {
          status: 'declined',
          reviewBy: {
            userId: user?.uid || '',
            name: user?.displayName || null,
          },
        },
        metadata: {
          updated: Timestamp.now(),
        },
      };

      return setDoc(doc(stagedDocsCol, docId), updates, { merge: true });
    },
    [stagedDocsCol, user],
  );

  const handleDeclineImport = useCallback(
    async (records: string[] | null = null) => {
      try {
        if (!claims?.iDemandAdmin) throw new Error('missing required claims');
        setLoading((prev) => ({ ...prev, decline: true }));

        let declineIds = records || [];
        if (!records) {
          // get doc ids from import summary
          const importSummaryCol = importSummaryCollection(firestore);
          const summarySnap = await getDoc(doc(importSummaryCol, importId));
          declineIds = summarySnap.data()?.importDocIds || [];
        }

        if (!declineIds || !declineIds.length)
          throw new Error(`missing doc IDs`);
        if (declineIds.length > 100) throw new Error('max of 100 at a time');

        // TODO: split into array of n --> promise all
        const errIds: string[] = [];
        const promises: Promise<void>[] = [];
        for (const id of declineIds) {
          promises.push(
            setDeclined(id).catch((err) => {
              console.error(`Error updating status to declined (${id})`, err);
              errIds.push(id);
            }),
          );
        }
        await Promise.all(promises);

        setLoading((prev) => ({ ...prev, decline: false }));

        if (errIds.length) {
          onError && onError(`Failed to update ${errIds.length} doc(s)`, null);
          if (errIds.length === declineIds.length) return;
        }

        let successMsg = `update complete`;
        if (errIds.length) successMsg += ` (${errIds.length} errors)`;
        onSuccess && onSuccess(successMsg);
      } catch (err: any) {
        console.error('Error: ', err);
        setLoading((prev) => ({ ...prev, decline: false }));

        let errMsg = `Error updating record`;
        if (err?.message) errMsg += ` (${err.message})`;
        onError && onError(errMsg, err);
      }
    },
    [firestore, claims, importId, onSuccess, onError, setDeclined],
  );

  return useMemo(
    () => ({ handleApproveImport, handleDeclineImport, loading }),
    [handleApproveImport, handleDeclineImport, loading],
  );
};
