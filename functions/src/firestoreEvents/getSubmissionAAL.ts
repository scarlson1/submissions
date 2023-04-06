import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import invariant from 'tiny-invariant';

import { swissReResCollection, COLLECTIONS, Submission, calcSum, usersCollection } from '../common';
import { getSwissReInstance } from '../services';
import {
  getInlandRiskScore,
  getMinPremium,
  getPM,
  getPremiumData,
  getSecondaryFactorMults,
  getSurgeRiskScore,
  multipliersByState,
} from '../utils/rating';

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

    // TODO: get company default submission
    if (sub.submittedById) {
      let userSnap = await usersCollection(db).doc(sub.submittedById).get();
      const data = userSnap.data();
      if (data?.defaultCommission)
        commissionPct = data.defaultCommission?.flood ?? DEFAULT_COMMISSION;
    }

    const clientId = process.env.SWISS_RE_CLIENT_ID;
    const clientSecret = process.env.SWISS_RE_CLIENT_SECRET;
    const subKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

    if (!(clientId && clientSecret && subKey)) {
      console.log('MISSING SR CREDENTIALS. RETURNING EARLY');
      return;
    }
    const swissReInstance = getSwissReInstance(clientId, clientSecret, subKey);

    let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };

    try {
      // fetch SR data
      const xmlBodyVars = getSRVars(sub);
      const body = swissReBody(xmlBodyVars);
      const { data } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
      // extract AALs
      console.log('SWISS RE RES: ', data);
      let code200Index = data.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '200'
      );
      let code300Index = data.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '300'
      );

      if (code200Index !== -1) {
        ratingUpdates.surgeAAL = data.expectedLosses[code200Index]?.preCatLoss ?? 0;
      }
      if (code300Index !== -1) {
        ratingUpdates.inlandAAL = data.expectedLosses[code300Index]?.preCatLoss ?? 0;
      }

      console.log(`AAL: ${JSON.stringify(ratingUpdates)}`);

      const swissReRef = await swissReResCollection(db).add({
        ...data,
        ...ratingUpdates,
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
      console.log(`SWISS RE DOC SAVED: ${swissReRef.id} - AALs: ${JSON.stringify(ratingUpdates)}`);

      // update submission doc
      await snap.ref.update({ ...ratingUpdates });
    } catch (err) {
      console.log('ERROR FETCHING SR AAL DATA', err);
      return;
    }

    // CALCULATE ANNUAL PREMIUM
    try {
      const { inlandAAL, surgeAAL } = ratingUpdates;

      invariant(typeof sub.limitA === 'number', 'limitA required (type "number")');
      invariant(typeof sub.limitB === 'number', 'limitB required (type "number")');
      invariant(typeof sub.limitC === 'number', 'limitC required (type "number")');
      invariant(typeof sub.limitD === 'number', 'limitD required (type "number")');
      invariant(sub.limitA > 100000, 'limitA must be > 100k');
      invariant(typeof inlandAAL === 'number', 'inland AAL required');
      invariant(typeof surgeAAL === 'number', 'surge AAL required');
      invariant(sub.replacementCost, 'replacementCost required');
      invariant(sub.deductible, 'deductible required');
      invariant(sub.state, 'state required');
      invariant(sub.basement, 'state required');

      const tiv = calcSum([sub.limitA, sub.limitB, sub.limitC, sub.limitD]);

      const minPremium = getMinPremium(sub.floodZone || 'D', tiv);

      const pm = {
        inland: getPM(inlandAAL, tiv),
        surge: getPM(surgeAAL, tiv),
      };
      const riskScore = {
        inland: getInlandRiskScore(pm.inland),
        surge: getSurgeRiskScore(pm.surge),
      };
      // Flood type multipliers by state
      const { inlandStateMult = 1.5, surgeStateMult = 3 } = multipliersByState[sub.state];

      let secondaryFactorMults = getSecondaryFactorMults({
        ffe: 0,
        basement: sub.basement,
        priorLossCount: sub.priorLossCount,
        inlandRiskScore: riskScore.inland,
        surgeRiskScore: riskScore.surge,
      });

      let premiumData = getPremiumData({
        AAL: {
          inland: inlandAAL,
          surge: surgeAAL,
        },
        secondaryFactorMults,
        stateMultipliers: {
          inland: inlandStateMult,
          surge: surgeStateMult,
        },
        minPremium,
        subproducerComPct: commissionPct,
      });

      console.log('PREMIUM DATA: ', premiumData);
      if (!premiumData.directWrittenPremium) throw new Error('Missing DWP');

      await db.collection(COLLECTIONS.RATING_DATA).add({
        submissionId: snap.id,
        deductible: sub.deductible,
        limits: {
          limitA: sub.limitA,
          limitB: sub.limitB,
          limitC: sub.limitC,
          limitD: sub.limitD,
        },
        tiv,
        replacementCost: sub.replacementCost,
        aal: {
          inland: inlandAAL,
          surge: surgeAAL,
        },
        pm,
        riskScore,
        stateMultipliers: {
          inland: inlandStateMult,
          surge: surgeStateMult,
        },
        secondaryFactorMults,
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
        premiumData: {
          minPremium,
          ...premiumData,
        },
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
    } catch (err) {
      console.log('ERROR CALCULATING QUOTE: ', err);
      return;
    }

    // TODO: FETCH TAXES ??
  });

export function getSRVars(sub: Submission) {
  const { replacementCost, limitA, limitB, limitC, limitD, deductible, numStories } = sub;

  invariant(replacementCost, 'replacementCost required');
  invariant(numStories, 'numStories required');

  const rcvA = replacementCost;
  const rcvB = limitB > 0 ? replacementCost * 0.05 : 0;
  const rcvC = limitC > 0 ? replacementCost * 0.25 : 0;
  const rcvD = limitD > 0 ? replacementCost * 0.1 : 0;
  const rcvTotal = rcvA + rcvB + rcvC + rcvD;

  return {
    lat: sub.coordinates.latitude,
    lng: sub.coordinates.longitude,
    rcvTotal,
    rcvAB: rcvA + rcvB,
    rcvC,
    rcvD,
    limitAB: limitA + limitB,
    limitC,
    limitD,
    deductible,
    numStories,
  };
}

export interface SwissReBodyParams {
  lat: number;
  lng: number;
  rcvTotal: string | number;
  rcvAB: string | number;
  rcvC: string | number;
  rcvD: string | number;
  limitAB: string | number;
  limitC: string | number;
  limitD: string | number;
  deductible: string | number;
  numStories: string | number;
  externalRef?: string;
}

// export const swissReBody = ({
export function swissReBody({
  lat,
  lng,
  rcvTotal,
  rcvAB,
  rcvC,
  rcvD,
  limitAB,
  limitC,
  limitD,
  deductible,
  numStories = 1,
  externalRef,
}: SwissReBodyParams) {
  return `
  <ns7:Portfolio xmlns:ns7="http://rng.swissre.com/exposure/2/">
  <schemaMinorVersion>1</schemaMinorVersion>
  <currencyCode>USD</currencyCode>
  <currencyUnit>1</currencyUnit>
  <usdExchangeRate>1.0</usdExchangeRate>
  <portfolioName>iDemand - Template</portfolioName>
  <sourceSystem>EASI</sourceSystem>
  <externalReferenceId>${externalRef || 'iDemand Submission'}</externalReferenceId>
  <inuringTreaties />
  <conditionGroups>
    <conditionGroup>
      <levelCode>1</levelCode>
      <name>Account Name</name>
      <externalReferenceId>1</externalReferenceId>
      <natCatHazardTypeCodesFiltered />
      <parentObjectIds />
      <childObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">StormPolicyId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">FloodPolicyId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">TsunamiPolicyId</objectIdRef>
      </childObjectIds>
      <objectId xmlns="http://rng.swissre.com/basetypes/1/">AccountId</objectId>
      <inheritableCoverageConditions />
      <inheritableConditions />
      <externalClassifiers />
      <coverageObjectIds />
    </conditionGroup>
    <conditionGroup>
      <levelCode>3</levelCode>
      <name>Site Name</name>
      <externalReferenceId>1</externalReferenceId>
      <natCatHazardTypeCodesFiltered />
      <parentObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">StormPolicyId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">FloodPolicyId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">TsunamiPolicyId</objectIdRef>
      </parentObjectIds>
      <childObjectIds />
      <objectId xmlns="http://rng.swissre.com/basetypes/1/">SiteId</objectId>
      <inheritableCoverageConditions />
      <inheritableConditions />
      <externalClassifiers />
      <coverageObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">BuildingCoverageId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">ContentCoverageId</objectIdRef>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">BICoverageId</objectIdRef>
      </coverageObjectIds>
    </conditionGroup>
    <conditionGroup>
      <levelCode>2</levelCode>
      <name>Tsunami Policy</name>
      <externalReferenceId>1</externalReferenceId>
      <lossAdjustementExpenses>0.0</lossAdjustementExpenses>
      <natCatHazardTypeCodesFiltered>
        <item xmlns="http://rng.swissre.com/basetypes/1/">104</item>
      </natCatHazardTypeCodesFiltered>
      <parentObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">AccountId</objectIdRef>
      </parentObjectIds>
      <childObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">SiteId</objectIdRef>
      </childObjectIds>
      <objectId xmlns="http://rng.swissre.com/basetypes/1/">TsunamiPolicyId</objectId>
      <blanketCondition>
        <cover>
          <amount>
            <type>ABS</type>
            <value>${rcvTotal}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </cover>
        <deductible>
          <amount>
            <type>ABS</type>
            <value>${deductible}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </deductible>
      </blanketCondition>
      <inheritableCoverageConditions />
      <inheritableConditions />
      <externalClassifiers />
      <coverageObjectIds />
    </conditionGroup>
    <conditionGroup>
      <levelCode>2</levelCode>
      <name>Storm Surge Policy</name>
      <externalReferenceId>1</externalReferenceId>
      <lossAdjustementExpenses>0.0</lossAdjustementExpenses>
      <natCatHazardTypeCodesFiltered>
        <item xmlns="http://rng.swissre.com/basetypes/1/">202</item>
        <item xmlns="http://rng.swissre.com/basetypes/1/">203</item>
      </natCatHazardTypeCodesFiltered>
      <parentObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">AccountId</objectIdRef>
      </parentObjectIds>
      <childObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">SiteId</objectIdRef>
      </childObjectIds>
      <objectId xmlns="http://rng.swissre.com/basetypes/1/">StormPolicyId</objectId>
      <blanketCondition>
        <cover>
          <amount>
            <type>ABS</type>
            <value>${rcvTotal}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </cover>
        <deductible>
          <amount>
            <type>ABS</type>
            <value>${deductible}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </deductible>
      </blanketCondition>
      <inheritableCoverageConditions />
      <inheritableConditions />
      <externalClassifiers />
      <coverageObjectIds />
    </conditionGroup>
    <conditionGroup>
      <levelCode>2</levelCode>
      <name>Flood Policy (River and Pluvial Flood)</name>
      <externalReferenceId>1</externalReferenceId>
      <lossAdjustementExpenses>0.0</lossAdjustementExpenses>
      <natCatHazardTypeCodesFiltered>
        <item xmlns="http://rng.swissre.com/basetypes/1/">301</item>
        <item xmlns="http://rng.swissre.com/basetypes/1/">302</item>
      </natCatHazardTypeCodesFiltered>
      <parentObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">AccountId</objectIdRef>
      </parentObjectIds>
      <childObjectIds>
        <objectIdRef xmlns="http://rng.swissre.com/basetypes/1/">SiteId</objectIdRef>
      </childObjectIds>
      <objectId xmlns="http://rng.swissre.com/basetypes/1/">FloodPolicyId</objectId>
      <blanketCondition>
        <cover>
          <amount>
            <type>ABS</type>
            <value>${rcvTotal}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </cover>
        <deductible>
          <amount>
            <type>ABS</type>
            <value>${deductible}</value>
          </amount>
          <typeCode>1018242</typeCode>
        </deductible>
      </blanketCondition>
      <inheritableCoverageConditions />
      <inheritableConditions />
      <externalClassifiers />
      <coverageObjectIds />
    </conditionGroup>
  </conditionGroups>
  <insuredItems>
    <insuredItem>
      <externalReferenceId>1</externalReferenceId>
      <generalPhysicalProperties>
        <numberOfRisks>1</numberOfRisks>
        <numStoreys>${numStories}</numStoreys>
        <occupancyCode>1018256</occupancyCode>
        <risksInGeoProximityFlag>true</risksInGeoProximityFlag>
      </generalPhysicalProperties>
      <geographicalLocationInput>
        <country>United States (USA)</country>
        <latitude>${lat}</latitude>
        <longitude>${lng}</longitude>
      </geographicalLocationInput>
      <multipleHitInformation />
      <enrichedInformations />
      <siteGeometries />
      <coverages>
        <coverage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns7:BuildingCoverage">
          <objectId xmlns="http://rng.swissre.com/basetypes/1/">BuildingCoverageId</objectId>
          <totalInsuredValue>
            <type>ABS</type>
            <value>${rcvAB}</value>
          </totalInsuredValue>
          <externalReferenceId>1</externalReferenceId>
          <natCatHazardTypeCodesCovered>
            <item xmlns="http://rng.swissre.com/basetypes/1/">202</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">203</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">301</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">302</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">104</item>
          </natCatHazardTypeCodesCovered>
          <coverageCondition>
            <cover>
              <amount>
                <type>ABS</type>
                <value>${limitAB}</value>
              </amount>
              <typeCode>1018242</typeCode>
            </cover>
          </coverageCondition>
        </coverage>
        <coverage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns7:ContentCoverage">
          <objectId xmlns="http://rng.swissre.com/basetypes/1/">ContentCoverageId</objectId>
          <totalInsuredValue>
            <type>ABS</type>
            <value>${rcvC}</value>
          </totalInsuredValue>
          <externalReferenceId>2</externalReferenceId>
          <natCatHazardTypeCodesCovered>
            <item xmlns="http://rng.swissre.com/basetypes/1/">202</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">203</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">301</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">302</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">104</item>
          </natCatHazardTypeCodesCovered>
          <coverageCondition>
            <cover>
              <amount>
                <type>ABS</type>
                <value>${limitC}</value>
              </amount>
              <typeCode>1018242</typeCode>
            </cover>
          </coverageCondition>
        </coverage>
        <coverage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ns7:BusinessInterruptionCoverage">
          <objectId xmlns="http://rng.swissre.com/basetypes/1/">BICoverageId</objectId>
          <totalInsuredValue>
            <type>ABS</type>
            <value>${rcvD}</value>
          </totalInsuredValue>
          <externalReferenceId>3</externalReferenceId>
          <natCatHazardTypeCodesCovered>
            <item xmlns="http://rng.swissre.com/basetypes/1/">202</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">203</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">301</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">302</item>
            <item xmlns="http://rng.swissre.com/basetypes/1/">104</item>
          </natCatHazardTypeCodesCovered>
          <coverageCondition>
            <cover>
              <amount>
                <type>ABS</type>
                <value>${limitD}</value>
              </amount>
              <typeCode>1018242</typeCode>
            </cover>
          </coverageCondition>
        </coverage>
      </coverages>
    </insuredItem>
  </insuredItems>
</ns7:Portfolio>
`;
}
