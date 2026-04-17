import { faker } from '@faker-js/faker';
import type { User } from '@idemand/common';
import { makeMetadata, merge } from './helpers.js';

export function makeUser(overrides: Partial<User> = {}): User {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return merge<User>(
    {
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.string.numeric(10),
      photoURL: null,
      // stripe_customer_id: `cus_${faker.string.alphanumeric(14)}`,
      tenantId: null,
      orgId: null,
      orgName: null,
      initialAnonymous: false,
      metadata: makeMetadata(),
    },
    overrides,
  );
}
