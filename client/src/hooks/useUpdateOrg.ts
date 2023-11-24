import { useCallback } from 'react';

import { Organization, orgsCollection } from 'common';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';

// TODO: delete and use generic useUpdateDoc hook ??

// const PartialOrg = OrganizationZ.partial();
// TODO: need to validate with zod ??

// export const useUpdateOrg = (
//   orgId: string,
//   onSuccess?: () => void,
//   onError?: (msg: string, err: any) => void
// ) => {
//   const updateOrg = useUpdateDoc<Organization>('organizations', onSuccess, onError);

//   return useCallback(
//     (values: Partial<Organization>) => updateOrg(orgId, values),
//     [updateOrg, orgId]
//   );
// };

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
