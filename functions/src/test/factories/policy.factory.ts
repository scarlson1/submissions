import { faker } from '@faker-js/faker';
import type { Policy } from '@idemand/common';
import { add } from 'date-fns';
import { makeGeoPoint, makeMetadata, makeTimestamp, merge } from './helpers.js';

export function makePolicy(overrides: Partial<Policy> = {}): Policy {
  const effectiveDate = new Date();
  const expirationDate = add(effectiveDate, { years: 1 });
  const billingEntityId = faker.string.alphanumeric(8);
  const locationId = faker.string.alphanumeric(12);

  return merge<Policy>(
    {
      product: 'flood',
      paymentStatus: 'awaiting_payment',
      term: 365,
      termDays: 365,
      homeState: 'TX',
      termPremium: faker.number.int({ min: 500, max: 5000 }),
      termPremiumWithCancels: faker.number.int({ min: 500, max: 5000 }),
      inStatePremium: faker.number.int({ min: 500, max: 5000 }),
      outStatePremium: 0,
      price: faker.number.int({ min: 500, max: 5000 }),
      fees: [],
      taxes: [],
      namedInsured: {
        displayName: faker.person.fullName(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: '7135550100',
        userId: null,
        orgId: null,
        photoURL: null,
      },
      mailingAddress: {
        name: faker.person.fullName(),
        addressLine1: faker.location.streetAddress(),
        addressLine2: '',
        city: faker.location.city(),
        state: 'TX',
        postal: '77001',
      },
      locations: {
        [locationId]: {
          termPremium: faker.number.int({ min: 500, max: 5000 }),
          annualPremium: faker.number.int({ min: 500, max: 5000 }),
          address: { s1: faker.location.streetAddress(), s2: '', c: faker.location.city(), st: 'TX', p: '77001' },
          coords: makeGeoPoint(),
          billingEntityId,
          cancelEffDate: null,
          version: 1,
        },
      },
      effectiveDate: makeTimestamp(effectiveDate),
      expirationDate: makeTimestamp(expirationDate),
      cancelEffDate: null,
      cancelReason: null,
      userId: faker.string.alphanumeric(20),
      agent: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: '7135550100',
        userId: null,
      },
      agency: {
        name: faker.company.name(),
        orgId: faker.string.alphanumeric(10),
        stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
        address: {
          addressLine1: faker.location.streetAddress(),
          addressLine2: '',
          city: faker.location.city(),
          state: 'TX',
          postal: '77001',
        },
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
      totalsByBillingEntity: {
        [billingEntityId]: {
          termPremium: faker.number.int({ min: 500, max: 5000 }),
          taxes: [],
          fees: [],
          price: faker.number.int({ min: 500, max: 5000 }),
        },
      },
      surplusLinesProducerOfRecord: {
        name: faker.person.fullName(),
        licenseNum: faker.string.alphanumeric(8),
        licenseState: 'TX',
        phone: null,
      },
      issuingCarrier: faker.company.name(),
      carrier: {
        orgId: faker.string.alphanumeric(10),
        stripeAccountId: `acct_${faker.string.alphanumeric(16)}`,
        name: faker.company.name(),
        address: null,
        photoURL: null,
      },
      commSource: 'default',
      documents: [],
      metadata: makeMetadata(),
    },
    overrides,
  );
}
