import { useCallback, useState } from 'react';

import { functionsInstance } from 'api';
import { useAsyncToast } from './useAsyncToast';

type PDFRoutes = 'generateDecPDF'; // 'generatePolicy'

export const useGeneratePDF = (
  route: PDFRoutes,
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) => {
  const [loading, setLoading] = useState(false);
  const toast = useAsyncToast({ position: 'top-right' });

  const downloadPDF = useCallback(
    async (policyId: string) => {
      try {
        setLoading(true);
        toast.loading('generating policy pdf...');
        const res = await functionsInstance.post(
          `generatepdf/${route}`,
          { policyId },
          { responseType: 'blob' }
        );

        const objectUrl = window.URL.createObjectURL(new Blob([res.data]));

        const link = document.createElement('a');
        link.href = objectUrl;
        link.setAttribute('download', `iDemand Flood Policy ${policyId}.pdf`);

        document.body.appendChild(link);
        link.click();
        // TODO: clean up "a" element & remove ObjectURL
        document.body.removeChild(link);
        // URL.revokeObjectURL(href);

        toast.success('policy downloaded', { duration: 1000 });
        if (onSuccess) onSuccess();
        setLoading(false);
      } catch (err: any) {
        let msg = 'error downloading policy';
        if (err.message) msg += ` (${err.message})`;

        toast.error('an error occurred', { duration: 2000 });
        if (onError) onError(msg, err);
        setLoading(false);
      }
    },
    [route, onSuccess, onError, toast]
  );

  return { downloadPDF, loading };
};
