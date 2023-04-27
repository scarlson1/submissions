import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError } from 'firebase-functions/v1/auth';
import jwt from 'jsonwebtoken';

import { sendEmailConfirmation } from '../services/sendgrid/index.js';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
const emailVerificationKey = defineSecret('EMAIL_VERIFICATION_KEY');

export const beforeSignIn = functions
  .runWith({ secrets: [sendgridApiKey, emailVerificationKey], minInstances: 1, memory: '128MB' })
  .auth.user()
  .beforeSignIn(async (user, context) => {
    // REQUIRE EMAIL VERIFICATION BEFORE CREATING ACCOUNT IF @idemandinsurance.com DOMAIN
    if (user.email && user.email?.toLowerCase().endsWith('@idemandinsurance.com')) {
      if (!user.emailVerified) {
        try {
          if (!process.env.EMAIL_VERIFICATION_KEY)
            throw new functions.auth.HttpsError('internal', 'Missing environment variable');

          const token = jwt.sign(
            {
              data: { uid: user.uid, tenantId: user.tenantId, email: user.email },
            },
            process.env.EMAIL_VERIFICATION_KEY,
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
          throw new functions.auth.HttpsError(
            'invalid-argument',
            `Please verify your email before proceeding (${user.email})`
          );
        } catch (err) {
          if (err instanceof HttpsError) {
            throw err;
          }
          console.log('ERROR SENDING VERIFICATION EMAIL: ', err);
          throw new functions.auth.HttpsError('internal', 'Error sending verification email.');
        }
      }
    }

    // TODO: create login doc under user/userId/authHistory ??

    return {
      sessionClaims: {
        signInIpAddress: context.ipAddress,
      },
    };
  });
