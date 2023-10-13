import { deepmerge } from 'deepmerge-ts';
import { Timestamp } from 'firebase-admin/firestore';
import {
  CancellationReason,
  DeepPartial,
  ILocation,
  POLICY_STATUS,
  PolicyNew,
} from '../../common/index.js';
import { partialLcnToPolicyLcn } from '../../utils/transform.js';
import { validateHasPrem } from '../../utils/validation.js';
import { getTermDays } from '../transactions/index.js';
import { calcPolicyPremiumAndTaxes } from './sumPremium.js';

// TODO: are the any scenarios where policy values could change, without affecting locations ?
// or can all policy level updates be derived from location changes ??
// can same function be used for cancellation ??

export type CalcPolicyChangesResult = Pick<
  PolicyNew,
  | 'termPremium'
  // | 'termDays'
  | 'price'
  | 'inStatePremium'
  | 'outStatePremium'
  | 'locations'
  | 'termPremiumWithCancels'
  | 'taxes'
> &
  Partial<Pick<PolicyNew, 'cancelEffDate' | 'cancelReason' | 'termDays' | 'status'>>;

export const calcPolicyEndorsementChanges = (
  policy: PolicyNew,
  locationChanges: Record<string, DeepPartial<ILocation>>,
  reqEffDate: Timestamp,
  cancelReason?: CancellationReason
): CalcPolicyChangesResult => {
  const lcnSummaryChanges: DeepPartial<PolicyNew['locations']> = {};

  // convert location changes from ILocation to PolicyLocation
  for (let [lcnId, lcnChanges] of Object.entries(locationChanges)) {
    validateHasPrem(lcnChanges);

    lcnSummaryChanges[lcnId] = partialLcnToPolicyLcn(lcnChanges);
  }

  // combine prev location values (in policy.locations) with location changes
  const lcnSummaryWithChanges = deepmerge(
    policy.locations,
    lcnSummaryChanges
  ) as PolicyNew['locations'];
  const newLcnArr = Object.values(lcnSummaryWithChanges);

  const {
    termPremium: newPolicyTermPremium,
    inStatePremium,
    outStatePremium,
    termPremiumWithCancels,
    taxes,
    price,
  } = calcPolicyPremiumAndTaxes(newLcnArr, policy.homeState, policy.taxes, policy.fees);

  let policyChanges: CalcPolicyChangesResult = {
    termPremium: newPolicyTermPremium,
    termPremiumWithCancels,
    inStatePremium,
    outStatePremium,
    taxes,
    price,
    locations: lcnSummaryChanges as PolicyNew['locations'], // TODO: fix typing
  };

  // if all locations have cancel eff date --> add cancelEffDate to policy
  if (!newLcnArr.filter((l) => !l.cancelEffDate).length) {
    policyChanges['status'] = POLICY_STATUS.CANCELLED;
    policyChanges['cancelEffDate'] = reqEffDate;
    policyChanges['termDays'] = getTermDays(policy.effectiveDate.toDate(), reqEffDate.toDate());
    if (cancelReason) policyChanges['cancelReason'] = cancelReason;
  }

  // TODO: once billing entity set up --> recalc prem/taxes/fees per billing entity

  return policyChanges;
};
