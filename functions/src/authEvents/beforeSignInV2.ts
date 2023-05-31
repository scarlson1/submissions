import { AuthBlockingEvent } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/identity';
import jwt from 'jsonwebtoken';

import { sendEmailConfirmation } from '../services/sendgrid/index.js';
import { emailVerificationKey } from '../common';

export default async (event: AuthBlockingEvent) => {
  const user = event.data;
  // REQUIRE EMAIL VERIFICATION BEFORE CREATING ACCOUNT IF @idemandinsurance.com DOMAIN
  if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
    if (!user.emailVerified) {
      try {
        const verificationKey = emailVerificationKey.value();
        // if (!verificationKey) throw new HttpsError('internal', 'Missing environment variable');

        const token = jwt.sign(
          {
            data: { uid: user.uid, tenantId: user.tenantId, email: user.email },
          },
          verificationKey,
          { expiresIn: '10m' }
        );

        const link = `${process.env.FUNCTIONS_BASE_URL}/authRequests/verify-email/${token}`;
        console.log('Verification link: ', link);

        await sendEmailConfirmation(
          process.env.SENDGRID_API_KEY || '',
          link,
          user.email,
          user.displayName || ''
        );

        console.log(`iDemand admin verification email sent to ${user.email}`);
        throw new HttpsError(
          'invalid-argument',
          `Please verify your email before proceeding (${user.email})`
        );
      } catch (err) {
        if (err instanceof HttpsError) {
          throw err;
        }
        console.log('ERROR SENDING VERIFICATION EMAIL: ', err);
        throw new HttpsError('internal', 'Error sending verification email.');
      }
    }
  }

  // TODO: create login doc under user/userId/authHistory ??

  return {
    sessionClaims: {
      signInIpAddress: event.ipAddress,
    },
  };
};
