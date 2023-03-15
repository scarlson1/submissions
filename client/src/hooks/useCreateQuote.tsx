import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { addDoc, FirestoreError, GeoPoint, Timestamp } from 'firebase/firestore';
import invariant from 'tiny-invariant';
import { round } from 'lodash';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { extractNumber, readableFirebaseCode } from 'modules/utils/helpers';
import {
  QUOTE_STATUS,
  Submission,
  SubmissionQuoteData,
  submissionsQuotesCollection,
  WithId,
} from 'common';
import { useSendQuoteNotification } from './useSendQuoteNotification';

const CARD_FEE_RATE = 0.035;

export const useCreateQuote = (
  onComplete?: () => void | Promise<void>,
  onStepSuccess?: (msg: string) => void,
  onError?: (err: unknown, msg: string) => void
) => {
  const sendEmailNotifications = useSendQuoteNotification();

  const createQuote = useCallback(
    async (
      values: NewQuoteValues,
      submissionId: string | null = null,
      submissionData: WithId<Submission>
    ) => {
      try {
        const quoteData = getFormattedQuote(values);

        const quoteRef = await addDoc(submissionsQuotesCollection, {
          ...quoteData,
          submissionId,
          imageUrls: {
            darkMapImageUrl: submissionData?.darkMapImageURL || null,
            lightMapImageUrl: submissionData?.lightMapImageURL || null,
            satelliteMapImageUrl: submissionData?.satelliteMapImageURL || null,
            satelliteStreetsMapImageUrl: submissionData?.satelliteStreetsMapImageURL || null,
          },
          imagePaths: {
            darkMapImageFilePath: submissionData?.darkMapImageFilePath || null,
            lightMapImageFilePath: submissionData?.lightMapImageFilePath || null,
            satelliteMapImageFilePath: submissionData?.satelliteMapImageFilePath || null,
            satelliteStreetsMapImageFilePath:
              submissionData?.satelliteStreetsMapImageFilePath || null,
          },
        });

        if (onStepSuccess) onStepSuccess(`Quote created ${quoteRef.id}`);

        await sendEmailNotifications(quoteRef.id);

        if (onComplete) onComplete();
        return;
      } catch (err) {
        console.log('ERROR CREATING QUOTE', err);
        let msg = 'Error creating quote';
        if (err instanceof FirebaseError) msg += readableFirebaseCode(err as FirestoreError);
        if (onError) onError(err, msg);
      }
    },
    [onStepSuccess, onComplete, onError, sendEmailNotifications]
  );

  return createQuote;
};

function getFormattedQuote(values: NewQuoteValues): SubmissionQuoteData {
  const {
    limitA,
    limitB,
    limitC,
    limitD,
    replacementCost,
    latitude,
    longitude,
    quoteExpiration,
    policyEffectiveDate,
    policyExpirationDate,
    insuredFirstName,
    insuredLastName,
    insuredEmail,
    insuredPhone,
    agentId,
    agentName,
    agentEmail,
    agentPhone,
    agencyName,
    agencyId,
    quoteTotal,
    termPremium,
    taxes,
    fees,
    subproducerCommission,
  } = values;

  // TODO: validation
  if (!quoteTotal) throw new Error('Missing quote total');
  invariant(termPremium, 'missing termPremium');
  invariant(insuredEmail || agentEmail, 'Must have atleast one email (insured or agent)');

  return {
    product: 'flood',
    deductible: values.deductible,
    limits: {
      limitA, // extractNumber(values.limitA),
      limitB, // extractNumber(values.limitB) || 0,
      limitC, // extractNumber(values.limitC) || 0,
      limitD, // extractNumber(values.limitD) || 0,
    },
    replacementCost:
      typeof replacementCost === 'string' ? extractNumber(replacementCost) : replacementCost,
    insuredAddress: {
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      state: values.state,
      postal: values.postal,
    },
    insuredCoordinates: longitude && latitude ? new GeoPoint(latitude, longitude) : null,
    quoteExpiration: Timestamp.fromDate(quoteExpiration),
    policyEffectiveDate: Timestamp.fromDate(policyEffectiveDate),
    policyExpirationDate: Timestamp.fromDate(policyExpirationDate),
    exclusions: [],
    additionalInsureds: [],
    mortgageeInterest: [],
    termPremium,
    fees,
    taxes,
    subproducerCommission,
    cardFee: round(quoteTotal * CARD_FEE_RATE, 2),
    quoteTotal, // calculate on server ??
    userId: null,
    insuredFirstName: insuredFirstName ?? null,
    insuredLastName: insuredLastName ?? null,
    insuredEmail: insuredEmail ?? null,
    insuredPhone: insuredPhone ?? null,
    agentId: agentId ?? null,
    agentName: agentName ?? null,
    agentEmail: agentEmail ?? null,
    agentPhone: agentPhone ?? null,
    agencyId: agencyId ?? null,
    agencyName: agencyName ?? null,
    status: QUOTE_STATUS.AWAITING_USER,
    statusTransitions: {
      published: Timestamp.now(),
      accepted: null,
      cancelled: null,
      finalized: null,
    },
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
      version: 1,
    },
  };
}
