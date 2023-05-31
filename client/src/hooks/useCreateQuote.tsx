import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { addDoc, FirestoreError, GeoPoint, getFirestore, Timestamp } from 'firebase/firestore';
import invariant from 'tiny-invariant';
import { round } from 'lodash';
import * as geofire from 'geofire-common';
import { endOfToday } from 'date-fns';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { addToDate, extractNumber, readableFirebaseCode } from 'modules/utils/helpers';
import { QUOTE_STATUS, Submission, SubmissionQuoteData, submissionsQuotesCollection } from 'common';
import { useSendQuoteNotification } from './useSendQuoteNotification';
import { useUser } from 'reactfire';
// const hash = geofire.geohashForLocation([lat, lng]);

const CARD_FEE_RATE = 0.035;

export const useCreateQuote = (
  onComplete?: () => void | Promise<void>,
  onStepSuccess?: (msg: string) => void,
  onError?: (msg: string, err: unknown) => void
) => {
  const { data: user } = useUser();
  const sendEmailNotifications = useSendQuoteNotification();

  const createQuote = useCallback(
    async (
      values: NewQuoteValues,
      submissionId: string | null = null,
      submissionData: Submission | null = null
    ) => {
      try {
        const quoteData = getFormattedQuote(values, user?.uid);

        const latitude = submissionData?.coordinates.latitude;
        const longitude = submissionData?.coordinates.longitude;
        const geoHash =
          latitude && longitude ? geofire.geohashForLocation([latitude, longitude]) : null;
        // const hash = geofir.geohashForLocation([lat, lng]);

        const quoteRef = await addDoc(submissionsQuotesCollection(getFirestore()), {
          ...quoteData,
          quoteExpirationDate: Timestamp.fromDate(addToDate({ days: 60 }, endOfToday())),
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
          geoHash,
        });

        if (onStepSuccess) onStepSuccess(`Quote created ${quoteRef.id}`);

        await sendEmailNotifications(quoteRef.id);

        if (onComplete) onComplete();
        return;
      } catch (err) {
        console.log('ERROR CREATING QUOTE', err);
        let msg = 'Error creating quote';
        if (err instanceof FirebaseError) msg += readableFirebaseCode(err as FirestoreError);
        if (onError) onError(msg, err);
      }
    },
    [onStepSuccess, onComplete, onError, sendEmailNotifications, user]
  );

  return createQuote;
};

function getFormattedQuote(
  values: NewQuoteValues,
  uid?: string | null
): Omit<SubmissionQuoteData, 'quoteExpirationDate'> {
  const {
    limitA,
    limitB,
    limitC,
    limitD,
    // replacementCost,
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
    annualPremium,
    taxes,
    fees,
    subproducerCommission,
    ratingPropertyData,
    notes,
  } = values;

  // TODO: validation
  if (!quoteTotal) throw new Error('Missing quote total');
  invariant(annualPremium, 'missing annualPremium');
  invariant(insuredEmail || agentEmail, 'Must have at least one email (insured or agent)');

  return {
    product: 'flood',
    deductible: values.deductible,
    limits: {
      limitA, // extractNumber(values.limitA),
      limitB, // extractNumber(values.limitB) || 0,
      limitC, // extractNumber(values.limitC) || 0,
      limitD, // extractNumber(values.limitD) || 0,
    },
    // replacementCost:
    //   typeof replacementCost === 'string' ? extractNumber(replacementCost) : replacementCost,
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
    // additionalInsureds: [],
    // mortgageeInterest: [],
    additionalInterests: [],
    annualPremium,
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
    notes:
      notes && notes.length > 0
        ? notes
            .filter((n) => n.note)
            .map((n) => ({ note: n.note, created: Timestamp.now(), userId: uid || null }))
        : [],
    status: QUOTE_STATUS.AWAITING_USER,
    ratingPropertyData: {
      CBRSDesignation: ratingPropertyData.CBRSDesignation,
      basement: ratingPropertyData.basement,
      distToCoastFeet: extractNumber(`${ratingPropertyData.distToCoastFeet}`),
      floodZone: ratingPropertyData.floodZone,
      numStories: ratingPropertyData.numStories,
      propertyCode: ratingPropertyData.propertyCode,
      replacementCost: ratingPropertyData.replacementCost,
      sqFootage: extractNumber(`${ratingPropertyData.sqFootage}`),
      yearBuilt: extractNumber(`${ratingPropertyData.yearBuilt}`),
    },
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
