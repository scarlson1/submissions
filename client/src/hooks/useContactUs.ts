import { useState, useCallback } from 'react';

import { ContactUsValues } from 'elements/ContactForm';
import { sendContactEmail } from 'modules/api';
import { getFunctions } from 'firebase/functions';

export interface ContactUsProps {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

export const useContactUs = ({ onSuccess, onError }: ContactUsProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const sendMessage = useCallback(
    async ({ email, subject, body }: ContactUsValues) => {
      try {
        setLoading(true);
        const { data } = await sendContactEmail(getFunctions(), { email, subject, body });
        console.log('res: ', data);
        if (onSuccess) onSuccess();
        setLoading(false);
      } catch (err) {
        setError(err);
        if (onError) onError(err);
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return { sendMessage, loading, error };
};
