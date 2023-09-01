import { add } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { geohashForLocation } from 'geofire-common';
import { sumBy } from 'lodash';
import {
  AdditionalInsured,
  License,
  Mortgagee,
  POLICY_STATUS,
  PolicyLocation,
  PolicyNew,
  Quote,
  WithId,
  calcSum,
  calcTerm,
  getNewLocationId,
  verify,
} from '../../common';
import { getCarrierByState, getRCVs, validateLimits } from '../../modules/rating';
import { getFormattedAddress } from '../../utils';

export const getPolicyLocationsFromQuote = (data: Quote, policyId: string) => {
  validateLimits(data.limits);
  verify(data.coordinates, 'missing coordinates');
  verify(data.effectiveDate, 'missing effective date');
  verify(data.coordinates?.latitude && data.coordinates?.longitude, 'invalid coordinates');

  const geoHash = geohashForLocation([data.coordinates.latitude, data.coordinates.longitude]);

  const additionalInsureds = getAdditionalInsuredFromQuote(data);
  const mortgageeInterest = getMortgageeInterestFromQuote(data);

  const RCVs = getRCVs(data.ratingPropertyData.replacementCost, data.limits);

  const ts = Timestamp.now();
  // TODO: take lesser of policy exp date and location eff. + 365 for location once using multi-location
  const effDate = data.effectiveDate.toDate();
  const expirationDate = add(effDate, { years: 1 });

  const { termDays, termPremium } = calcTerm(data.annualPremium, effDate, expirationDate);

  const locationId = getNewLocationId();
  const locations: Record<string, PolicyLocation> = {
    [locationId]: {
      address: data.address,
      coordinates: data.coordinates,
      geoHash,
      annualPremium: data.annualPremium,
      termPremium: termPremium,
      termDays: termDays,
      deductible: data.deductible,
      limits: data.limits,
      TIV: calcSum(Object.values(data.limits)),
      RCVs,
      exists: true,
      additionalInsureds,
      mortgageeInterest,
      ratingDocId: data.ratingDocId || '', // TODO: validate & force ratingDocId ??
      ratingPropertyData: data.ratingPropertyData,
      effectiveDate: data.effectiveDate,
      expirationDate: Timestamp.fromDate(expirationDate),
      locationId,
      policyId,
      externalId: null,
      imageURLs: data.imageURLs || null,
      imagePaths: data.imagePaths || null,
      metadata: {
        created: ts,
        updated: ts,
      },
    },
  };
  return locations;
};

export function getAdditionalInsuredFromQuote(data: Quote): AdditionalInsured[] {
  return (
    data.additionalInterests
      ?.filter((ai) => ai.type === 'additional_named_insured' || ai.type === 'additional_insured')
      .map((additionalNI) => ({
        name: additionalNI.name,
        email: '', // additionalNI.email
        address: additionalNI.address
          ? {
              addressLine1: additionalNI.address.addressLine1,
              addressLine2: additionalNI.address.addressLine2,
              city: additionalNI.address.city,
              state: additionalNI.address.state,
              postal: additionalNI.address.postal,
            }
          : null,
      })) || []
  );
}

export function getMortgageeInterestFromQuote(data: Quote): Mortgagee[] {
  return (
    data.additionalInterests
      ?.filter((ai) => ai.type === 'mortgagee')
      .map((m) => ({
        name: m.name,
        contactName: '',
        contactEmail: '', // m.email,
        loanNumber: m.accountNumber,
        address: m.address
          ? {
              addressLine1: m.address.addressLine1,
              addressLine2: m.address.addressLine2,
              city: m.address.city,
              state: m.address.state,
              postal: m.address.postal,
            }
          : null,
      })) || []
  );
}

export function getPolicyTermPremium(locations: PolicyNew['locations']) {
  return sumBy(Object.values(locations), (l) => l.termPremium);
}

export function getPolicyFromQuote(
  data: WithId<Quote>,
  locations: Record<string, PolicyLocation>,
  license: License
) {
  verify(data.namedInsured?.firstName, 'missing named insured first name');
  verify(data.namedInsured?.lastName, 'missing named insured last name');
  // TODO: validate email/phone are valid
  verify(data.namedInsured?.email, 'missing named insured email');
  verify(data.namedInsured?.phone, 'missing named insured phone');

  verify(data.agent?.name, 'missing agent name');
  verify(data.agent?.email, 'missing agent email');
  // verify(data.agent?.phone, 'missing agent phone'); // TODO: dont validate if no field on front end
  verify(data.agency?.name, 'missing agency name');
  verify(data.agency?.address, 'missing agency address');
  verify(data.agency?.orgId, 'missing agency orgId');
  verify(data.quoteTotal, 'missing quote total');
  verify(typeof data.quoteTotal === 'number', ' quote total must be a number');

  const locationData = Object.values(locations);
  verify(locationData && locationData.length > 0, 'missing location data');
  const singleLocation = locationData[0];

  const policyLocations: PolicyNew['locations'] = {};
  for (const [id, location] of Object.entries(locations)) {
    verify(typeof location.termPremium === 'number', 'location termPremium invalid');
    policyLocations[id] = {
      termPremium: location.termPremium,
      formattedAddress: getFormattedAddress(location.address),
      coordinates: location.coordinates,
    };
  }

  const policyTermPremium = getPolicyTermPremium(policyLocations);

  const issuingCarrier = getCarrierByState(data.homeState);
  verify(issuingCarrier, 'error determining issuingCarrier');

  const policy: PolicyNew = {
    product: 'flood',
    status: POLICY_STATUS.AWAITING_PAYMENT,
    term: 1,
    mailingAddress: data.mailingAddress,
    namedInsured: {
      displayName: `${data.namedInsured?.firstName} ${data.namedInsured.lastName}`,
      firstName: data.namedInsured?.firstName,
      lastName: data.namedInsured?.lastName,
      email: data.namedInsured?.email,
      phone: data.namedInsured?.phone,
      userId: data.namedInsured?.userId || null,
    },
    locations: policyLocations,
    homeState: data.homeState,
    termPremium: policyTermPremium,
    termDays: singleLocation.termDays,
    fees: data.fees,
    taxes: data.taxes,
    price: data.quoteTotal,
    effectiveDate: singleLocation.effectiveDate,
    expirationDate: singleLocation.expirationDate,
    userId: data.userId,
    agent: {
      userId: data.agent?.userId || null,
      name: data.agent?.name,
      email: data.agent?.email,
      phone: data.agent?.phone,
    },
    agency: {
      orgId: data.agency?.orgId,
      name: data.agency?.name,
      address: data.agency?.address,
    },
    surplusLinesProducerOfRecord: {
      name: `${license.licensee} ${license.state} Surplus Lines Producer of Record License`.trim(),
      licenseNum: license.licenseNumber,
      licenseState: license.state,
      phone: license.phone ?? '+18889124320',
    },
    issuingCarrier,
    documents: [],
    quoteId: data.id,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return policy;
}
