import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import invariant from 'tiny-invariant';

import { swissReResCollection, COLLECTIONS, Submission, usersCollection } from '../common';
import { getAALs, GetAALsProps, getPremium, validateGetAALsProps } from '../utils/rating';

const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

// TODO: get commission if submitted by agent
// TODO: HOW IS COMM HANDLED BETWEEN SUB AND QUOTE ?? how does quote form know what to pre-fill with if agent's commission is different than 15% ?? include commission in subission doc ??

const DEFAULT_COMMISSION = 0.15;

export const getSubmissionAAL = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .firestore.document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snap) => {
    const sub = snap.data() as Submission;
    const db = getFirestore();
    let commissionPct = DEFAULT_COMMISSION;

    if (sub.submittedById) {
      let userSnap = await usersCollection(db).doc(sub.submittedById).get();
      const data = userSnap.data();
      if (data?.defaultCommission)
        commissionPct = data.defaultCommission?.flood ?? DEFAULT_COMMISSION;
    }

    const srClientId = process.env.SWISS_RE_CLIENT_ID;
    const srClientSecret = process.env.SWISS_RE_CLIENT_SECRET;
    const srSubKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

    if (!(srClientId && srClientSecret && srSubKey)) {
      console.log('MISSING SR CREDENTIALS. RETURNING EARLY');
      return;
    }

    let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };

    try {
      const srVals: Partial<GetAALsProps> = {
        latitude: sub.coordinates.latitude,
        longitude: sub.coordinates.longitude,
        limitA: sub.limitA,
        limitB: sub.limitB,
        limitC: sub.limitC,
        limitD: sub.limitD,
        deductible: sub.deductible,
        replacementCost: sub.replacementCost,
        numStories: sub.numStories || 1,
      };
      validateGetAALsProps(srVals);

      // @ts-ignore
      const AALs = await getAALs({
        srClientId,
        srClientSecret,
        srSubKey,
        ...srVals,
      });
      ratingUpdates = {
        inlandAAL: AALs.inlandAAL,
        surgeAAL: AALs.surgeAAL,
      };
      // fetch SR data
      // const xmlBodyVars = getSRVars(sub);
      // const body = swissReBody(xmlBodyVars);
      // const { data } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
      //   headers: {
      //     'Content-Type': 'application/octet-stream',
      //   },
      // });
      // // extract AALs
      // console.log('SWISS RE RES: ', data);
      // let code200Index = data.expectedLosses.findIndex(
      //   (floodObj: any) => floodObj.perilCode === '200'
      // );
      // let code300Index = data.expectedLosses.findIndex(
      //   (floodObj: any) => floodObj.perilCode === '300'
      // );

      // if (code200Index !== -1) {
      //   ratingUpdates.surgeAAL = data.expectedLosses[code200Index]?.preCatLoss ?? 0;
      // }
      // if (code300Index !== -1) {
      //   ratingUpdates.inlandAAL = data.expectedLosses[code300Index]?.preCatLoss ?? 0;
      // }

      // console.log(`AAL: ${JSON.stringify(ratingUpdates)}`);

      const swissReRef = await swissReResCollection(db).add({
        ...AALs.srRes,
        submissionId: snap.id,
        address: {
          addressLine1: sub.addressLine1,
          addressLine2: sub.addressLine2,
          city: sub.city,
          state: sub.state,
          postal: sub.postal,
        },
        coordinates: sub.coordinates,
      });
      console.log(
        `SWISS RE DOC SAVED: ${swissReRef.id} - AALs =>  inland: ${AALs.inlandAAL}; surge: ${AALs.surgeAAL}`
      );

      // update submission doc
      await snap.ref.update({ inlandAAL: AALs.inlandAAL, surgeAAL: AALs.surgeAAL });
    } catch (err) {
      console.log('ERROR FETCHING SR AAL DATA', err);
      return;
    }

    // CALCULATE ANNUAL PREMIUM
    try {
      const { inlandAAL, surgeAAL } = ratingUpdates;
      invariant(typeof inlandAAL === 'number');
      invariant(typeof surgeAAL === 'number');

      const result = getPremium({
        inlandAAL,
        surgeAAL,
        limitA: sub.limitA,
        limitB: sub.limitB,
        limitC: sub.limitC,
        limitD: sub.limitD,
        floodZone: sub.floodZone,
        state: sub.state,
        basement: sub.basement,
        priorLossCount: sub.priorLossCount,
        commissionPct,
      });
      const { premiumData } = result;

      await db.collection(COLLECTIONS.RATING_DATA).add({
        submissionId: snap.id,
        deductible: sub.deductible,
        limits: {
          limitA: sub.limitA,
          limitB: sub.limitB,
          limitC: sub.limitC,
          limitD: sub.limitD,
        },
        tiv: result.tiv,
        replacementCost: sub.replacementCost,
        aal: {
          inland: inlandAAL,
          surge: surgeAAL,
        },
        pm: result.pm,
        riskScore: result.riskScore,
        stateMultipliers: result.stateMultipliers,
        secondaryFactorMults: result.secondaryFactorMults,
        floodZone: sub.floodZone,
        basement: sub.basement,
        ffe: 0,
        numStories: sub.numStories,
        sqFootage: sub.sqFootage,
        distToCoast: sub.distToCoastFeet,
        propertyCode: sub.propertyCode,
        yearBuilt: sub.yearBuilt,
        CBRSDesignation: sub.CBRSDesignation,
        priorLossCount: sub.priorLossCount,
        premiumData,
        address: {
          addressLine1: sub.addressLine1,
          addressLine2: sub.addressLine2 || null,
          city: sub.city,
          state: sub.state,
          postal: sub.postal,
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

      console.log(`UPDATED SUBMISSION ${snap.id} - PREMIUM: ${premiumData.directWrittenPremium}`);

      // const { inlandAAL, surgeAAL } = ratingUpdates;

      // invariant(typeof inlandAAL === 'number', 'inland AAL required');
      // invariant(typeof surgeAAL === 'number', 'surge AAL required');
      // invariant(sub.state, 'state required');
      // invariant(sub.basement, 'state required');

      // const tiv = calcSum([sub.limitA, sub.limitB, sub.limitC, sub.limitD]);

      // const minPremium = getMinPremium(sub.floodZone || 'D', tiv);

      // const pm = {
      //   inland: getPM(inlandAAL, tiv),
      //   surge: getPM(surgeAAL, tiv),
      // };
      // const riskScore = {
      //   inland: getInlandRiskScore(pm.inland),
      //   surge: getSurgeRiskScore(pm.surge),
      // };
      // // Flood type multipliers by state
      // const { inlandStateMult = 1.5, surgeStateMult = 3 } = multipliersByState[sub.state];

      // let secondaryFactorMults = getSecondaryFactorMults({
      //   ffe: 0,
      //   basement: sub.basement,
      //   priorLossCount: sub.priorLossCount,
      //   inlandRiskScore: riskScore.inland,
      //   surgeRiskScore: riskScore.surge,
      // });

      // let premiumData = getPremiumData({
      //   AAL: {
      //     inland: inlandAAL,
      //     surge: surgeAAL,
      //   },
      //   secondaryFactorMults,
      //   stateMultipliers: {
      //     inland: inlandStateMult,
      //     surge: surgeStateMult,
      //   },
      //   minPremium,
      //   subproducerComPct: commissionPct,
      // });

      // console.log('PREMIUM DATA: ', premiumData);
      // if (!premiumData.directWrittenPremium) throw new Error('Missing DWP');

      // await db.collection(COLLECTIONS.RATING_DATA).add({
      //   submissionId: snap.id,
      //   deductible: sub.deductible,
      //   limits: {
      //     limitA: sub.limitA,
      //     limitB: sub.limitB,
      //     limitC: sub.limitC,
      //     limitD: sub.limitD,
      //   },
      //   tiv,
      //   replacementCost: sub.replacementCost,
      //   aal: {
      //     inland: inlandAAL,
      //     surge: surgeAAL,
      //   },
      //   pm,
      //   riskScore,
      //   stateMultipliers: {
      //     inland: inlandStateMult,
      //     surge: surgeStateMult,
      //   },
      //   secondaryFactorMults,
      //   floodZone: sub.floodZone,
      //   basement: sub.basement,
      //   ffe: 0,
      //   numStories: sub.numStories,
      //   sqFootage: sub.sqFootage,
      //   distToCoast: sub.distToCoastFeet,
      //   propertyCode: sub.propertyCode,
      //   yearBuilt: sub.yearBuilt,
      //   CBRSDesignation: sub.CBRSDesignation,
      //   priorLossCount: sub.priorLossCount,
      //   premiumData: {
      //     minPremium,
      //     ...premiumData,
      //   },
      //   address: {
      //     addressLine1: sub.addressLine1,
      //     addressLine2: sub.addressLine2 || null,
      //     city: sub.city,
      //     state: sub.state,
      //     postal: sub.postal,
      //   },
      //   coordinates: sub.coordinates,
      //   metadata: {
      //     created: Timestamp.now(),
      //     updated: Timestamp.now(),
      //   },
      // });

      // await snap.ref.update({
      //   annualPremium: premiumData.directWrittenPremium,
      //   subproducerCommission: commissionPct,
      // });

      // console.log(`UPDATED SUBMISSION ${snap.id} - PREMIUM: ${premiumData.directWrittenPremium}`);
    } catch (err) {
      console.log('ERROR CALCULATING QUOTE: ', err);
      return;
    }

    // TODO: FETCH TAXES ??
  });

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
