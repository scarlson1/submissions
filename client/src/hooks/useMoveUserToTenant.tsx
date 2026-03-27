import { useCallback, useMemo, useState } from 'react';
import { useFunctions } from 'reactfire';

import { moveUserToTenant } from 'api';

export const useMoveUserToTenant = (
  onSuccess?: (msg: string) => void,
  onError?: (msg: string, err?: any) => void
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const moveUser = useCallback(
    async (userId: string, fromTenantId: string | null, toTenantId: string | null) => {
      if (!(fromTenantId || toTenantId)) {
        if (onError) onError('Must provide to or from tenant ID');
        return;
      }

      try {
        setError(null);
        setLoading(true);

        await moveUserToTenant(functions, {
          userId,
          toTenantId: toTenantId ?? undefined,
          fromTenantId: fromTenantId ?? undefined,
        });

        const msg = `User (${userId}) tenant set to ${toTenantId}`;

        setLoading(false);
        if (onSuccess) onSuccess(msg);
      } catch (err: any) {
        let msg = 'Error setting tenant ID';
        if (err.message) msg = err.message;

        if (onError) onError(msg);
        setError(msg);
      }
    },
    [functions, onSuccess, onError]
  );

  return useMemo(() => ({ moveUser, loading, error }), [moveUser, loading, error]);
};
