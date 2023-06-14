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

  let AALsRes: GetAALRes | undefined;
  // let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };
  // let srRequestId TODO: save swiss re request id with rating data

  try {
    const srVals: Partial<GetAALsProps> = {
      coordinates: sub.coordinates,
      limits: sub.limits,
      deductible: sub.deductible,
      replacementCost: sub.ratingPropertyData?.replacementCost,
      numStories: sub.ratingPropertyData?.numStories || 1,
    };
    validateGetAALsProps(srVals);

    // @ts-ignore
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
      `SWISS RE DOC SAVED: ${swissReRef.id} - AALs =>  inland: ${AALsRes.AAL.inland}; surge: ${AALsRes.AAL.surge}; tsunami: ${AALsRes.AAL.tsunami}`,
      {
        ...AALsRes,
      }
    );

    // update submission doc with AALs
    const updates: Partial<Submission> = {
      AAL: {
        inland: AALsRes.AAL?.inland ?? null,
        surge: AALsRes.AAL?.surge ?? null,
        tsunami: AALsRes.AAL?.tsunami ?? null,
      },
    };
    await snap.ref.update(updates);
  } catch (err) {
    console.log('ERROR FETCHING SR AAL DATA', err);
    return;
  }

  try {
    invariant(typeof AALsRes?.AAL?.inland === 'number', 'Missing inland AAL');
    invariant(typeof AALsRes?.AAL?.surge === 'number', 'Missing surge AAL');
    invariant(typeof AALsRes?.AAL?.tsunami === 'number', 'Missing tsunami AAL');

    const result = getPremium({
      AAL: {
        inland: AALsRes?.AAL?.inland,
        surge: AALsRes?.AAL?.surge,
        tsunami: AALsRes?.AAL?.tsunami,
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
    await ratingColRef.add({
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
        building: AALsRes.rcvs.building,
        otherStructures: AALsRes.rcvs.otherStructures,
        contents: AALsRes.rcvs.contents,
        BI: AALsRes.rcvs.BI,
        total: AALsRes.rcvs.total,
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
      AAL: {
        inland: AALsRes.AAL.inland,
        surge: AALsRes.AAL.surge,
        tsunami: AALsRes.AAL.tsunami,
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
};
