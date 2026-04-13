import { endOfToday, isValid, startOfDay } from 'date-fns';
import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  FirestoreError,
  GeoPoint,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { isEmpty, round } from 'lodash';
import { useCallback } from 'react';
import { useFirestore, useSigninCheck } from 'reactfire';
import invariant from 'tiny-invariant';

import type {
  Basement,
  FloodZone,
  Quote,
  State,
  TaxItem,
} from '@idemand/common';
import {
  CLAIMS,
  licensesCollection,
  QUOTE_STATUS,
  quotesCollection,
  Submission,
} from 'common';
import type { QuoteValues } from 'elements/forms';
import { createDocId } from 'modules/db/utils';
import {
  addToDate,
  extractNumber,
  getGeoHash,
  readableFirebaseCode,
} from 'modules/utils/helpers';
import { useSendQuoteNotification } from './useSendQuoteNotification';

// TODO: create policy ID with quote --> save payment billing details as subcollection ??
// or just save billing entities with policy ??
// protection against double policy creation

export const CARD_FEE_RATE = 0.035;

export const useCreateQuote = (
  onComplete?: () => void | Promise<void>,
  onStepSuccess?: (msg: string) => void, // TODO: pass quoteId instead of string
  onError?: (msg: string, err: unknown) => void,
) => {
  const firestore = useFirestore();
  const { data: signInCheckResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });
  const sendEmailNotifications = useSendQuoteNotification();

  // TODO: move to hook ??
  const getSLLicense = useCallback(
    async (state: string) => {
      try {
        const q = query(
          licensesCollection(firestore),
          where('state', '==', state),
          where('surplusLinesProducerOfRecord', '==', true),
        );

        const querySnap = await getDocs(q);
        if (querySnap.empty)
          throw new Error(`No SL license found for ${state}`);
        return querySnap.docs[0].data();
      } catch (err: any) {
        let msg = `error fetching SL license`;
        if (err?.message) msg = err.message;
        if (onError) onError(msg, err);
        return null;
      }
    },
    [firestore, onError],
  );

  const createQuote = useCallback(
    async (
      values: QuoteValues,
      submissionId: string | null = null,
      submissionData: Partial<Submission> | null = null,
    ) => {
      if (!signInCheckResult.hasRequiredClaims)
        throw new Error('Missing required permissions');
      // TODO: use homeState instead of address.state once interface is updated
      const surplusLinesLicense = await getSLLicense(values.address.state);
      if (!surplusLinesLicense) return;

      try {
        const quoteData = getFormattedQuote(
          values,
          signInCheckResult.user?.uid,
        );
        // console.log('QUOTE DATA: ', quoteData);

        // const geoHash = getGeoHash(submissionData?.coordinates);
        const geoHash = getGeoHash(values?.coordinates);

        const quoteRef = await addDoc(quotesCollection(firestore), {
          ...quoteData,
          submissionId,
          imageURLs: isEmpty(submissionData?.imageURLs)
            ? null
            : submissionData?.imageURLs,
          imagePaths: isEmpty(submissionData?.imagePaths)
            ? null
            : submissionData?.imagePaths,
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
        } else if (err?.message)
          msg = err.message.replace('Invariant failed: ', '');

        if (onError) onError(msg, err);
      }
    },
    [
      firestore,
      onStepSuccess,
      onComplete,
      onError,
      sendEmailNotifications,
      getSLLicense,
      signInCheckResult,
    ],
  );

  return createQuote;
};

