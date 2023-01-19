import * as functions from 'firebase-functions';

export const beforeCreate = functions
  .runWith({ minInstances: 1, memory: '128MB' })
  .auth.user()
  .beforeCreate(async (user) => {
    if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
      return {
        customClaims: { iDemandAdmin: true },
      };
    }
    return {};
  });
