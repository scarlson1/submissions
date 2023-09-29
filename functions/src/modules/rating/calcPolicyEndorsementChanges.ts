import { deepmerge } from 'deepmerge-ts';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DeepPartial,
  ILocation,
  LcnWithTermPrem,
  POLICY_STATUS,
  PolicyNew,
} from '../../common/index.js';
import { partialLcnToPolicyLcn } from '../../utils/transform.js';
import { getTermDays, recalcTaxes } from '../transactions/index.js';
import {
  calcPolicyPremium,
  sumFeesTaxesPremium,
  sumPolicyTermPremiumIncludeCancels,
} from './sumPremium.js';

// TODO: are the any scenarios where policy values could change, without affecting locations ?
// or can all policy level updates be derived from location changes ??
// can same function be used for cancellation ??

// TODO: need effective date ??
export const calcPolicyEndorsementChanges = (
  policy: PolicyNew,
  locationChanges: Record<string, DeepPartial<ILocation>>,
  reqEffDate: Timestamp
) => {
  const lcnSummaryChanges: DeepPartial<PolicyNew['locations']> = {};

  // convert location changes from ILocation to PolicyLocation
  for (let [lcnId, lcnChanges] of Object.entries(locationChanges)) {
    if (lcnChanges.termPremium === undefined)
      throw new Error(`rating required for location ${lcnId} (missing term premium)`);

    // TODO: create assertion function to check if type LcnWithTermPrem (& replace error above)
    lcnSummaryChanges[lcnId] = partialLcnToPolicyLcn(lcnChanges as LcnWithTermPrem);
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
  } = calcPolicyPremium(policy.homeState, newLcnArr);

  const termPremiumWithCancels = sumPolicyTermPremiumIncludeCancels(newLcnArr);

  const newTaxes = recalcTaxes({
    premium: newPolicyTermPremium,
    homeStatePremium: inStatePremium,
    outStatePremium,
    taxes: policy.taxes,
    fees: policy.fees,
  });

  const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

  let policyChanges: DeepPartial<PolicyNew> = {
    termPremium: newPolicyTermPremium,
    termPremiumWithCancels,
    inStatePremium,
    outStatePremium,
    taxes: newTaxes,
    price: newPrice,
    locations: lcnSummaryChanges,
    // locations: {
    //   [locationId]: {
    //     termPremium: locationTermPremium,
    //   },
    // },
  };

  // if all locations have cancel eff date --> add cancelEffDate to policy
  if (!newLcnArr.filter((l) => !l.cancelEffDate).length) {
    // policyChanges['expirationDate'] = expDateTS;
    policyChanges['status'] = POLICY_STATUS.CANCELLED;
    policyChanges['cancelEffDate'] = reqEffDate;
    policyChanges['termDays'] = getTermDays(policy.effectiveDate.toDate(), reqEffDate.toDate());
  }

  // TODO: once billing entity set up --> recalc prem/taxes/fees per billing entity

  return policyChanges;
};
