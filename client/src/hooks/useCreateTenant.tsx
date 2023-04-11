import { useState, useCallback } from 'react';
// import { httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';

import { createTenantFromSubmission, sendAgencyApprovedNotification } from 'modules/api';
import { getErrorCode, getErrorMessage } from 'modules/utils/errorHelpers';
import { useConfirmation } from 'modules/components';
import { useAsyncToast } from './useAsyncToast';

interface UseCreateTenantProps {
  onSuccess?: (data: { tenantId?: string }) => void;
  onError?: (errArgs: { code: string; message: string }) => void;
}

export const useCreateTenant = ({ onSuccess, onError }: UseCreateTenantProps) => {
  const functions = useFunctions();
  const confirm = useConfirmation();
  const toast = useAsyncToast();
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);

  // CALLED INTERNALLY & callable in hook ?? or just use regular send invite hook ??
  const sendApprovedNotification = useCallback(
    async (docId: string, tenantId: string) => {
      let { data } = await sendAgencyApprovedNotification(functions, {
        docId,
        tenantId,
      });
      console.log('notifications sent res: ', data);

      return data;
    },
    [functions]
  );

  // TODO: CALLED INTERNALLY
  // const sendRejectedNotification = useCallback(async (docId: string) => {
  //   alert('not implemented');
  //   return 'not implemented';
  // }, []);

  // CALLED INTERNALLY
  const promptForNotification = useCallback(
    async (msg: string) => {
      try {
        await confirm({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Notify Primary Contact?',
          confirmButtonText: 'Notify',
          confirmButtonProps: { variant: 'contained' },
          cancelButtonProps: { variant: 'greyText' },
          description: msg,
          dialogContentProps: { dividers: true },
        });
        return true;
      } catch (err) {
        return false;
      }
    },
    [confirm]
  );

  // CALLED INTERNALLY - AFTER CREATING TEANANT
  const handleSuccess = useCallback(
    async (submissionId: string, tenantId?: string) => {
      const shouldNotify = await promptForNotification(
        'Would you like to notify the primary contact and invite them to create an account?'
      );

      if (!!shouldNotify) {
        toast.loading('sending notification...');
        await sendApprovedNotification(submissionId, `${tenantId}`);
        toast.success('notification delivered');
      }

      if (onSuccess) onSuccess({ tenantId });
      // navigate(createPath({ path: ADMIN_ROUTES.ORGANIZATIONS }));
    },
    [promptForNotification, sendApprovedNotification, toast, onSuccess]
  );

  const createTenant = useCallback(
    async (submissionId: string) => {
      setError(undefined);
      setLoading(true);

      try {
        toast.loading('creating tenant ...');
        let { data } = await createTenantFromSubmission(functions, { docId: submissionId });
        console.log('created tenant res: ', data);
        toast.success(`Org created (ID: ${data?.tenantId}) 🎉`);

        setLoading(false);
        return handleSuccess(submissionId, data.tenantId);
      } catch (err) {
        console.log('ERROR: ', err);
        const code = getErrorCode(err);
        const message = getErrorMessage(err);

        setError({ code, message });
        setLoading(false);

        toast.error(message);
        if (onError) onError({ code, message });

        // return Promise.reject({ code, message });
      }
    },
    [onError, handleSuccess, functions, toast]
  );

  return { createTenant, error, loading, sendApprovedNotification }; // sendApprovedNotification, sendRejectedNotification,
};
