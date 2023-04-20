import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
// import { parseString } from 'xml2js';
import { Parser } from 'xml2js';
import { stripPrefix, parseNumbers, parseBooleans } from 'xml2js/lib/processors.js';

import { getVeriskInstance } from '../services';
import { printObj } from '../common';

const veriskGroupId = defineSecret('VERISK_GROUP_ID');
const veriskPassword = defineSecret('VERISK_PASSWORD');
const veriskUserData = defineSecret('VERISK_USER_DATA');

export const getValuationEstimate = functions
  .runWith({
    secrets: [veriskGroupId, veriskPassword, veriskUserData],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data) => {
    const { addressLine1, city, state, postal } = data;

    if (!(addressLine1 && city && state && postal)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Missing required address components`
      );
    }

    const groupId = process.env.VERISK_GROUP_ID;
    const password = process.env.VERISK_PASSWORD;
    const userData = process.env.VERISK_USER_DATA;

    if (!(groupId && password && userData)) {
      throw new functions.https.HttpsError('internal', `Missing external API credentials`);
    }

    const veriskInstance = getVeriskInstance();
    let veriskXML;

    try {
      const config = { headers: { 'Content-Type': 'text/xml' } };
      const body = getVeriskXML({
        groupId,
        password,
        userData,
        addressLine1,
        city,
        state,
        postal,
      });

      // let body = fs.readFileSync(
      //   '/Users/spencercarlson/code/submissions/functions/src/callables/test.xml'
      // );
      const { data } = await veriskInstance.post('/apps/iv/services/valuation', body, config);

      console.log('VERISK RESPONSE: ', data);
      if (data) {
        veriskXML = data;
      } else {
        throw Error('error fetching valuation');
      }
    } catch (err) {
      throw new functions.https.HttpsError(
        'internal',
        `An error occurred getting estimated replacement cost`
      );
    }

    try {
      const parser = new Parser({
        explicitArray: false,
        // ignoreAttrs: true, // 'report' fields are attrs
        tagNameProcessors: [stripPrefix],
        valueProcessors: [parseNumbers, parseBooleans],
      }); // { mergeAttrs: true }
      let resJson = await parser.parseStringPromise(veriskXML);
      printObj(resJson);

      const resBody = resJson?.Envelope?.Body;
      const valRes = resBody?.calculateRecalculatableValuationResponse?.return;

      const valuation = valRes?.calculatedValue || null;
      const valuationId = valRes?.valuationId || null;
      const report = valRes?.report || null;

      console.log('EXTRACTED VALUATION: ', valuation);
      console.log('VALUATION ID: ', valuationId);

      let parsedReport;
      if (report) {
        const parsedReportInit = await parser.parseStringPromise(report);
        parsedReport = parsedReportInit; // TODO: flatten data
        // const residentialReport = parsedReportInit?.CONTEXT?.RESIDENTIAL_REPORT;
        // if (residentialReport) {
        //   parsedReport = {};
        //   for (let key in residentialReport) {
        //   }
        // }
      }

      return { resJson, resBody, valRes, valuation, valuationId, report, parsedReport };

      // const resBody = resJson?.Envelope?.Body[0];
      // const valRes = resBody?.calculateRecalculatableValuationResponse[0]?.return[0];

      // const valuation = valRes?.calculatedValue[0] || null;
      // const valuationId = valRes?.valuationId[0] || null;
      // const report = valRes?.report[0] || null;

      // console.log('EXTRACTED VALUATION: ', valuation);
      // console.log('VALUATION ID: ', valuationId);

      // let parsedReport;
      // if (report) parsedReport = await parser.parseStringPromise(report);

      // return { resJson, resBody, valRes, valuation, valuationId, report, parsedReport };
    } catch (err) {
      throw new functions.https.HttpsError('internal', `Error parsing replacement cost response`);
    }

    // return;
  });

interface GetVeriskXMLProps {
  groupId: string;
  password: string;
  userData: string;
  addressLine1: string;
  city: string;
  state: string;
  postal: string;
}

// <RESIDENTIAL>
//   <OWNER street='880 GREENWOOD LAKE DR' city='FRANKLIN' state='GA' zipcode='30217' country='USA' />
// </RESIDENTIAL>;

function getVeriskXML({
  groupId,
  password,
  userData,
  addressLine1,
  city,
  state,
  postal,
}: GetVeriskXMLProps) {
  return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:val="http://valuationWebService.services.web.ivplugin.underwriting.verisk.com/">
    <soapenv:Header/>
    <soapenv:Body>
    <val:calculateRecalculatableValuation>
    <groupId>${groupId}</groupId>
    <password>${password}</password>
    <userData>${userData}</userData>
    <ownerData></ownerData>
    <ownerGroupId></ownerGroupId>
    <structureData>
      &lt;CONTEXT&gt;
        &lt;RESIDENTIAL&gt;
          &lt;OWNER street="${addressLine1}" city="${city}" state="${state}" zipcode="${postal}" country="USA" /&gt;
        &lt;/RESIDENTIAL&gt;
      &lt;/CONTEXT&gt;
    </structureData>
    <workflowCode></workflowCode>
    <valuationId></valuationId>
    <reportFormat>xml</reportFormat>
    <locale>en_US</locale>
    <detailedReport>false</detailedReport>
    <callerReferenceId></callerReferenceId>
    <options></options>
    </val:calculateRecalculatableValuation>
    </soapenv:Body>
    </soapenv:Envelope>
  `;
}

// <![CDATA[
// <CONTEXT>
//     <RESIDENTIAL>
//         <OWNER street="${addressLine1}" city="${city}" state="${state}" zipcode="${postal}" country="USA"/>
//     </RESIDENTIAL>
// </CONTEXT>]]>

// &lt;CONTEXT&gt;
// &lt;RESIDENTIAL&gt;
// &lt;OWNER street="880 GREENWOOD LAKE DR" city="FRANKLIN" state="GA" zipcode="30217" country="USA" /&gt;
// &lt;/RESIDENTIAL&gt;
// &lt;/CONTEXT&gt;
