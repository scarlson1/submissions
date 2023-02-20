import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { swissReResCollection } from '../common/dbCOLLECTIONS';
import { COLLECTIONS } from '../common/enums';
import { Submission } from '../common/types';
import { getSwissReInstance } from '../services/swissRe';

const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');
// TODO: firestore rules to not allow users to change AAL fields

export const getSubmissionAAL = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .firestore.document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snap) => {
    const sub = snap.data() as Submission;
    const db = getFirestore();
    const clientId = process.env.SWISS_RE_CLIENT_ID;
    const clientSecret = process.env.SWISS_RE_CLIENT_SECRET;
    const subKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

    if (!(clientId && clientSecret && subKey)) {
      console.log('MISSING SR CREDENTIALS. RETURNING EARLY');
      return;
    }
    const swissReInstance = getSwissReInstance(clientId, clientSecret, subKey);

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

      let ratingUpdates: { [key: string]: null | number } = { inlandAAL: null, surgeAAL: null };
      if (code200Index !== -1) {
        let { preCatLoss: surgeAAL } = data.expectedLosses[code200Index];
        ratingUpdates.surgeAAL = surgeAAL ?? 0;
      } else {
        ratingUpdates.surgeAAL = 0;
      }
      if (code300Index !== -1) {
        let { preCatLoss: inlandAAL } = data.expectedLosses[code300Index];
        ratingUpdates.inlandAAL = inlandAAL ?? 0;
      } else {
        ratingUpdates.inlandAAL = 0;
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

      return;
    } catch (err) {
      // console.log('ERROR FETCHING SR AAL DATA', err);
      return;
    }
  });

function getSRVars(sub: Submission) {
  const { replacementCost, limitA, limitB, limitC, limitD, deductible, numStories } = sub;
  const rcvA = replacementCost;
  const rcvB = limitB > 0 ? sub.replacementCost * 0.05 : 0;
  const rcvC = limitC > 0 ? sub.replacementCost * 0.25 : 0;
  const rcvD = limitD > 0 ? sub.replacementCost * 0.1 : 0;
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
function swissReBody({
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
