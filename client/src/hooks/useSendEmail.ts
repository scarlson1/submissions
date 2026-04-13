import { useMutation } from '@tanstack/react-query';
import { useFunctions } from 'reactfire';

import { sendEmail } from 'api';
import { SendEmailRequest } from 'common';

export interface UseSendEmailProps {
  onSuccess?: (data) => void;
  onError?: (msg: string, err: unknown) => void;
  onMutate?: (variables, context) => void | Promise<void>;
}

// <R extends BaseSendEmailResponse = BaseSendEmailResponse, T extends SendEmailRequest = SendEmailRequest>
export const useSendEmail = <T extends SendEmailRequest = SendEmailRequest>({
  onSuccess,
  onError,
  onMutate,
}: UseSendEmailProps | undefined = {}) => {
  const functions = useFunctions();

  const { mutate, isPending, error } = useMutation<unknown, Error, T, unknown>({
    mutationFn: async (vars) => {
      const { data } = await sendEmail(functions, vars);
      return data;
    },
    onMutate: onMutate,
    onSuccess(data, vars, onMutateResult, context) {
      if (onSuccess) onSuccess(data);
    },
    onError(error, vars, onMutateResult, context) {
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
