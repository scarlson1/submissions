import { error, info } from 'firebase-functions/logger';
import { AuthBlockingEvent, HttpsError } from 'firebase-functions/v2/identity';
import jwt from 'jsonwebtoken';

import {
  emailVerificationKey,
  functionsBaseURL,
  mgaDomain,
  resendKey,
} from '../common/index.js';
import {
  sendEmailConfirmation,
  type ExtraSendGridArgs,
} from '../services/sendgrid/index.js';

// TODO: consider using auth event to update DB user email ??
// https://stackoverflow.com/a/47933914/10887890

export default async (event: AuthBlockingEvent) => {
  const user = event.data;
  // REQUIRE EMAIL VERIFICATION BEFORE CREATING ACCOUNT IF @idemandinsurance.com DOMAIN
  if (user.email && user.email?.toLowerCase().endsWith(mgaDomain.value())) {
    if (!user.emailVerified) {
      try {
        const verificationKey = emailVerificationKey.value();
        const key = resendKey.value();

        await sendAdminVerificationEmail(
          verificationKey,
          key,
          user.uid,
          user.email,
          user.tenantId,
          user.displayName,
          // TODO: switch to resend templates ?? need to update admin email grid to use resend
          // {
          //   customArgs: {
          //     firebaseEventId: event.eventId,
          //     emailType: 'email_verification',
          //     // projectId: projectID.value(),
          //     // environment: env.value(),
          //   },
          // },
        );

        throw new HttpsError(
          'invalid-argument',
          `Please verify your email before proceeding (${user.email})`,
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
  displayName?: string,
  sgArgs?: ExtraSendGridArgs,
) {
  if (!email) throw new HttpsError('failed-precondition', 'missing email');

  const token = jwt.sign(
    {
      data: { uid, tenantId: tenantId || null, email },
    },
    verificationKey,
    { expiresIn: '10m' },
  );

  // TODO: use hosting rewrites so v2 functions can be used
  // ie: const link = `${hostingBaseURL.value}/auth-api/confirm-move-tenant/${token}`
  const link = `${functionsBaseURL.value()}/authRequests/verify-email/${token}`;

  info(`Verification link: ${link}`);

  await sendEmailConfirmation(sgKey, link, email, displayName || '', sgArgs);

  info(`iDemand admin verification email sent to ${email}`);
}
