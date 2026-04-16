import { faker } from '@faker-js/faker';
import type { Quote } from '@idemand/common';
import { add } from 'date-fns';
import { makeGeoPoint, makeMetadata, makeTimestamp, merge } from './helpers.js';

export function makeQuote(overrides: Partial<Quote> = {}): Quote {
  const effectiveDate = new Date();
  const billingEntityId = faker.string.alphanumeric(8);

  return merge<Quote>(
    {
      policyId: faker.string.alphanumeric(12),
      product: 'flood',
      status: 'draft',
      homeState: 'TX',
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
      deductible: 1000,
      limits: { limitA: 250000, limitB: 0, limitC: 100000, limitD: 0 },
      annualPremium: faker.number.int({ min: 500, max: 5000 }),
      cardFee: 0,
      fees: [],
      taxes: [],
      exclusions: [],
      additionalInterests: [],
      effectiveDate: makeTimestamp(effectiveDate),
      quotePublishedDate: makeTimestamp(effectiveDate),
      quoteExpirationDate: makeTimestamp(add(effectiveDate, { days: 30 })),
      userId: faker.string.alphanumeric(20),
      namedInsured: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: '7135550100',
      },
      mailingAddress: {
        name: faker.person.fullName(),
        addressLine1: faker.location.streetAddress(),
        addressLine2: '',
        city: faker.location.city(),
        state: 'TX',
        postal: '77001',
      },
      agent: { name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), phone: '7135550100', userId: null },
      agency: {
        name: faker.company.name(),
        orgId: faker.string.alphanumeric(10),
        stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
        address: { addressLine1: faker.location.streetAddress(), addressLine2: '', city: faker.location.city(), state: 'TX', postal: '77001' },
        photoURL: null,
      },
      carrier: {
        orgId: faker.string.alphanumeric(10),
        stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
        name: faker.company.name(),
        address: null,
        photoURL: null,
      },
      billingEntities: {
        [billingEntityId]: {
          displayName: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: '7135550100',
          billingType: 'invoice',
          selectedPaymentMethodId: null,
          paymentMethods: [],
        },
      },
      defaultBillingEntityId: billingEntityId,
      ratingDocId: faker.string.alphanumeric(20),
      ratingPropertyData: {} as Quote['ratingPropertyData'],
      imageURLs: null,
      imagePaths: null,
      commSource: 'default',
      metadata: makeMetadata(),
    },
    overrides,
  );
}
