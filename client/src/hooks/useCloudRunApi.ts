import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import { useUser } from 'reactfire';
import { z } from 'zod';

import { ApiClient, ZStateTaxRequest } from 'api';
import { Product, State } from 'common';

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

export const HttpMethod = z.enum([
  'get',
  'post',
  'patch',
  'put',
  'delete',
  'postForm',
  'putForm',
  'patchForm',
]);
export type THttpMethod = z.infer<typeof HttpMethod>;

export const ApiEndPoint = z.enum([
  '/state-tax',
  '/state-active',
  '/moratorium',
  '/surplus-lines-license',
]);
export type TApiEndPoint = z.infer<typeof ApiEndPoint>;

const TaxRequestConfig = z.object({
  url: z.literal('/state-tax'),
  method: z.literal('post'),
  data: ZStateTaxRequest,
});
export type TTaxRequestConfig = z.infer<typeof TaxRequestConfig>;

const ActiveStateRequestConfig = z.object({
  url: z.literal('/state-active'),
  method: z.literal('get'),
  params: z.object({
    state: State,
  }),
  data: z.never(),
});

const MoratoriumRequestConfig = z.object({
  url: z.literal('/moratorium'),
  method: z.literal('get'),
  params: z.object({
    countyFIPS: z.any(),
    date: z.date().or(z.string()).optional().nullable(),
    product: Product.optional().nullable(),
  }),
  data: z.never(),
});

const SlLicenseRequestConfig = z.object({
  url: z.literal('/surplus-lines-license'),
  method: z.literal('get'),
  params: z.object({
    state: State,
    date: z.date().or(z.string()).optional().nullable(),
    product: Product.optional().nullable(),
  }),
  data: z.never(),
});

// const CloudApiConfig = z.discriminatedUnion('url', [
//   TaxRequestConfig,
//   ActiveStateRequestConfig,
//   MoratoriumRequestConfig,
//   SlLicenseRequestConfig,
// ]);
const CloudApiConfig = z.union([
  TaxRequestConfig,
  ActiveStateRequestConfig,
  MoratoriumRequestConfig,
  SlLicenseRequestConfig,
]);

type TCloudApiConfig = z.infer<typeof CloudApiConfig>;

// TODO: generic function: https://stackoverflow.com/questions/74907523/creating-zod-schema-for-generic-interface
// function createPaginatedResponseSchema<ItemType extends z.ZodTypeAny>(itemSchema: ItemType) {
//   return z.object({
//     pageIndex: z.number(),
//     pageSize: z.number(),
//     totalCount: z.number(),
//     totalPages: z.number(),
//     items: z.array(itemSchema),
//   });
// }

// TODO: fix - discriminating union not working
// type UseCloudRunApiOptions<T> = {
//   shouldThrow?: boolean;
//   onSuccess?: (data: T) => void;
//   onError?: (msg: string, err: any) => void;
// } & Pick<TCloudApiConfig, 'url' | 'method'>;

type UseCloudRunApiOptions<T extends TCloudApiConfig, R> = {
  shouldThrow?: boolean;
  onSuccess?: (data: R) => void;
  onError?: (msg: string, err: any) => void;
} & Pick<T, 'url' | 'method'>;

// export const useCloudRunApi = <R, T>(
//   // endpoint: TApiEndPoint,
//   // method: THttpMethod = 'get',
//   { url, method, ...options }: UseCloudRunApiOptions<T>
// ) => {
export const useCloudRunApi = <T extends TCloudApiConfig, R = any>(
  // endpoint: TApiEndPoint,
  // method: THttpMethod = 'get',
  { url, method, ...options }: UseCloudRunApiOptions<T, R>
) => {
  const token = useIdToken();

  // async (config: Pick<AxiosRequestConfig<any>, 'data' | 'params'> = {}) => {
  const doRequest = useCallback(
    async (config: AxiosRequestConfig<T['data']> = {}) => {
      try {
        // <R, AxiosResponse<T>>
        const { data } = await ApiClient<T['data'], AxiosResponse<R>>({
          ...config,
          method,
          url,
          headers: {
            Authorization: `Bearer ${token}`,
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
//             ), // TODO: zod TaxResLineItem
//           })
//         )
//       )
//   )

//   type StateTaxFnT = z.infer<typeof StateTaxFn>
