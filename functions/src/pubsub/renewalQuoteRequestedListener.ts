import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { ILocation, Policy, Quote, RenewalStatus, WithId } from '@idemand/common';
import {
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  quotesCollection,
} from '../common/index.js';
import { createDocId, getAllById } from '../modules/db/index.js';
import { fetchPolicyData } from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';
import { extractPubSubPayload } from './utils/extractPubSubPayload.js';

const reportErr = getReportErrorFn('renewalQuoteRequestedListener');

export interface RenewalRequestedPayload {
  policyId: string;
}

/**
 * Listens for `policy.renewal.requested` PubSub messages.
 *
 * Creates a draft renewal Quote from the expiring policy, then updates the
 * policy with the new renewalQuoteId and status='quoted'. The quote starts
 * as draft — an admin must review, optionally adjust pricing, and publish
 * (set status='awaiting:user') before the insured is notified.
 *
 * Idempotent: if the policy already has a renewalQuoteId the message is a no-op.
 */
export default async (event: CloudEvent<MessagePublishedData<RenewalRequestedPayload>>) => {
  info('RENEWAL QUOTE REQUESTED EVENT', { ...(event.data?.message?.json || {}) });

  const { policyId } = extractPubSubPayload(event, ['policyId']);

  const db = getFirestore();
  const policiesCol = policiesCollection(db);
  const quotesCol = quotesCollection(db);
  const locationsCol = locationsCollection(db);

  let policy: WithId<Policy>;

  try {
    verify(policyId && typeof policyId === 'string', 'invalid/missing policyId');

    const policyData = await fetchPolicyData(db, policyId);
    verify(policyData, `Policy not found (${policyId})`);
    policy = { ...policyData, id: policyId };

    // Idempotency: skip if renewal quote already exists
    if (policy.renewalQuoteId) {
      warn(`RENEWAL QUOTE REQUESTED: policy ${policyId} already has renewalQuoteId ${policy.renewalQuoteId}. Skipping.`);
      return;
    }

    // Skip cancelled or already-lapsed policies
    if (policy.cancelEffDate || policy.renewalStatus === 'lapsed' || policy.renewalStatus === 'non_renewed') {
      warn(`RENEWAL QUOTE REQUESTED: policy ${policyId} is not eligible for renewal (cancelEffDate=${policy.cancelEffDate}, renewalStatus=${policy.renewalStatus}). Skipping.`);
      return;
    }
  } catch (err: any) {
    reportErr(err?.message || 'Error validating policy', { policyId }, err);
    return;
  }

  // ── Fetch primary location document ────────────────────────────────────────
  // The renewal quote is built around the first non-cancelled location.
  // Additional locations are handled via the existing add-location flow post-renewal.

  let primaryLocation: WithId<ILocation> | null = null;

  try {
    const locationIds = Object.entries(policy.locations)
      .filter(([, lcn]) => !lcn.cancelEffDate)
      .map(([id]) => id);

    verify(locationIds.length, `No active locations found on policy ${policyId}`);

    const locationSnaps = await getAllById(locationsCol, locationIds);
    const locations = locationSnaps.docs
      .filter((s) => s.exists)
      .map((s) => ({ ...s.data(), id: s.id }));

    verify(locations.length, `No location documents found for policy ${policyId}`);
    primaryLocation = locations[0];
  } catch (err: any) {
    reportErr(err?.message || 'Error fetching location documents', { policyId }, err);
    return;
  }

  // ── Build the renewal Quote document ───────────────────────────────────────

  try {
    const renewalQuoteId = createDocId(20);
    const renewalPolicyId = `ID${createDocId(8)}`;

    // Renewal term dates: new effective = prior policy's expiration
    const newEffectiveDate = policy.expirationDate;
    // Quote must be acted on before the prior policy expires — same deadline
    const quoteExpirationDate = policy.expirationDate;

    const now = Timestamp.now();

    const renewalQuote: Quote = {
      policyId: renewalPolicyId,
      product: policy.product,
      // Location-derived fields from primary location document
      address: primaryLocation.address,
      coordinates: primaryLocation.coordinates,
      deductible: primaryLocation.deductible,
      limits: primaryLocation.limits,
      annualPremium: primaryLocation.annualPremium,
      ratingDocId: primaryLocation.ratingDocId,
      ratingPropertyData: primaryLocation.ratingPropertyData,
      // Policy-level fields
      homeState: policy.homeState,
      fees: policy.fees,
      taxes: policy.taxes,
      cardFee: 0,
      quoteTotal: policy.price,
      effectiveDate: newEffectiveDate,
      quotePublishedDate: now,
      quoteExpirationDate,
      exclusions: [],
      additionalInterests: [],
      userId: policy.userId,
      namedInsured: policy.namedInsured,
      mailingAddress: policy.mailingAddress,
      agent: policy.agent,
      agency: policy.agency,
      carrier: policy.carrier,
      billingEntities: policy.billingEntities,
      defaultBillingEntityId: policy.defaultBillingEntityId,
      status: 'draft',
      submissionId: null,
      imageURLs: policy.imageURLs ?? null,
      imagePaths: policy.imagePaths ?? null,
      geoHash: primaryLocation.geoHash ?? null,
      notes: [],
      externalId: policy.externalId ?? null,
      commSource: policy.commSource,
      // Renewal-specific fields
      isRenewal: true,
      priorPolicyId: policyId,
      metadata: { created: now, updated: now },
    };

    const batch = db.batch();

    // Create the renewal quote document
    batch.set(quotesCol.doc(renewalQuoteId), renewalQuote);

    // Update the policy with the new renewal quote reference
    batch.update(policiesCol.doc(policyId), {
      renewalStatus: 'quoted' as RenewalStatus,
      renewalQuoteId,
      'renewalNotifications.sent60': now,
      'metadata.updated': now,
    });

    await batch.commit();

    info(`RENEWAL QUOTE REQUESTED: Created draft renewal quote ${renewalQuoteId} for policy ${policyId}`);
  } catch (err: any) {
    reportErr('Error creating renewal quote', { policyId }, err);
  }
};
