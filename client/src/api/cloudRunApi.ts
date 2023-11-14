import axios from 'axios';
import { z } from 'zod';

import {
  LineOfBusiness,
  Product,
  State,
  TTax,
  TTaxItemName,
  TransactionType,
  WithId,
} from 'common';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const ApiClient = axios.create({
  baseURL: API_URL,
  timeout: 6000,
  headers: {
    Accept: 'application/json',
  },
});

// TODO: interceptors (handle express validator errors)

interface TaxResLineItem
  extends Omit<WithId<TTax>, 'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'> {
  displayName: TTaxItemName;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: TaxResLineItem[];
}

export const ApiEndPoint = z.enum([
  '/state-tax',
  '/state-active',
  '/moratorium',
  '/surplus-lines-license',
]);
export type TApiEndPoint = z.infer<typeof ApiEndPoint>;

export const ZSubjectBaseKeyVal = z.object({
  premium: z.number(),
  inspectionFees: z.number(),
  mgaFees: z.number(),
  outStatePremium: z.number(),
  homeStatePremium: z.number(),
});
export type SubjectBaseKeyVal = z.infer<typeof ZSubjectBaseKeyVal>;

export const ZStateTaxRequest = ZSubjectBaseKeyVal.and(
  z.object({
    state: State,
    transactionType: TransactionType,
    quoteNumber: z.string().optional().nullable(),
    effectiveDate: z.date().or(z.string()).optional(),
    lineOfBusiness: LineOfBusiness.optional(),
  })
);
export type StateTaxRequest = z.infer<typeof ZStateTaxRequest>;

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
export type TActiveStateRequestConfig = z.infer<typeof ActiveStateRequestConfig>;

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
export type TMoratoriumRequestConfig = z.infer<typeof MoratoriumRequestConfig>;

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
export type TSlLicenseRequestConfig = z.infer<typeof SlLicenseRequestConfig>;

const CloudApiConfig = z.union([
  TaxRequestConfig,
  ActiveStateRequestConfig,
  MoratoriumRequestConfig,
  SlLicenseRequestConfig,
]);
export type TCloudApiConfig = z.infer<typeof CloudApiConfig>;

// TODO: generic function for response type ??: https://stackoverflow.com/questions/74907523/creating-zod-schema-for-generic-interface
// function createPaginatedResponseSchema<ItemType extends z.ZodTypeAny>(itemSchema: ItemType) {
//   return z.object({
//     pageIndex: z.number(),
//     pageSize: z.number(),
//     totalCount: z.number(),
//     totalPages: z.number(),
//     items: z.array(itemSchema),
//   });
// }
