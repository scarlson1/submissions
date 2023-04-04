import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';

import { createTenantFromSubmission, sendAgencyApprovedNotification } from 'modules/api';
import { getErrorCode, getErrorMessage } from 'modules/utils/errorHelpers';

interface UseCreateTenantProps {
  onSuccess?: (data: unknown) => void;
  onError?: (errArgs: { code: string; message: string }) => void;
}

export const useCreateTenant = ({ onSuccess, onError }: UseCreateTenantProps) => {
  const functions = useFunctions();
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);

  const createTenant = useCallback(
    async (submissionId: string) => {
      setError(undefined);
      setLoading(true);

      try {
        let { data } = await createTenantFromSubmission(functions, { docId: submissionId });
        console.log('created tenant res: ', data);

        setLoading(false);
        if (onSuccess) onSuccess(data);

        return data;
      } catch (err) {
        console.log('ERROR: ', err);
        const code = getErrorCode(err);
        const message = getErrorMessage(err);

        setError({ code, message });
        setLoading(false);
        if (onError) onError({ code, message });

        return Promise.reject({ code, message });
      }
    },
    [onSuccess, onError]
  );

  const sendApprovedNotification = useCallback(async (docId: string, tenantId: string) => {
    let { data } = await sendAgencyApprovedNotification(functions, {
      docId,
      tenantId,
    });
    console.log('notifications sent res: ', data);

    return data;
  }, []);

  const sendRejectedNotification = useCallback(async (docId: string) => {
    alert('not implemented');
    return 'not implemented';
  }, []);

  return { createTenant, sendApprovedNotification, sendRejectedNotification, error, loading };
};

// REACT QUERY VERSION

// const createTenant = (submissionId: string) => {
//   let createTenantCF = httpsCallable<CreateRequest, TenantResponse>(
//     functions,
//     'createTenantFromSubmission'
//   );
//   return createTenantCF({ docId: submissionId });
// };

// export const useCreateTenantRQ = () => {
//   return useMutation({
//     mutationFn: (subId: string) => createTenant(subId),
//     // onMutate: (vars: { submissionId }) => {
//     // },
//     onSuccess: (data: any, vars, ctx) => {
//       console.log('createTenant res: ', data, vars, ctx);
//       queryClient.invalidateQueries(['agencySubmissions', vars]);
//     },
//     onError: (err) => {
//       console.log('error creating tenant: ', err);
//     },
//   });
// };
