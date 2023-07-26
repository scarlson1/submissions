import { Policy, dollarFormat } from '../../common';
import { getFormattedAddress } from '../../routes/generatePDF';
import { PolicyDecPDFLocations } from './Table';

export function formatLocationData(locations: Policy['locations']) {
  let formatted: PolicyDecPDFLocations[] = [];

  for (const [locationId, location] of Object.entries(locations)) {
    const test = {
      address: getFormattedAddress(location.address),
      locationId,
      limitA: location.limits?.limitA ? dollarFormat(location.limits?.limitA) : '',
      limitB: location.limits?.limitA ? dollarFormat(location.limits?.limitB) : '',
      limitC: location.limits?.limitA ? dollarFormat(location.limits?.limitC) : '',
      limitD: location.limits?.limitA ? dollarFormat(location.limits?.limitD) : '',
      deductible: dollarFormat(location.deductible),
      annualPremium: location.annualPremium ? dollarFormat(location.annualPremium) : '',
      termPremium: location.termPremium ? dollarFormat(location.termPremium) : '',
    };
    console.log('formatted: ', test);
    formatted.push(test);
  }

  return formatted;
}
