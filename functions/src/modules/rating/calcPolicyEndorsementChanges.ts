// props: location changes, effDate,
// returns: policy changes (DeepPartial<PolicyNew>)

import { DeepPartial, ILocation, PolicyLocation, PolicyNew } from '../../common';
import { recalcTaxes } from '../transactions';
import {
  calcPolicyPremium,
  sumFeesTaxesPremium,
  sumPolicyTermPremiumIncludeCancels,
} from './sumPremium';

// TODO: need effective date ??
export const calcPolicyEndorsementChanges = (
  policy: PolicyNew,
  locationChanges: Record<string, DeepPartial<ILocation>>
  // effDate: Timestamp
) => {
  // convert location changes from ILocation to PolicyLocation
  // combine prev location values (in policy.locations) with location changes
  // recalculate premium and fees

  const lcnSummChanges: DeepPartial<PolicyNew['locations']> = {};

  for (let [lcnId, lcnChanges] of Object.entries(locationChanges)) {
    let summChanges: Partial<PolicyLocation> = {};
    if (lcnChanges.termPremium !== undefined) summChanges.termPremium = lcnChanges.termPremium;
    lcnSummChanges[lcnId] = {
      ...summChanges,
    };
  }
  // const lcnSummChanges: PolicyNew['locations'] = Object.entries(locationChanges).map(([lcnId, lcnChanges]) => ({

  // }))

  // TODO: throw if lcnSummChanges is empty ??

  const newLcnArr = [...Object.values(lcnSummChanges)];

  const {
    termPremium: newPolicyTermPremium,
    inStatePremium,
    outStatePremium, // @ts-ignore TODO: fix typing
  } = calcPolicyPremium(policy.homeState, newLcnArr);

  // @ts-ignore TODO: fix typing
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
    locations: lcnSummChanges,
    // locations: {
    //   [locationId]: {
    //     termPremium: locationTermPremium,
    //   },
    // },
  };

  // if (newLcnArr.filter((l) => !l.cancelEffDate).length === 1) {
  //   policyChanges['expirationDate'] = expDateTS;
  //   policyChanges['termDays'] = termDays;
  // }

  // once billing entity set up --> recalc prem/taxes/fees per billing entity

  return policyChanges;
};
