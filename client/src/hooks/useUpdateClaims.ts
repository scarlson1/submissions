import { useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';

import { userClaimsCollection } from 'common';
import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { useAuthActions } from 'modules/components';

export const useUpdateClaims = (
  onSuccess?: null | undefined | ((newClaims: Record<string, any>) => void),
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  const { data: claimsCheckResult } = useSigninCheck({
    validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'IDEMAND_ADMIN']),
  });
  const { sendVerification } = useAuthActions();

  const updateClaims = useCallback(
    async (orgId: string, userId: string, claims: Record<string, any>) => {
      if (!claimsCheckResult.hasRequiredClaims) throw new Error('missing required permissions');

      if (!claimsCheckResult.user?.emailVerified) {
        await sendVerification();
        throw new Error('email verification required to update permissions');
      }

      // TODO: check if iDemand Admin or orgId === user.tenantId
      try {
        const claimsColRef = userClaimsCollection(firestore, orgId);
        const userClaimsDocRef = doc(claimsColRef, userId);

        // FB cloud function will ignore changes if _lastCommitted is equal in before & after
        // removing will ensure _lastCommitted is not equal
        if (claims._lastCommitted) delete claims._lastCommitted;

        console.log('SETTING CLAIMS: ', claims);
        await setDoc(userClaimsDocRef, { ...claims });

        if (onSuccess) onSuccess(claims);
      } catch (err: any) {
        let msg = `Error updating claims`;
        if (err.message) msg = err.message;

        if (onError) onError(msg, err);

        return Promise.reject(new Error(msg));
      }
    },
    [firestore, onSuccess, onError, claimsCheckResult, sendVerification]
  );

  return updateClaims;
};