function getFormattedQuote(values: QuoteValues, uid?: string | null): Quote {
  const {
    address,
    limits,
    coordinates,
    effectiveDate,
    namedInsured,
    agent,
    agency,
    carrier,
    commSource,
    quoteTotal,
    annualPremium,
    taxes,
    fees,
    // subproducerCommission,
    ratingPropertyData,
    ratingDocId,
    notes,
  } = values;

  // TODO: validation
  invariant(quoteTotal, 'missing quote total');
  invariant(annualPremium, 'missing annualPremium');
  invariant(
    namedInsured?.email || agent?.email,
    'Must have at least one email (insured or agent)',
  );
  invariant(isValid(effectiveDate), 'Invalid effective date');
  invariant(typeof coordinates?.latitude === 'number', 'invalid latitude');
  invariant(typeof coordinates?.longitude === 'number', 'invalid longitude');

  let effDateStartOfDay = startOfDay(effectiveDate);

  let numTaxes: TaxItem[] = taxes.map((t) => ({
    ...t,
    value: extractNumber(`${t.value}`) ?? null,
    rate: extractNumber(`${t.rate}`) ?? null,
  }));

  return {
    policyId: `ID${createDocId(8)}`,
    product: 'flood', // TODO: pass as prop
    deductible: values.deductible,
    limits: {
      limitA: limits.limitA,
      limitB: limits.limitB,
      limitC: limits.limitC,
      limitD: limits.limitD,
    },
    address,
    coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
    homeState: address.state as State,
    mailingAddress: {
      name: '',
      addressLine1: address?.addressLine1 || '',
      addressLine2: address?.addressLine2 || '',
      city: address?.city || '',
      state: address?.state || '',
      postal: address?.postal || '',
    },
    quotePublishedDate: Timestamp.now(),
    quoteExpirationDate: Timestamp.fromDate(
      addToDate({ days: 30 }, endOfToday()),
    ),
    effectiveDate: Timestamp.fromDate(effDateStartOfDay),
    exclusions: [],
    additionalInterests: [],
    annualPremium,
    fees,
    taxes: numTaxes,
    // subproducerCommission,
    cardFee: round(quoteTotal * CARD_FEE_RATE, 2),
    quoteTotal, // calculate on server ??
    userId: namedInsured.userId || null,
    namedInsured,
    agent,
    agency,
    carrier,
    commSource,
    billingEntities: {},
    defaultBillingEntityId: 'namedInsured',
    notes:
      notes && notes.length > 0
        ? notes
            .filter((n) => n.note)
            .map((n) => ({
              note: n.note,
              created: Timestamp.now(),
              userId: uid || null,
            }))
        : [],
    status: QUOTE_STATUS.AWAITING_USER,
    ratingPropertyData: {
      CBRSDesignation: ratingPropertyData.CBRSDesignation,
      basement: ratingPropertyData.basement as Basement, // TODO: fix type (or extend to make optional if quote)
      distToCoastFeet: extractNumber(`${ratingPropertyData.distToCoastFeet}`),
      floodZone: ratingPropertyData.floodZone as FloodZone,
      numStories: ratingPropertyData.numStories,
      propertyCode: ratingPropertyData.propertyCode,
      replacementCost: ratingPropertyData.replacementCost as number,
      sqFootage: extractNumber(`${ratingPropertyData.sqFootage}`),
      yearBuilt: extractNumber(`${ratingPropertyData.yearBuilt}`),
      priorLossCount: ratingPropertyData?.priorLossCount ?? null,
    },
    ratingDocId: ratingDocId || '',
    imageURLs: {
      light: '',
      dark: '',
      satellite: '',
      satelliteStreets: '',
    },
    imagePaths: {
      light: '',
      dark: '',
      satellite: '',
      satelliteStreets: '',
    },
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
      version: 1,
    },
  };
}

// function getImages(submissionData?: Submission | null) {
//   let imageURLs: Record<string, string> = {};
//   let imagePaths: Record<string, string> = {};
//   // MapImageURL MapImageFilePath
//   if (submissionData) {
//     const {
//       darkMapImageURL,
//       lightMapImageURL,
//       satelliteMapImageURL,
//       satelliteStreetsMapImageURL,
//       darkMapImageFilePath,
//       lightMapImageFilePath,
//       satelliteMapImageFilePath,
//       satelliteStreetsMapImageFilePath,
//     } = submissionData;

//     if (darkMapImageURL) imageURLs.darkMapImageURL = darkMapImageURL;
//     if (lightMapImageURL) imageURLs.lightMapImageURL = lightMapImageURL;
//     if (satelliteMapImageURL) imageURLs.satelliteMapImageURL = satelliteMapImageURL;
//     if (satelliteStreetsMapImageURL)
//       imageURLs.satelliteStreetsMapImageURL = satelliteStreetsMapImageURL;
//     if (darkMapImageFilePath) imagePaths.darkMapImageFilePath = darkMapImageFilePath;
//     if (lightMapImageFilePath) imagePaths.lightMapImageFilePath = lightMapImageFilePath;
//     if (satelliteMapImageFilePath) imagePaths.satelliteMapImageFilePath = satelliteMapImageFilePath;
//     if (satelliteStreetsMapImageFilePath)
//       imagePaths.satelliteStreetsMapImageFilePath = satelliteStreetsMapImageFilePath;
//   }

//   return {
//     imageURLs: isEmpty(imageURLs) ? null : imageURLs,
//     imagePaths: isEmpty(imagePaths) ? null : imagePaths,
//   };
// }
