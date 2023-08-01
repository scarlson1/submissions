import { useCallback } from 'react';
import { useFunctions } from 'reactfire';

import { inviteUsers as inviteUsersCF, InviteUsersResponse, NewUser } from 'api';
import { useAsyncToast } from './useAsyncToast';

export const useInviteUsers = (
  onSuccess?: (data: InviteUsersResponse) => void,
  onError?: (msg: string, err: any) => void
) => {
  const functions = useFunctions();
  const toast = useAsyncToast();

  const inviteUsers = useCallback(
    async (users: NewUser[], tenantId?: string | null, orgId?: string | null) => {
      try {
        toast.loading('sending invites...');
        const { data } = await inviteUsersCF(functions, { users, tenantId, orgId });
        toast.success(`invites sent!`);

        if (onSuccess) onSuccess(data);
      } catch (err: any) {
        console.log('ERROR: ', err);

        let msg = 'Error sending invites. See console for details.';
        if (err.message) msg = `Error sending invites. ${err.message}.`;
        if (err.code) msg += ` (${err.code})`;

        toast.error(msg);
        if (onError) onError(msg, err);
      }
    },
    [onSuccess, onError, functions, toast]
  );

  return inviteUsers;
};
