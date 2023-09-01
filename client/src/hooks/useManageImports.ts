import { useFirestore, useFunctions } from 'reactfire';
import { useCallback, useMemo, useState } from 'react';
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';

import { approveImport } from 'api';
import { useAuth } from 'context';
import {
  DeepPartial,
  StageImportRecord,
  importSummaryCollection,
  stagedImportsCollection,
} from 'common';

export const useManageImports = (
  importId: string,
  onSuccess?: (msg: string) => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  const functions = useFunctions();
  const { user, claims } = useAuth();
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
        onSuccess && onSuccess(`imported ${data.successCount} records`);
      } catch (err: any) {
        console.log('Error: ', err);
        setLoading((prev) => ({ ...prev, approve: false }));
        let errMsg = `Import failed`;
        if (err?.message) errMsg += ` (${err.message})`;
        onError && onError(errMsg, err);
      }
    },
    [functions, user, claims, importId, onSuccess, onError]
  );

  const stagedDocsCol = stagedImportsCollection(firestore, importId);

  const setDeclined = useCallback(
    async (docId: string) => {
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

      await setDoc(doc(stagedDocsCol, docId), updates, { merge: true });
    },
    [stagedDocsCol, user]
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

        if (!declineIds || !declineIds.length) throw new Error(`missing doc IDs`);

        // TODO: split into array of n --> promise all
        const errIds = [];
        for (const id of declineIds) {
          try {
            await setDeclined(id);
          } catch (err: any) {
            console.error(`Error updating status to declined (${id})`, err);
          }
        }

        setLoading((prev) => ({ ...prev, decline: false }));

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
    [firestore, claims, importId, onSuccess, onError, setDeclined]
  );

  return useMemo(
    () => ({ handleApproveImport, handleDeclineImport, loading }),
    [handleApproveImport, handleDeclineImport, loading]
  );
};
