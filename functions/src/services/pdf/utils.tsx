import { generateHTML } from '@tiptap/html';
import { convert } from 'html-to-text';
import { flatten } from 'lodash-es';

import {
  ILocation,
  JSONContent,
  PolicyNew,
  WithId,
  dollarFormat,
  dollarFormat2,
} from '../../common/index.js';
import {
  EDITOR_EXTENSION_DEFAULTS,
  getFormattedAddress,
  getFormattedAddressArray,
} from '../../utils/index.js';
import {
  AdditionalInterestsItem,
  PolicyDecPDFLocations,
  PremiumTableItem,
} from './components/index.js';

export function formatLocationData(locations: WithId<ILocation>[]) {
  let formatted: PolicyDecPDFLocations[] = [];

  for (const location of locations) {
    const test = {
      address: getFormattedAddressArray(location.address),
      locationId: location.externalId || location.id || '',
      limitA: location.limits?.limitA ? dollarFormat(location.limits?.limitA) : '',
      limitB: location.limits?.limitA ? dollarFormat(location.limits?.limitB) : '',
      limitC: location.limits?.limitA ? dollarFormat(location.limits?.limitC) : '',
      limitD: location.limits?.limitA ? dollarFormat(location.limits?.limitD) : '',
      deductible: dollarFormat(location.deductible),
      annualPremium: location.annualPremium ? dollarFormat(location.annualPremium) : '',
      termPremium: location.termPremium ? dollarFormat(location.termPremium) : '',
    };

    formatted.push(test);
  }

  return formatted;
}

// TODO: refactor - use for loops instead of map and remove flatten
export function getLocationInterests(locations: ILocation[]): AdditionalInterestsItem[] {
  let interests = locations.map((l) => {
    const addr = getFormattedAddress(l.address);
    const additionalInsureds: AdditionalInterestsItem[] = l.additionalInsureds?.map((ai) => ({
      locationAddress: addr,
      locationId: l.locationId,
      interestType: 'additional insured',
      name: ai.name,
      interestAddress: ai.address?.addressLine1 ? getFormattedAddress(ai.address) : '',
      loanNumber: '',
    }));
    const mortgagee = l.mortgageeInterest?.map((mi) => ({
      locationAddress: addr,
      locationId: l.locationId,
      interestType: 'mortgagee',
      name: mi.name,
      interestAddress: mi.address?.addressLine1 ? getFormattedAddress(mi.address) : '',
      loanNumber: mi.loanNumber || ('' as string),
    }));
    return [...additionalInsureds, ...mortgagee];
  });

  return flatten(interests);
}

export function getPremiumTable(policy: PolicyNew): PremiumTableItem[] {
  let result = [
    {
      itemTitle: 'Term Premium',
      subjectAmount: '',
      rate: '',
      value: dollarFormat2(policy.termPremium),
    },
  ];

  if (policy.fees && Array.isArray(policy.fees)) {
    for (const fee of policy.fees) {
      result.push({
        itemTitle: fee.feeName,
        subjectAmount: '',
        rate: '',
        value: dollarFormat2(fee.value),
      });
    }
  }
  if (policy.taxes && Array.isArray(policy.taxes)) {
    for (const tax of policy.taxes) {
      result.push({
        itemTitle: tax.displayName,
        subjectAmount: '',
        rate: '',
        value: dollarFormat2(tax.value),
      });
    }
  }

  result.push({
    itemTitle: 'Total price',
    subjectAmount: '',
    rate: '',
    value: dollarFormat2(policy.price),
  });

  return result;
}

/**
 * converts tiptap JSONContent to HTML, then to text (replacing tags, etc.)
 * @param content JSONContent saved from tiptap editor
 * @returns string after using html-to-text to remove html tags
 */
export function tiptapJsonToText(content: JSONContent) {
  const html = generateHTML(content, EDITOR_EXTENSION_DEFAULTS);

  return convert(html);
}
