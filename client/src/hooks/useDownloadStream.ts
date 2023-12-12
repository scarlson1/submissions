import { useCallback, useState } from 'react';

import { functionsInstance } from 'api';
import { saveDownload } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';

export function useDownloadStream(
  method: 'get' | 'post',
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) {
  const [loading, setLoading] = useState(false);
  const toast = useAsyncToast({ position: 'top-right' });

  const downloadFile = useCallback(async (filename: string, path: string, data?: any) => {
    try {
      setLoading(true);
      toast.loading('fetching file...');
      const res = await functionsInstance({
        method,
        url: path,
        data,
        responseType: 'blob',
      });

      saveDownload([res.data], filename); // `iDemand Flood Policy ${policyId}.pdf`

      toast.success('file downloaded', { duration: 1000 });
      if (onSuccess) onSuccess();
      setLoading(false);
    } catch (err: any) {
      let msg = 'error downloading file';
      if (err.message) msg += ` (${err.message})`;

      toast.error('error downloading file', { duration: 2000 });
      if (onError) onError(msg, err);
      setLoading(false);
    }
  }, []);

  return { downloadFile, loading };
}
