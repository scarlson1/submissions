import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { addDoc, FirestoreError, GeoPoint, Timestamp } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire'; // useUser
import invariant from 'tiny-invariant';
import { round } from 'lodash';
import * as geofire from 'geofire-common';
import { endOfToday } from 'date-fns';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { addToDate, extractNumber, readableFirebaseCode } from 'modules/utils/helpers';
import { QUOTE_STATUS, Submission, Quote, submissionsQuotesCollection } from 'common';
import { useSendQuoteNotification } from './useSendQuoteNotification';
import { CUSTOM_CLAIMS } from 'modules/components';

const CARD_FEE_RATE = 0.035;

export const useCreateQuote = (
  onComplete?: () => void | Promise<void>,
  onStepSuccess?: (msg: string) => void,
  onError?: (msg: string, err: unknown) => void
) => {
  const firestore = useFirestore();
  const { data: signInCheckResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });
  const sendEmailNotifications = useSendQuoteNotification();

  const createQuote = useCallback(
    async (
      values: NewQuoteValues,
      submissionId: string | null = null,
      submissionData: Submission | null = null
    ) => {
      if (!signInCheckResult.hasRequiredClaims) throw new Error('Missing required permissions');

      try {
        const quoteData = getFormattedQuote(values, signInCheckResult.user?.uid);

        const latitude = submissionData?.coordinates?.latitude;
        const longitude = submissionData?.coordinates?.longitude;
        const geoHash =
          latitude && longitude ? geofire.geohashForLocation([latitude, longitude]) : null;

        const quoteRef = await addDoc(submissionsQuotesCollection(firestore), {
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
          geoHash,
        });

        if (onStepSuccess) onStepSuccess(`Quote created ${quoteRef.id}`);

        await sendEmailNotifications(quoteRef.id);

        if (onComplete) onComplete();
        return;
      } catch (err: any) {
        console.log('ERROR CREATING QUOTE', err);
        let msg = 'Error creating quote';

        if (err instanceof FirebaseError) {
          msg += readableFirebaseCode(err as FirestoreError);
        } else if (err?.message) msg = err.message;

        if (onError) onError(msg, err);
      }
    },
    [firestore, onStepSuccess, onComplete, onError, sendEmailNotifications, signInCheckResult]
  );

  return createQuote;
};

function getFormattedQuote(values: NewQuoteValues, uid?: string | null): Quote {
  // ): Omit<Quote, 'quoteExpirationDate'> {
  const {
    address,
    limits,
    coordinates,
    quoteExpirationDate,
    policyEffectiveDate,
    policyExpirationDate,
    namedInsured,
    agent,
    agency,
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
  invariant(namedInsured?.email || agent?.email, 'Must have at least one email (insured or agent)');

  return {
    product: 'flood', // TODO: pass as prop
    deductible: values.deductible,
    limits: {
      limitA: limits.limitA, // extractNumber(values.limitA),
      limitB: limits.limitA, // extractNumber(values.limitB) || 0,
      limitC: limits.limitA, // extractNumber(values.limitC) || 0,
      limitD: limits.limitA, // extractNumber(values.limitD) || 0,
    },
    // replacementCost:
    //   typeof replacementCost === 'string' ? extractNumber(replacementCost) : replacementCost,
    // insuredAddress: {
    //   addressLine1: values.addressLine1,
    //   addressLine2: values.addressLine2,
    //   city: values.city,
    //   state: values.state,
    //   postal: values.postal,
    // },
    address,
    coordinates:
      coordinates.longitude && coordinates.latitude
        ? new GeoPoint(coordinates.latitude, coordinates.longitude)
        : null,
    mailingAddress: {
      // TODO: add mailing address and name fields
      name: '',
      ...address,
    },
    // quoteExpiration: Timestamp.fromDate(quoteExpiration),
    quoteExpirationDate: quoteExpirationDate
      ? Timestamp.fromDate(quoteExpirationDate)
      : Timestamp.fromDate(addToDate({ days: 60 }, endOfToday())),
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
    userId: namedInsured.userId || null,
    namedInsured,
    agent: agent,
    agency: {
      orgId: agency.orgId || null,
      name: agency.name || null,
      address: agency.address || null,
    },
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
