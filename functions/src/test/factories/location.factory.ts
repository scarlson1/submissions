import { faker } from '@faker-js/faker';
import type { ILocation } from '@idemand/common';
import { add } from 'date-fns';
import { makeGeoPoint, makeMetadata, makeTimestamp, merge } from './helpers.js';

export function makeLocation(overrides: Partial<ILocation> = {}): ILocation {
  const effectiveDate = new Date();

  return merge<ILocation>(
    {
      parentType: 'policy',
      locationId: faker.string.alphanumeric(12),
      policyId: faker.string.alphanumeric(12),
      quoteId: null,
      submissionId: null,
      externalId: null,
      address: {
        addressLine1: faker.location.streetAddress(),
        addressLine2: '',
        city: faker.location.city(),
        state: 'TX',
        postal: '77001',
      },
      coordinates: makeGeoPoint(
        faker.location.latitude({ min: 25, max: 32 }),
        faker.location.longitude({ min: -106, max: -93 }),
      ),
      geoHash: faker.string.alphanumeric(10),
      annualPremium: faker.number.int({ min: 500, max: 5000 }),
      termPremium: faker.number.int({ min: 500, max: 5000 }),
      termDays: 365,
      limits: { limitA: 250000, limitB: 0, limitC: 100000, limitD: 0 },
      TIV: 350000,
      RCVs: { building: 250000, otherStructures: 0, contents: 100000, BI: 0, total: 350000 },
      deductible: 1000,
      additionalInsureds: [],
      mortgageeInterest: [],
      ratingDocId: faker.string.alphanumeric(20),
      ratingPropertyData: {} as ILocation['ratingPropertyData'],
      effectiveDate: makeTimestamp(effectiveDate),
      expirationDate: makeTimestamp(add(effectiveDate, { years: 1 })),
      cancelEffDate: null,
      cancelReason: null,
      imageURLs: null,
      imagePaths: null,
      blurHash: null,
      metadata: makeMetadata(),
    },
    overrides,
  );
}
