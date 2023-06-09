import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import invariant from 'tiny-invariant';

import {
  swissReResCollection,
  Submission,
  usersCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
  defaultFloodZone,
  defaultCommissionAsInt,
  ratingDataCollection,
} from '../common';
import { getAALs, GetAALsProps, getPremium, validateGetAALsProps } from '../utils/rating';
import type { GetAALRes } from '../utils/rating/getAALs';

// TODO: get commission if submitted by agent
// TODO: HOW IS COMM HANDLED BETWEEN SUB AND QUOTE ?? how does quote form know what to pre-fill with if agent's commission is different than 15% ?? include commission in subission doc ??

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
    console.log('No data associated with event');
    return;
  }
  const sub = snap.data() as Submission;
  const db = getFirestore();
  let commissionPct = defaultCommissionAsInt.value() / 100;

  if (!sub.ratingPropertyData?.replacementCost) {
    info('Missing replacement cost --> returning early', { ...sub });
    return;
  }
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

  let AALs: GetAALRes | undefined;
  // let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };
  // let srRequestId TODO: save swiss re request id with rating data

  try {
    const srVals: Partial<GetAALsProps> = {
      latitude: sub.coordinates.latitude,
      longitude: sub.coordinates.longitude,
      limitA: sub.limits?.limitA,
      limitB: sub.limits?.limitB,
      limitC: sub.limits?.limitC,
      limitD: sub.limits?.limitD,
      deductible: sub.deductible,
      replacementCost: sub.ratingPropertyData?.replacementCost,
      numStories: sub.ratingPropertyData?.numStories || 1,
    };
    validateGetAALsProps(srVals);

    // @ts-ignore
    AALs = await getAALs({
      srClientId,
      srClientSecret,
      srSubKey,
      ...srVals,
    });

    const swissReRef = await swissReResCollection(db).add({
      ...AALs.srRes,
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
        limitA: srVals.limitA || null,
        limitB: srVals.limitB || null,
        limitC: srVals.limitC || null,
        limitD: srVals.limitD || null,
        latitude: srVals.latitude || null,
        longitude: srVals.longitude || null,
        deductible: srVals.deductible || null,
        numStories: srVals.numStories || null,
      },
    });
    info(
      `SWISS RE DOC SAVED: ${swissReRef.id} - AALs =>  inland: ${AALs.inlandAAL}; surge: ${AALs.surgeAAL}`,
      {
        ...AALs,
      }
    );

    // update submission doc with AALs
    // await snap.ref.update({ inlandAAL: AALs.inlandAAL, surgeAAL: AALs.surgeAAL });
    // TODO: extract tsunami AAL
    const updates: Partial<Submission> = {
      AAL: { inland: AALs.inlandAAL, surge: AALs.surgeAAL, tsunami: null },
    };
    await snap.ref.update(updates);
  } catch (err) {
    console.log('ERROR FETCHING SR AAL DATA', err);
    return;
  }

  // CALCULATE ANNUAL PREMIUM
  try {
    // const { inlandAAL, surgeAAL } = ratingUpdates;
    const { inlandAAL, surgeAAL } = AALs; // TODO: add tsunami
    invariant(typeof inlandAAL === 'number');
    invariant(typeof surgeAAL === 'number');

    const result = getPremium({
      inlandAAL,
      surgeAAL,
      limitA: sub.limits?.limitA,
      limitB: sub.limits?.limitB,
      limitC: sub.limits?.limitC,
      limitD: sub.limits?.limitD,
      floodZone: sub.ratingPropertyData?.floodZone || defaultFloodZone.value(),
      state: sub.address?.state,
      basement: sub.ratingPropertyData?.basement || 'unknown',
      priorLossCount: sub.priorLossCount,
      commissionPct,
    });
    const { premiumData } = result;

    // TODO: move saving rating data to it's own try/catch ?? see getAnnualPremium
    const ratingColRef = ratingDataCollection(db);
    // await db.collection(COLLECTIONS.RATING_DATA).add({
    await ratingColRef.add({
      submissionId: snap.id,
      deductible: sub.deductible,
      limits: {
        limitA: sub.limits?.limitA,
        limitB: sub.limits?.limitB,
        limitC: sub.limits?.limitC,
        limitD: sub.limits?.limitD,
      },
      tiv: result.tiv,
      // replacementCost: sub.replacementCost,
      rcvs: {
        // TODO: change getAAL func to use same rcv keys (rcvA -> building, etc.)
        building: AALs.rcvs.rcvA,
        otherStructures: AALs.rcvs.rcvB,
        contents: AALs.rcvs.rcvC,
        BI: AALs.rcvs.rcvD,
        total: AALs.rcvs.total,
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
        ffe: null,
        // priorLossCount: sub.priorLossCount || null, // TODO: fix confiction with priorLossCount in Submission doc
      },
      aal: {
        inland: inlandAAL,
        surge: surgeAAL,
      },
      premiumCalcData: result.premiumData,
      pm: result.pm,
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
      annualPremium: premiumData.directWrittenPremium,
      subproducerCommission: commissionPct,
    });

    info(`UPDATED SUBMISSION ${snap.id} - PREMIUM: ${premiumData.directWrittenPremium}`, {
      ...result,
    });
  } catch (err) {
    console.log('ERROR CALCULATING QUOTE: ', err);
    return;
  }

  // TODO: FETCH TAXES ??
};

// export function getSRVars(sub: Submission) {
//   const { replacementCost, limitA, limitB, limitC, limitD, deductible, numStories } = sub;

//   const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });
//   const rcvAB = RCVs.rvcA + RCVs.rcvB;
//   const rcvTotal = calcSum(Object.values(RCVs));

//   return {
//     lat: sub.coordinates.latitude,
//     lng: sub.coordinates.longitude,
//     rcvTotal,
//     rcvAB,
//     rcvC: RCVs.rcvC,
//     rcvD: RCVs.rcvD,
//     limitAB: limitA + limitB,
//     limitC,
//     limitD,
//     deductible,
//     numStories,
//   };
// }
