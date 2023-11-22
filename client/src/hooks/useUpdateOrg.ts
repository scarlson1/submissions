import { doc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';

import { Organization, OrganizationZ, orgsCollection } from 'common';

const PartialOrg = OrganizationZ.partial();

export const useUpdateOrg = (
  orgId: string,
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();

  return useCallback(
    async (values: Partial<Organization>) => {
      try {
        const orgRef = doc(orgsCollection(firestore), orgId);
        // redundant ??
        if (!PartialOrg.safeParse(values).success) {
          onError && onError('validation failed', null);
          return;
        }

        await updateDoc(orgRef, values);

        onSuccess && onSuccess();
      } catch (err: any) {
        let msg = 'something went wrong';
        if (err?.message) msg += `${err.message}`;
        onError && onError(msg, err);
      }
    },
    [orgId, onSuccess, onError]
  );
};
