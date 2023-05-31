import { useState, useCallback } from 'react';
import { useFunctions } from 'reactfire';

import { sendEmail } from 'modules/api';
import { BaseSendEmailResponse, SendEmailRequest } from 'common';

export interface UseSendEmailProps {
  onSuccess?: (data: BaseSendEmailResponse) => void;
  onError?: (msg: string, err: unknown) => void;
}

export const useSendEmail = ({ onSuccess, onError }: UseSendEmailProps | undefined = {}) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const send = useCallback(
    async (args: SendEmailRequest) => {
      try {
        setLoading(true);
        const { data } = await sendEmail(functions, args);

        console.log('res: ', data);
        if (onSuccess) onSuccess(data);
        setLoading(false);
        return data;
      } catch (err: any) {
        let errMsg = 'Error delivering email';
        if (err.message) errMsg += ` - ${err.message}`;
        setError(err);
        console.log('ERROR MSG: ', errMsg);
        if (onError) onError(errMsg, err);
        setLoading(false);
      }
    },
    [functions, onSuccess, onError]
  );

  return { send, loading, error };
};
