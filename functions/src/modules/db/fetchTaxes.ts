import invariant from 'tiny-invariant';

import axios, { AxiosResponse } from 'axios';
import { info } from 'firebase-functions/logger';
import {
  LineOfBusiness,
  Quote,
  SubjectBaseItems,
  Tax,
  TaxItem,
  TaxItemName,
  TransactionType,
  WithId,
  submissionsApiBaseURL,
} from '../../common';
import { sumFeesByType, sumMGAFees } from '../transactions';
import { isDate } from 'date-fns';

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
  displayName: TaxItemName;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: TaxResLineItem[];
}

export async function fetchTaxes(quote: Quote, transactionType: TransactionType, effDate?: Date) {
  const fees = quote?.fees;
  const state = quote?.homeState;
  const annualPremium = quote?.annualPremium; // TODO: switch to termPremium

  invariant(Array.isArray(fees), 'fees must be an array (fetch taxes)');
  invariant(state, 'missing state (fetch taxes)');
  invariant(annualPremium, 'missing annualPremium (fetch taxes)');
  if (effDate) invariant(isDate(new Date(effDate)), 'invalid effective Date');

  const mgaFees = sumMGAFees(fees);
  const inspectionFees = sumFeesByType(fees, 'Inspection Fee');

  // TODO: switch to multi-location schema
  // TODO: calc in-state & out-state premium

  // const newPolicyTermPremium = sumPolicyTermPremium(newLocations);
  // const inStatePremium = getInStatePremium(policy.homeState, newLocations);
  // const outStatePremium = getOutStatePremium(policy.homeState, newLocations);

  const body: StateTaxRequest = {
    state,
    homeStatePremium: annualPremium,
    outStatePremium: 0,
    premium: annualPremium,
    mgaFees,
    inspectionFees,
    transactionType,
  };
  if (effDate) body['effectiveDate'] = effDate;

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
