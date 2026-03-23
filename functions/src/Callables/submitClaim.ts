import { EmailData } from '@sendgrid/helpers/classes/email-address.js';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import {
  audience,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  policyClaimsCollection,
  resendKey,
} from '../common/index.js';
import {
  sendClaimSubmitted,
  SendClaimSubmittedProps,
} from '../services/sendgrid/actions/sendClaimSubmitted.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

const reportErr = getReportErrorFn('submitClaim');

interface SubmitClaimProps {
  policyId: string;
  claimId: string;
}

const submitClaim = async ({
  data,
  auth,
}: CallableRequest<SubmitClaimProps>) => {
  const { policyId, claimId } = data;

  requireAuth(auth);
  validate(policyId, 'failed-precondition', 'policy ID required');
  validate(claimId, 'failed-precondition', 'claimId required');

  const { uid, token } = auth;

  try {
    const db = getFirestore();
    const policyRef = policiesCollection(db).doc(policyId);
    const claimRef = policyClaimsCollection(db, policyId).doc(claimId);

    const [policySnap, claimSnap] = await db.getAll(policyRef, claimRef);
    const policy = policySnap.data();
    const claim = claimSnap.data();
    validate(
      policySnap.exists && policy,
      'not-found',
      `policy not found (${policyId})`,
    );
    validate(
      claimSnap.exists && claim,
      'not-found',
      `Claim ${claimId} does not exist under policy ${policyId}`,
    );
    validate(
      claim.status === 'draft',
      'failed-precondition',
      'Invalid claim status. Please create a new claim.',
    );
    validate(
      claim.locationId,
      'failed-precondition',
      'claim missing locationId',
    );

    const locationSnap = await locationsCollection(db)
      .doc(claim.locationId)
      .get();
    const location = locationSnap.data();
    validate(
      locationSnap.exists && location,
      'not-found',
      `location not found ${claim.locationId}`,
    );

    // TODO: use zod to validate draft claim
    // if (!DraftPolicyClaim.safeParse(claim).success) {...}

    // TODO: wrap notifications and updating status in transaction ??
    const orgId =
      token.firebase.tenant ??
      (token.email?.endsWith('@idemandinsurance.com') || null);
    await claimRef.update({
      status: 'submitted',
      submittedBy: {
        userId: uid,
        email: token.email || null,
        orgId,
      },
      namedInsured: policy.namedInsured,
      agent: policy.agent,
      agency: policy.agency,
      submittedAt: Timestamp.now(),
      address: location.address,
      coordinates: location.coordinates,
      limits: location.limits,
      locationData: location,
      policyData: policy,
      'metadata.updated': Timestamp.now(),
    });

    // handle notifications in pubsub ??
    // TODO: send admin notification
    // TODO: send confirmation email to insured, agent, contact
    // TODO: send claim to alacrity (promise all)

    // TODO: fix typing once claim type is complete
    const to: EmailData[] = [];
    if (claim.contact?.email) to.push(claim.contact?.email);

    try {
      const insuredNotificationPromise = sendClaimSubmitted(resendKey.value(), {
        to,
        templateId: 'claim_submitted',
        policyId: policyId as string,
        claimId: claimId as string,
        locationId: claim.locationId as string,
        externalId: claim.externalId as string,
        // contact: claim.contact
        contact: { ...claim.contact } as SendClaimSubmittedProps['contact'],
      });
      // TODO: pull idemand to emails up to function or integrating into sendgrid flow
      const adminTo: EmailData[] = ['spencercarlson@idemandinsurance.com'];
      if (audience.value() !== 'PROD HUMANS')
        adminTo.push('noreply@s-carlson.com');

      const adminNotificationPromise = sendClaimSubmitted(resendKey.value(), {
        to: adminTo,
        templateId: 'claim_submitted',
        policyId: policyId as string,
        claimId: claimId as string,
        locationId: claim.locationId as string,
        externalId: claim.externalId as string,
        // contact: claim.contact
        contact: { ...claim.contact } as SendClaimSubmittedProps['contact'],
      });
      await Promise.all([insuredNotificationPromise, adminNotificationPromise]);
    } catch (err: any) {
      reportErr('error sending email notifications', data, err);
    }

    return { message: 'TODO', status: 'success' };
  } catch (err: any) {
    reportErr(err?.message || 'error submitting claim', { data }, err);
    if (err instanceof HttpsError) throw err;

    throw new HttpsError('internal', 'An error occurred');
  }
};

export default onCallWrapper<SubmitClaimProps>('submitClaim', submitClaim);
