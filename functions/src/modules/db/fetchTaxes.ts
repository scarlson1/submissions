import invariant from 'tiny-invariant';

import axios, { AxiosResponse } from 'axios';
import { info } from 'firebase-functions/logger';
import {
  LineOfBusiness,
  Quote,
  SubjectBaseItems,
  Tax,
  TaxItem,
  TransactionType,
  WithId,
  submissionsApiBaseURL,
} from '../../common';
import { sumInspectionFees, sumMGAFees } from '../transactions';

export type SubjectBaseKeyVal = Record<Exclude<SubjectBaseItems, 'fixedFee' | 'noFee'>, number>;

interface StateTaxRequest extends SubjectBaseKeyVal {
  state: string;
  transactionType: TransactionType;
  quoteNumber?: string | null;
  effectiveDate?: Date | string;
  lineOfBusiness?: LineOfBusiness;
}

interface TaxResLineItem
  extends Omit<WithId<Tax>, 'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'> {
  displayName: string;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: TaxResLineItem[];
}

export async function fetchTaxes(quote: Quote, transactionType: TransactionType) {
  const fees = quote?.fees;
  const state = quote?.address?.state;
  const annualPremium = quote?.annualPremium;

  invariant(Array.isArray(fees), 'fees must be an array (fetch taxes)');
  invariant(state, 'missing state (fetch taxes)');
  invariant(annualPremium, 'missing annualPremium (fetch taxes)');

  const mgaFees = sumMGAFees(fees);
  const inspectionFees = sumInspectionFees(fees);

  const body: StateTaxRequest = {
    state,
    homeStatePremium: annualPremium,
    outStatePremium: 0,
    premium: annualPremium,
    mgaFees,
    inspectionFees,
    transactionType,
  };

  const { data } = await axios.post<StateTaxRequest, AxiosResponse<StateTaxResponse>>(
    `${submissionsApiBaseURL.value()}/state-tax`,
    body
  );

  info('TAX RES: ', data);

  let newTaxes: TaxItem[] = [];
  if (data && data.lineItems?.length > 0) {
    newTaxes = data.lineItems.map((t) => ({
      displayName: t.displayName || '',
      rate: t.rate || t.value,
      value: t.value,
      subjectBase: t.subjectBase || [],
      baseDigits: t.baseDigits,
      resultDigits: t.resultDigits,
      resultRoundType: t.resultRoundType,
    }));
  }

  return newTaxes;
}
