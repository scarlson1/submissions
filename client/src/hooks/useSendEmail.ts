import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';

import { useMutation } from '@tanstack/react-query';
import { sendEmail } from 'api';
import { BaseSendEmailResponse, SendEmailRequest } from 'common';

export interface UseSendEmailProps<T> {
  onSuccess?: (data: BaseSendEmailResponse) => void;
  onError?: (msg: string, err: unknown) => void;
  onMutate?: (variables, context) => void | Promise<void>;
}

export const useSendEmailOld = <T extends SendEmailRequest = SendEmailRequest>({
  onSuccess,
  onError,
}: UseSendEmailProps<T> | undefined = {}) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const send = useCallback(
    async (args: SendEmailRequest) => {
      // TODO: filter to for unique
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
    [functions, onSuccess, onError],
  );

  return { send, loading, error };
};

export const useSendEmail = <T extends SendEmailRequest = SendEmailRequest>({
  onSuccess,
  onError,
  onMutate,
}: UseSendEmailProps<T> | undefined = {}) => {
  const functions = useFunctions();

  const { mutate, isPending, error } = useMutation<any, Error, T, unknown>({
    mutationFn: async (vars) => {
      return await sendEmail(functions, vars);
    },
    onMutate: onMutate,
    onSuccess(data, variables, onMutateResult, context) {
      if (onSuccess) onSuccess(data);
    },
    onError(error, variables, onMutateResult, context) {
      if (onError) {
        const msg =
          error instanceof Error ? error.message : 'something went wrong';
        onError(msg, error);
      }
    },
    // onSettled(data, error, variables, onMutateResult, context) {},
  });

  return { send: mutate, loading: isPending, error };
};
