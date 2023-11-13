import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import invariant from 'tiny-invariant';

import { PriorLossCount, Submission, swissReResCollection, usersCollection } from '@idemand/common';
import {
  defaultCommissionAsInt,
  defaultFloodZone,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  // swissReResCollection,
  swissReSubscriptionKey,
} from '../common/index.js';
import {
  GetAALRes,
  GetAALsProps,
  getAALs,
  getPremium,
  validateGetAALsProps,
} from '../modules/rating/index.js';

// TODO: get commission if submitted by agent
// TODO: HOW IS COMM HANDLED BETWEEN SUB AND QUOTE ?? how does quote form know what to pre-fill with if agent's commission is different than 15% ?? include commission in submission doc ??

// const DEFAULT_COMMISSION = 0.15;

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
) => {
  const snap = event.data;
  if (!snap) {
    warn('No data associated with event');
    return;
  }
  const sub = snap.data() as Submission;
  const db = getFirestore();
  let commissionPct = defaultCommissionAsInt.value() / 100;

  if (sub.submittedById) {
    // If submitted by userId present, fetch user and check to see if they have a default commission set
    // TODO: refactor to use agent.userId
    let userSnap = await usersCollection(db).doc(sub.submittedById).get();
    const data = userSnap.data();
    let agentFloodComm = data?.defaultCommission?.flood;
    if (
      agentFloodComm &&
      typeof agentFloodComm === 'number' &&
      agentFloodComm > 0 &&
      agentFloodComm <= 0.2
    ) {
      commissionPct = agentFloodComm;
    }
  }

  const srClientId = swissReClientId.value();
  const srClientSecret = swissReClientSecret.value();
  const srSubKey = swissReSubscriptionKey.value();

  let AALsRes: GetAALRes | undefined;
  // let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };
  // let srRequestId TODO: save swiss re request id with rating data

  try {
    const rcv = sub.ratingPropertyData.replacementCost;
    invariant(rcv && typeof rcv === 'number', 'rcv must be a number');

    const srVals: Omit<GetAALsProps, 'srClientId' | 'srClientSecret' | 'srSubKey'> = {
      coordinates: sub.coordinates,
      limits: sub.limits,
      deductible: sub.deductible,
      replacementCost: rcv,
      numStories: sub.ratingPropertyData?.numStories || 1,
    };
    // TODO: use zod
    validateGetAALsProps(srVals);

    AALsRes = await getAALs({
      srClientId,
      srClientSecret,
      srSubKey,
      ...srVals,
    });

    const swissReRef = await swissReResCollection(db).add({
      ...AALsRes.srRes,
      submissionId: snap.id,
      address: {
        addressLine1: sub.address?.addressLine1,
        addressLine2: sub.address?.addressLine2,
        city: sub.address?.city,
        state: sub.address?.state,
        postal: sub.address?.postal,
      },
      coordinates: sub.coordinates,
      requestValues: {
        replacementCost: srVals.replacementCost || null,
        limits: srVals.limits || null,
        coordinates: srVals.coordinates || null,
        deductible: srVals.deductible || null,
        numStories: srVals.numStories || null,
      },
    });
    info(
      `SWISS RE DOC SAVED: ${swissReRef.id} - AALs =>  inland: ${AALsRes.AALs.inland}; surge: ${AALsRes.AALs.surge}; tsunami: ${AALsRes.AALs.tsunami}`,
      {
        ...AALsRes,
      }
    );

    // update submission doc with AALs
    const updates: Partial<Submission> = {
      AALs: {
        inland: AALsRes.AALs?.inland ?? null,
        surge: AALsRes.AALs?.surge ?? null,
        tsunami: AALsRes.AALs?.tsunami ?? null,
      }, // @ts-ignore
      'metadata.updated': Timestamp.now(),
    };
    await snap.ref.update(updates);
  } catch (err: any) {
    warn('ERROR FETCHING SR AALs DATA', { err });
    return;
  }

  try {
    invariant(typeof AALsRes?.AALs?.inland === 'number', 'Missing inland AALs');
    invariant(typeof AALsRes?.AALs?.surge === 'number', 'Missing surge AALs');
    invariant(typeof AALsRes?.AALs?.tsunami === 'number', 'Missing tsunami AALs');

    const result = getPremium({
      AALs: {
        inland: AALsRes?.AALs?.inland,
        surge: AALsRes?.AALs?.surge,
        tsunami: AALsRes?.AALs?.tsunami,
      },
      limits: {
        limitA: sub.limits?.limitA,
        limitB: sub.limits?.limitB,
        limitC: sub.limits?.limitC,
        limitD: sub.limits?.limitD,
      },
      floodZone: sub.ratingPropertyData?.floodZone || defaultFloodZone.value(),
      state: sub.address?.state || '',
      basement: sub.ratingPropertyData?.basement || 'unknown',
      priorLossCount: sub.priorLossCount,
      commissionPct,
    });
    const { premiumData } = result;

    // TODO: move saving rating data to it's own try/catch ?? see getAnnualPremium
    const ratingColRef = ratingDataCollection(db);
    // await db.collection(COLLECTIONS.RATING_DATA).add({
    const ratingDocRef = await ratingColRef.add({
      submissionId: snap.id,
      deductible: sub.deductible,
      limits: {
        limitA: sub.limits?.limitA,
        limitB: sub.limits?.limitB,
        limitC: sub.limits?.limitC,
        limitD: sub.limits?.limitD,
      },
      TIV: result.tiv,
      // replacementCost: sub.replacementCost,
      RCVs: {
        building: AALsRes.RCVs.building,
        otherStructures: AALsRes.RCVs.otherStructures,
        contents: AALsRes.RCVs.contents,
        BI: AALsRes.RCVs.BI,
        total: AALsRes.RCVs.total,
      },
      ratingPropertyData: {
        replacementCost: sub.ratingPropertyData?.replacementCost || null,
        basement: sub.ratingPropertyData?.basement || null,
        floodZone: sub.ratingPropertyData?.floodZone || null,
        numStories: sub.ratingPropertyData?.numStories || null,
        propertyCode: null,
        CBRSDesignation: null,
        distToCoastFeet: null,
        sqFootage: null,
        yearBuilt: null,
        FFH: null,
        priorLossCount: (sub.priorLossCount as PriorLossCount) ?? null,
        units: null,
      },
      AALs: {
        inland: AALsRes.AALs.inland,
        surge: AALsRes.AALs.surge,
        tsunami: AALsRes.AALs.tsunami,
      },
      premiumCalcData: result.premiumData,
      PM: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      address: {
        addressLine1: sub.address.addressLine1,
        addressLine2: sub.address.addressLine2 || '',
        city: sub.address.city,
        state: sub.address.state,
        postal: sub.address.postal,
        countyName: sub.address?.countyName || '',
        countyFIPS: sub.address.countyFIPS || '',
      },
      coordinates: sub.coordinates,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    await snap.ref.update({
      annualPremium: premiumData.annualPremium,
      subproducerCommission: commissionPct,
      ratingDocId: ratingDocRef.id,
      'metadata.updated': Timestamp.now(),
    });

    info(`UPDATED SUBMISSION ${snap.id} - PREMIUM: ${premiumData.annualPremium}`, {
      ...result,
    });
  } catch (err: any) {
    error('ERROR CALCULATING QUOTE: ', { err });
    return;
  }
};
