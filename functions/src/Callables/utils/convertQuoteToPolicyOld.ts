import { add } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { geohashForLocation } from 'geofire-common';
import { sum, sumBy } from 'lodash-es';

import { ILocation, License, POLICY_STATUS, Policy, Quote } from '../../common/index.js';
import { createDocId } from '../../modules/db/utils.js';
import { getCarrierByState, getRCVs, validateLimits } from '../../modules/rating/index.js';
import { calcTerm } from '../../modules/transactions/utils.js';
import { separateAdditionalInterests, verify } from '../../utils/index.js';

// TODO: update to handle multiple locations once Quote interface / process is updated
// TODO: move validation outside function and wrap Quote in NonNullable<Quote>
export function convertQuoteToPolicyOld(
  data: Quote,
  license: License,
  quoteId: string | null
): Policy {
  validateLimits(data.limits);
  verify(data.coordinates, 'missing coordinates');
  verify(data.effectiveDate, 'missing effective date');
  // verify(data.expirationDate, 'missing expiration date');
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
  // TODO: more rigid quote total validation

  const geoHash = geohashForLocation([data.coordinates.latitude, data.coordinates.longitude]);

  const { additionalInsureds, mortgageeInterest } = separateAdditionalInterests(
    data.additionalInterests || []
  );

  // TODO: need to get rating doc to store RCVs ?? why store ?? not needed on front end ?? does it save rating doc db read on transactions ??
  let RCVs = getRCVs(data.ratingPropertyData.replacementCost, data.limits);
  // RCVs.total

  const ts = Timestamp.now();
  // TODO: take lesser of policy exp date and location eff. + 365 for location once using multi-location
  const effDate = data.effectiveDate.toDate();
  const expirationDate = add(effDate, { years: 1 });

  //TODO: calc term permium separetely for policy once using multi-location
  const { termDays, termPremium } = calcTerm(data.annualPremium, effDate, expirationDate);

  // TODO: use location ID from quote once using updated Quote interface
  const locationId = createDocId();
  const locations: Record<string, ILocation> = {
    [locationId]: {
      address: data.address,
      coordinates: data.coordinates,
      geoHash,
      annualPremium: data.annualPremium,
      termPremium: termPremium,
      termDays: termDays,
      deductible: data.deductible,
      limits: data.limits,
      TIV: sum(Object.values(data.limits)),
      RCVs,
      // exists: true,
      additionalInsureds,
      mortgageeInterest,
      ratingDocId: data.ratingDocId || '', // TODO: validate & force ratingDocId ??
      ratingPropertyData: data.ratingPropertyData,
      effectiveDate: data.effectiveDate,
      expirationDate: Timestamp.fromDate(expirationDate),
      policyId: '',
      locationId,
      externalId: null,
      imageURLs: data.imageURLs || null,
      imagePaths: data.imagePaths || null,
      metadata: {
        created: ts,
        updated: ts,
      },
    },
  };

  // TODO: use Policy class to initialize new policy, move calculations to methods
  const policyTermPremium = sumBy(Object.values(locations), (l) => l.termPremium);

  const policy: Policy = {
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
    locations,
    homeState: data.homeState,
    termPremium: policyTermPremium,
    termDays,
    fees: data.fees,
    taxes: data.taxes,
    price: data.quoteTotal,
    effectiveDate: data.effectiveDate,
    expirationDate: Timestamp.fromDate(expirationDate),
    userId: data.userId,
    // data.agent,
    agent: {
      userId: (data.agent?.userId || null) as string,
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
    issuingCarrier: getCarrierByState(data.homeState),
    documents: [],
    quoteId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return policy;
}
