import axios, { AxiosResponse } from 'axios';
import { getAuth } from 'firebase/auth';

import { LineOfBusiness, State, TTax, TTaxItemName, TransactionType, WithId } from 'common';
import { z } from 'zod';

// TODO: move/ create doRequest hook (easier to call getIdToken)

export const ApiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 6000,
  headers: {
    Accept: 'application/vnd.GitHub.v3+json',
    //'Authorization': 'token <your-token-here> -- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
  },
});

// TODO: interceptors (handle express validator errors)
// const SubjectBaseKeys = SubjectBaseItem.exclude(['fixedFee', 'noFee'])
// const SubjectBaseKeyVal = z.map(SubjectBaseKeys, z.number())
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

// export type SubjectBaseKeyVal = Record<Exclude<TSubjectBaseItem, 'fixedFee' | 'noFee'>, number>;

// export interface StateTaxRequest extends SubjectBaseKeyVal {
//   state: string;
//   transactionType: TTransactionType;
//   quoteNumber?: string | null;
//   effectiveDate?: Date | string;
//   lineOfBusiness?: TLineOfBusiness;
// }

interface TaxResLineItem
  extends Omit<WithId<TTax>, 'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'> {
  displayName: TTaxItemName;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: TaxResLineItem[];
}

// TODO: move getIdToken outside fn (to hook --> call before request)
// generic fn --> pass req and res types and api endpoint to initialize hook
// use react fire for token ?? or auth context ??
export async function fetchTaxes(body: StateTaxRequest) {
  const token = await getAuth().currentUser?.getIdToken();

  // TODO: move authorization to axios instance ??
  const { data } = await ApiClient.post<StateTaxRequest, AxiosResponse<StateTaxResponse>>(
    '/state-tax',
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
}
