import { AuthBlockingEvent } from 'firebase-functions/v2/identity';
import { error, info } from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/identity';
import jwt from 'jsonwebtoken';

import { sendEmailConfirmation } from '../services/sendgrid/index.js';
import { emailVerificationKey, functionsBaseURL, sendgridApiKey } from '../common/index.js';

export default async (event: AuthBlockingEvent) => {
  const user = event.data;
  // REQUIRE EMAIL VERIFICATION BEFORE CREATING ACCOUNT IF @idemandinsurance.com DOMAIN
  if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
    if (!user.emailVerified) {
      try {
        const verificationKey = emailVerificationKey.value();
        const sgKey = sendgridApiKey.value();

        await sendAdminVerificationEmail(
          verificationKey,
          sgKey,
          user.uid,
          user.email,
          user.tenantId,
          user.displayName
        );

        throw new HttpsError(
          'invalid-argument',
          `Please verify your email before proceeding (${user.email})`
        );
      } catch (err) {
        error('ERROR SENDING VERIFICATION EMAIL: ', err);
        if (err instanceof HttpsError) {
          throw err;
        }

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

async function sendAdminVerificationEmail(
  verificationKey: string,
  sgKey: string,
  uid: string,
  email: string | undefined,
  tenantId: string | null | undefined,
  displayName?: string
) {
  if (!email) throw new HttpsError('failed-precondition', 'missing email');

  const token = jwt.sign(
    {
      data: { uid, tenantId: tenantId || null, email },
    },
    verificationKey,
    { expiresIn: '10m' }
  );

  const link = `${functionsBaseURL.value()}/authRequests/verify-email/${token}`;

  info(`Verification link: ${link}`);

  await sendEmailConfirmation(sgKey, link, email, displayName || '');

  info(`iDemand admin verification email sent to ${email}`);
}
