import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import { Parser } from 'xml2js';
import { stripPrefix, parseNumbers, parseBooleans } from 'xml2js/lib/processors.js';
import axios from 'axios';

import { getVeriskInstance } from '../services';
import { printObj } from '../common';
import { veriskCredsDemo } from './index.js';

const VERISK_SAMPLE_URL = 'https://scarlson1.github.io/data/208_aiken_verisk_res.xml';
// https://scarlson1.github.io/data/sample_verisk_res.xml

// const veriskGroupId = defineSecret('VERISK_GROUP_ID');
// const veriskPassword = defineSecret('VERISK_PASSWORD');
// const veriskUserData = defineSecret('VERISK_USER_DATA');
// veriskGroupId, veriskPassword, veriskUserData,
// const veriskCredsDemo = defineSecret('VERISK_CREDS_DEMO');

export default async ({ data }: CallableRequest) => {
  const { addressLine1, city, state, postal } = data;

  if (!(addressLine1 && city && state && postal)) {
    throw new HttpsError('invalid-argument', `Missing required address components`);
  }

  // const groupId = process.env.VERISK_GROUP_ID;
  // const password = process.env.VERISK_PASSWORD;
  // const userData = process.env.VERISK_USER_DATA;

  // const testCreds = process.env.VERISK_CREDS_DEMO;
  // console.log('VERISK CREDS: ', testCreds, typeof testCreds);

  const veriskCreds = veriskCredsDemo.value();
  const parsedCreds = veriskCreds ? JSON.parse(veriskCreds) : null;
  const groupId = parsedCreds?.GROUP_ID;
  const password = parsedCreds?.PASSWORD;
  const userData = parsedCreds?.USER_DATA;

  if (!(groupId && password && userData)) {
    throw new HttpsError('internal', `Missing external API credentials`);
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

    let data;
    if (process.env.AUDIENCE === 'DEV HUMANS ' || process.env.AUDIENCE === 'LOCAL HUMANS') {
      console.log('USING MOCK RES FROM GITHUB (1382 HUNTER DR)');
      const { data: githubMockData } = await axios.get(VERISK_SAMPLE_URL);
      data = githubMockData;
    } else {
      const { data: veriskData } = await veriskInstance.post(
        '/apps/iv/services/valuation',
        body,
        config
      );
      data = veriskData;
    }

    // console.log('VERISK RESPONSE: ', data);
    if (data) {
      veriskXML = data;
    } else {
      throw Error('error fetching valuation');
    }
  } catch (err) {
    throw new HttpsError('internal', `An error occurred getting estimated replacement cost`);
  }

  try {
    const parser = new Parser({
      explicitArray: false,
      // ignoreAttrs: true, // 'report' fields are attrs (converts to empty strings if this is enabled)
      mergeAttrs: true,
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

    let parsedReport: { [key: string]: any } = {};
    if (report) {
      // TODO: use different parser settings on report ?? (explicitArray: true)
      const parsedReportInit = await parser.parseStringPromise(report);
      console.log('PARSED REPORT: ', parsedReportInit);
      const residentialReport = parsedReportInit?.CONTEXT?.RESIDENTIAL_REPORT || null;
      if (residentialReport) {
        // parsedReport = formatResidentialReport(residentialReport);
        parsedReport = residentialReport;
      }
    }

    return {
      resJson,
      resBody,
      valRes,
      valuation,
      valuationId,
      report,
      parsedReport, // : parsedReport?.CONTEXT?.RESIDENTIAL_REPORT || null,
    };

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
    throw new HttpsError('internal', `Error parsing replacement cost response`);
  }

  // return;
};

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

// WHEN MERGEATTRS PARSING SETTING SET TO FALSE:

// export function formatResidentialReport(residentialReport: any) {
//   let parsedReport: { [key: string]: any } = {};

//   parsedReport['ADDITIONAL_INFO'] = residentialReport.ADDITIONAL_INFO?.$ || null;

//   parsedReport['ANSWER'] = residentialReport.ANSWER?.map((i: any) => i.$ || {}) || [];

//   parsedReport['COST_BREAKDOWN'] =
//     residentialReport.COST_BREAKDOWN?.ANSWER?.map((i: any) => i.$ || {}) || [];

//   parsedReport['DECK'] = residentialReport.DECK?.ANSWER?.map((i: any) => i.$ || {}) || [];

//   parsedReport['FIREPLACE'] =
//     residentialReport.FIREPLACE?.map((f: any) => ({
//       ...f.$,
//       DETAILS: f.GROUP?.ANSWER.map((detail: any) => detail?.$),
//     })) || [];

//   parsedReport['GARAGE'] = residentialReport.GARAGE?.ANSWER?.map((i: any) => i.$) || [];

//   parsedReport['GROUP'] = residentialReport.GROUP?.map((g: any) => {
//     let item: { [key: string]: any } = { meta: g.$ };
//     if (Array.isArray(g.ANSWER)) {
//       item['details'] = g.ANSWER.map((a: any) => a?.$ || {});
//     } else {
//       item['details'] = [g.ANSWER?.$];
//     }

//     return item;
//   });

//   parsedReport['OWNER_INFORMATION'] =
//     residentialReport.OWNER_INFORMATION?.ANSWER?.map((i: any) => i.$ || {}) || [];

//   parsedReport['PORCH'] = residentialReport.PORCH?.ANSWER?.map((i: any) => i.$) || [];

//   parsedReport['QUALITY_WIZARD_INFORMATION'] =
//     residentialReport.QUALITY_WIZARD_INFORMATION?.ANSWER?.map((i: any) => i.$);

//   return parsedReport;
// }

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
