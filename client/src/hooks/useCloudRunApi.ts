import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { useUser } from 'reactfire';

import { ApiClient, TCloudApiConfig } from 'api';

const useIdToken = () => {
  const { data: user } = useUser();
  const token = useRef<string>();

  useEffect(() => {
    if (!user) token.current = undefined;
    user?.getIdToken().then((result) => {
      token.current = result || undefined;
    });
  }, [user]);

  return token.current;
};

type UseCloudRunApiOptions<T extends TCloudApiConfig, R> = {
  shouldThrow?: boolean;
  onSuccess?: (data: R) => void;
  onError?: (msg: string, err: any) => void;
} & Pick<T, 'url' | 'method'>;

export const useCloudRunApi = <T extends TCloudApiConfig, R = any>({
  url,
  method,
  ...options
}: UseCloudRunApiOptions<T, R>) => {
  const token = useIdToken();

  const doRequest = useCallback(
    async (config: AxiosRequestConfig<T['data']> = {}) => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await ApiClient<T['data'], AxiosResponse<R>>({
          ...config,
          method,
          url,
          headers: {
            ...headers,
            ...config?.headers,
          },
        });

        if (options?.onSuccess) options.onSuccess(data);
        return data;
      } catch (err: any) {
        // TODO: extract err message (interceptors)
        const msg = 'an error occurred. see console for details';
        if (options?.onError) options.onError(msg, err);
        if (options?.shouldThrow || options?.shouldThrow === undefined) throw new Error(err);
      }
    },
    [token, url, method, options]
  );

  return doRequest;
};

// const Options = z.object({
//   shouldThrow: z.boolean().optional(),
//   onSuccess: z.function().args(z.any()).optional(), // TODO: generic factory fn
//   onError: z.function().args(z.string(), z.any()).optional(),
// });

// // below works -- overkill ??
// const StateTaxFn = z
//   .function()
//   .args(
//     z
//       .object({
//         url: z.literal('/state-tax'),
//         method: z.literal('post'),
//       })
//       .and(Options)
//   )
//   .returns(
//     z
//       .function()
//       .args(z.object({ data: ZStateTaxRequest }))
//       .returns(
//         z.promise(
//           z.object({
//             lineItems: z.array(
//               Tax.and(
//                 z.object({
//                   displayName: TaxItemName,
//                   calculatedTaxBase: z.number().nullable(),
//                   rate: z.number().nullable(),
//                   value: z.number(),
//                   effectiveDate: z.string(),
//                   expirationDate: z.string().nullable(),
//                 })
//               )
//             ),
//           })
//         )
//       )
//   )

//   type StateTaxFnT = z.infer<typeof StateTaxFn>
