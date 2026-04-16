import { faker } from '@faker-js/faker';
import type { Organization } from '@idemand/common';
import { makeGeoPoint, makeMetadata, merge } from './helpers.js';

export function makeOrganization(overrides: Partial<Organization> = {}): Organization {
  return merge<Organization>(
    {
      type: 'agency',
      orgId: faker.string.alphanumeric(10),
      orgName: faker.company.name(),
      tenantId: null,
      stripeAccountId: null,
      status: 'active',
      defaultCommission: { flood: 0.15, wind: 0.15 },
      authProviders: ['password'],
      address: {
        addressLine1: faker.location.streetAddress(),
        addressLine2: '',
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        postal: faker.location.zipCode('#####'),
      },
      coordinates: makeGeoPoint(
        faker.location.latitude(),
        faker.location.longitude(),
      ),
      metadata: makeMetadata(),
    },
    overrides,
  );
}
