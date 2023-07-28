import { Response } from 'firebase-functions/v1';
import { error, info } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { flatten } from 'lodash';
import { format } from 'date-fns';
// Axios no exported type bug
// import { ExportSdkClient } from '@exportsdk/client';

import { ExportSdkClient } from '../services/exportSDK';
import {
  Address,
  Nullable,
  Policy,
  PolicyLocation,
  RequestUserAuth,
  calcSum,
  decPageTemplateId,
  dollarFormat,
  dollarFormat2,
  exportSDKKey,
  formatPhoneNumber,
  policiesCollection,
} from '../common';
import { validateFirebaseIdToken } from './middlewares';
import { generatePolicyDecPDF } from '../services/pdf';
import { formatLocationData } from '../services/pdf/utils';
import { AdditionalInterestsItem, PolicyDecPDFLocations } from '../services/pdf/components';

// example using react-pdf directly: https://exportsdk.com/how-to-generate-pdfs-with-nodejs
// https://github.com/firebase/functions-samples/blob/main/Node-1st-gen/authorized-https-endpoint/functions/index.js

// NOTE: using v1 because hosting redirects don't work with v2
// need to use express to add auth token middleware

// TODO: store record of when policy was generated in subcollection of policy?
// with template, template version, timestamp, requesting user, etc. ??
// interface CoverageSummaryItem {
//   coverageTitle: string;
//   coverageAmount: string;
// }

// interface LocationInterestsItem {
//   locationAddress: string;
//   interestType: string;
//   name: string;
//   interestAddress: string;
//   loanNumber: string;
// }

interface LocationCoveragesItem {
  address: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  TIV: string;
}

interface PremiumTableItem {
  itemTitle: string;
  subjectAmount: string;
  rate: string;
  value: string;
}

export interface DecPageTemplateData extends Record<string, unknown> {
  policyId: string;
  insuredEmail: string;
  insuredName: string;
  mailingAddressName: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingPostal: string;
  mailingState: string;
  policyEffectiveDate: string;
  policyExpirationDate: string;
  issuingCarrier: string;
  agencyName: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyPostal: string;
  agentName: string;
  agentEmail: string;
  agentphone: string;
  surplusLinesLicenseNum: string;
  surplusLinesLicensePhone: string;
  surplusLinesLicenseState: string;
  surplusLinesName: string;
  mortgagee?: string;
  mortgageeAddressLine1?: string;
  mortgageeAddressLine2?: string;
  mortgageeCity?: string;
  mortgageeState?: string;
  mortgageePostal?: string;
  mortgageeLoanNum?: string;
  locationCoverages: LocationCoveragesItem[];
  locationInterests: AdditionalInterestsItem[]; // LocationInterestsItem[];
  premiumTable: PremiumTableItem[];
  docsAttached: { docTitle: string }[];
}

const app = express();
// const router = express.Router();

app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validateFirebaseIdToken);

// using ExportSDK template
app.post('/generatePolicy', async (req: RequestUserAuth, res: Response) => {
  const { policyId } = req.body;
  info('new generate policy request received', { ...req.body });

  const userToken = req.user;

  if (!userToken?.uid) {
    res.status(403).send('must be signed in');
    return;
  }

  if (!policyId) {
    res.status(400).send('policyId required');
    return;
  }

  const db = getFirestore();

  let policy: Policy;
  try {
    const policySnap = await policiesCollection(db).doc(policyId).get();

    const policyData = policySnap.data();

    if (!policySnap.exists || !policyData) {
      res.status(404).send(`policy not found (ID: ${policyId})`);
      return;
    }

    policy = policyData;
  } catch (err: any) {
    error('Error fetching policy', { err });
    res.status(500).send(`error fetching policy (${policyId})`);
    return;
  }

  const client = new ExportSdkClient(exportSDKKey.value());

  const locations = policy.locations && Object.values(policy.locations);
  if (!locations || !locations.length) {
    res.status(400).send('missing locations in policy');
    return;
  }

  const mortgagee: Partial<DecPageTemplateData> = {};
  if (locations.length === 1) {
    const location = locations[0];
    const mortgageeInterest = location.mortgageeInterest && location.mortgageeInterest[0];
    if (mortgageeInterest) {
      mortgagee.mortgagee = mortgageeInterest.name;
      const addr = mortgageeInterest.address;
      mortgagee.mortgageeAddressLine1 = addr?.addressLine1 || '';
      mortgagee.mortgageeAddressLine2 = addr?.addressLine2 || '';
      mortgagee.mortgageeCity = addr?.city || '';
      mortgagee.mortgageeState = addr?.state || '';
      mortgagee.mortgageePostal = addr?.postal || '';
      mortgagee.mortgageeLoanNum = mortgageeInterest.loanNumber || '';
    }
  }

  const locationCoverages = getLocationCoveragesTableData(locations);
  // const test = getLocationCoveragesTableDataTest();
  const locationInterests = getLocationInterests(locations);
  const premiumTable = getPremiumTable(policy);

  const policyEffectiveDate = format(policy.effectiveDate.toDate(), 'MMM dd, yyyy');
  const policyExpirationDate = format(policy.expirationDate.toDate(), 'MMM dd, yyyy');

  const {
    namedInsured,
    agent,
    agency,
    issuingCarrier,
    mailingAddress,
    surplusLinesProducerOfRecord: slLicense,
  } = policy;

  const templateId = decPageTemplateId.value();
  const templateData: DecPageTemplateData = {
    policyId,
    mailingAddressName: mailingAddress.name || namedInsured.displayName, // TODO: add name to mailing address // mailingAddress.name,
    mailingAddressLine1: mailingAddress?.addressLine1 || '',
    mailingAddressLine2: mailingAddress?.addressLine2 || '',
    mailingCity: mailingAddress?.city || '',
    mailingState: mailingAddress?.state || '',
    mailingPostal: mailingAddress?.postal || '',
    insuredEmail: namedInsured.email,
    insuredName: namedInsured.displayName,
    policyEffectiveDate,
    policyExpirationDate,
    agencyName: agency.name,
    agencyAddressLine1: agency?.address?.addressLine1,
    agencyAddressLine2: agency?.address?.addressLine2,
    agencyCity: agency?.address?.city,
    agencyState: agency?.address?.state,
    agencyPostal: agency?.address?.postal,
    agentEmail: agent?.email,
    agentName: agent?.name,
    agentphone: formatPhoneNumber(policy?.agent?.phone || '') || '',
    issuingCarrier: issuingCarrier,
    surplusLinesLicenseNum: slLicense.licenseNum,
    surplusLinesName: slLicense.name,
    surplusLinesLicenseState: slLicense.licenseState,
    surplusLinesLicensePhone: formatPhoneNumber(slLicense.phone || '') || '',
    locationCoverages, // : [...locationCoverages, ...test],
    locationInterests,
    premiumTable,
    ...mortgagee,
    docsAttached: [
      {
        docTitle: 'Example Doc Attachment One',
      },
      {
        docTitle: 'Example Doc Attachment Two',
      },
      {
        docTitle: 'Example Doc Attachment Three',
      },
      {
        docTitle: 'Example Doc Attachment Four',
      },
    ],
  };

  // TODO: fetch static files & combine
  try {
    const stream = await client.renderPdfToStream<DecPageTemplateData>(templateId, templateData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment;filename=export.pdf`);

    stream.data.pipe(res);
  } catch (err: any) {
    error('error generating pdf', { err });
    res.status(500).send('error generating pdf');
  }
  return;
});

export interface DecPageTemplateData2 extends Record<string, unknown> {
  policyId: string;
  insuredEmail: string;
  insuredName: string;
  mailingAddressName: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingPostal: string;
  mailingState: string;
  policyEffectiveDate: string;
  policyExpirationDate: string;
  issuingCarrier: string;
  agencyName: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyPostal: string;
  agentName: string;
  agentEmail: string;
  agentphone: string;
  surplusLinesLicenseNum: string;
  surplusLinesLicensePhone: string;
  surplusLinesLicenseState: string;
  surplusLinesName: string;
  mortgagee?: string;
  mortgageeAddressLine1?: string;
  mortgageeAddressLine2?: string;
  mortgageeCity?: string;
  mortgageeState?: string;
  mortgageePostal?: string;
  mortgageeLoanNum?: string;
  // locationCoverages: LocationCoveragesItem[];
  locationData: PolicyDecPDFLocations[];
  locationInterests: AdditionalInterestsItem[];
  premiumTable: PremiumTableItem[];
  docsAttached: { docTitle: string }[];
}

// using react-pdf
app.post('/generateDecPDF', async (req: RequestUserAuth, res: Response) => {
  const { policyId } = req.body;
  info('new generate policy request received', { ...req.body });

  const userToken = req.user;

  if (!userToken?.uid) {
    res.status(403).send('must be signed in');
    return;
  }

  if (!policyId) {
    res.status(400).send('policyId required');
    return;
  }

  const db = getFirestore();

  let policy: Policy;
  try {
    const policySnap = await policiesCollection(db).doc(policyId).get();

    const policyData = policySnap.data();

    if (!policySnap.exists || !policyData) {
      res.status(404).send(`policy not found (ID: ${policyId})`);
      return;
    }

    policy = policyData;
  } catch (err: any) {
    error('Error fetching policy', { err });
    res.status(500).send(`error fetching policy (${policyId})`);
    return;
  }

  const locations = policy.locations && Object.values(policy.locations);
  if (!locations || !locations.length) {
    res.status(400).send('missing locations in policy');
    return;
  }

  const locationData = formatLocationData(policy.locations);
  const locationInterests = getLocationInterests(locations);
  const premiumTable = getPremiumTable(policy);

  const policyEffectiveDate = format(policy.effectiveDate.toDate(), 'MMM dd, yyyy');
  const policyExpirationDate = format(policy.expirationDate.toDate(), 'MMM dd, yyyy');

  const {
    namedInsured,
    agent,
    agency,
    issuingCarrier,
    mailingAddress,
    surplusLinesProducerOfRecord: slLicense,
  } = policy;

  const templateData: DecPageTemplateData2 = {
    policyId,
    mailingAddressName: mailingAddress.name || namedInsured.displayName, // TODO: add name to mailing address // mailingAddress.name,
    mailingAddressLine1: mailingAddress?.addressLine1 || '',
    mailingAddressLine2: mailingAddress?.addressLine2 || '',
    mailingCity: mailingAddress?.city || '',
    mailingState: mailingAddress?.state || '',
    mailingPostal: mailingAddress?.postal || '',
    insuredEmail: namedInsured.email,
    insuredName: namedInsured.displayName,
    policyEffectiveDate,
    policyExpirationDate,
    agencyName: agency.name,
    agencyAddressLine1: agency?.address?.addressLine1,
    agencyAddressLine2: agency?.address?.addressLine2,
    agencyCity: agency?.address?.city,
    agencyState: agency?.address?.state,
    agencyPostal: agency?.address?.postal,
    agentEmail: agent?.email,
    agentName: agent?.name,
    agentphone: formatPhoneNumber(policy?.agent?.phone || '') || '',
    issuingCarrier: issuingCarrier,
    surplusLinesLicenseNum: slLicense.licenseNum,
    surplusLinesName: slLicense.name,
    surplusLinesLicenseState: slLicense.licenseState,
    surplusLinesLicensePhone: formatPhoneNumber(slLicense.phone || '') || '',
    // locationCoverages, // : [...locationCoverages, ...test],
    locationData,
    locationInterests,
    premiumTable,
    // ...mortgagee,
    docsAttached: [
      // {
      //   docTitle: 'Example Doc Attachment One',
      // },
      // {
      //   docTitle: 'Example Doc Attachment Two',
      // },
      // {
      //   docTitle: 'Example Doc Attachment Three',
      // },
      // {
      //   docTitle: 'Example Doc Attachment Four',
      // },
    ],
  };

  try {
    const result = await generatePolicyDecPDF(templateData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=export.pdf`);

    // Streaming resulting pdf back to the user
    result.pipe(res);
  } catch (err: any) {
    error('Error generating PDF from react-pdf template', { err });
    res.status(500).send('Error generating pdf');
  }

  return;
});

// app.use('/pdf-api', router);

export default app;

export function getFormattedAddress(addr: Nullable<Address>) {
  let formatted = `${addr?.addressLine1 || ''}`;
  if (addr?.addressLine2) formatted += `, ${addr.addressLine2}`;
  if (addr?.city) formatted += `, ${addr.city}`;
  if (addr?.state) formatted += `, ${addr.state}`;
  if (addr?.postal) formatted += `, ${addr.postal}`;

  return formatted;
}

export function getLocationCoveragesTableData(
  locations: PolicyLocation[]
): LocationCoveragesItem[] {
  return locations.map((l) => {
    const tiv = calcSum(Object.values(l.limits));
    return {
      address: getFormattedAddress(l.address),
      limitA: l.limits?.limitA ? dollarFormat(l.limits?.limitA) : '',
      limitB: l.limits?.limitB ? dollarFormat(l.limits?.limitB) : '',
      limitC: l.limits?.limitC ? dollarFormat(l.limits?.limitC) : '',
      limitD: l.limits?.limitD ? dollarFormat(l.limits?.limitD) : '',
      TIV: typeof tiv === 'number' ? dollarFormat(tiv) : '',
    };
  });
}

// TODO: refactor - use for loops instead of map and remove flatten
export function getLocationInterests(locations: PolicyLocation[]): AdditionalInterestsItem[] {
  let interests = locations.map((l) => {
    const addr = getFormattedAddress(l.address);
    const additionalInsureds: AdditionalInterestsItem[] = l.additionalInsureds?.map((ai) => ({
      locationAddress: addr,
      locationId: l.locationId,
      interestType: 'additional insured',
      name: ai.name,
      interestAddress: ai.address?.addressLine1 ? getFormattedAddress(ai.address) : '',
      loanNumber: '',
    }));
    const mortgagee = l.mortgageeInterest?.map((mi) => ({
      locationAddress: addr,
      locationId: l.locationId,
      interestType: 'mortgagee',
      name: mi.name,
      interestAddress: mi.address?.addressLine1 ? getFormattedAddress(mi.address) : '',
      loanNumber: mi.loanNumber || ('' as string),
    }));
    return [...additionalInsureds, ...mortgagee];
  });

  return flatten(interests);
}

export function getPremiumTable(policy: Policy): PremiumTableItem[] {
  let result = [
    {
      itemTitle: 'Term Premium',
      subjectAmount: '',
      rate: '',
      value: dollarFormat2(policy.termPremium),
    },
  ];

  if (policy.fees && Array.isArray(policy.fees)) {
    for (const fee of policy.fees) {
      result.push({
        itemTitle: fee.feeName,
        subjectAmount: '',
        rate: '',
        value: dollarFormat2(fee.feeValue),
      });
    }
  }
  if (policy.taxes && Array.isArray(policy.taxes)) {
    for (const tax of policy.taxes) {
      result.push({
        itemTitle: tax.displayName,
        subjectAmount: '',
        rate: '',
        value: dollarFormat2(tax.value),
      });
    }
  }

  result.push({
    itemTitle: 'Total price',
    subjectAmount: '',
    rate: '',
    value: dollarFormat2(policy.price),
  });

  return result;
}

// import { Request, HttpsError } from 'firebase-functions/v2/https';
// import { Response } from 'firebase-functions/v1';
// import { error, info } from 'firebase-functions/logger';
// import { getFirestore } from 'firebase-admin/firestore';
// import { getAuth } from 'firebase-admin/auth';
// import { ExportSdkClient } from '@exportsdk/client';

// import { Policy, decPageTemplateId, exportSDKKey, policiesCollection } from '../common';

// // https://github.com/firebase/functions-samples/blob/main/Node-1st-gen/authorized-https-endpoint/functions/index.js

// // NOTE: using v1 because hosting redirects don't work with v2
// // need to use express to add auth token middleware

// // TODO: store record of when policy was generated in subcollection of policy?
// // with template, template version, timestamp, requesting user, etc. ??

// // interface GeneratePolicyProps {
// //   policyId: string;
// // }

// interface DecPageTemplateData extends Record<string, unknown> {
//   insuredAddressLine1: string;
//   insuredAddressLine2: string;
//   insuredCity: string;
//   insuredEmail: string;
//   insuredName: string;
//   insuredPostal: string;
//   insuredState: string;
//   insurerName: string;
//   agencyAddressLine1: string;
//   agencyAddressLine2: string;
//   agencyCity: string;
//   agencyName: string;
//   agencyPostal: string;
//   agencyState: string;
//   agentEmail: string;
//   agentName: string;
//   agentphone: string;
//   policyEffectiveDate: string;
//   policyExpirationDate: string;
//   policyId: string;
//   surplusLinesLicenseNum: string;
//   surplusLinesLicensePhone: string;
//   surplusLinesLicenseState: string;
//   surplusLinesName: string;
//   docsAttached: { docTitle: string }[];
// }

// // const generatePolicyPDF = async ({ data, auth }: CallableRequest<GeneratePolicyProps>) => {
// export default async (req: Request, res: Response) => {
//   const { policyId } = req.body;
//   info('new generate policy request received', { ...req.body });

//   const userToken = await getUserToken(req)

//   if (!policyId) throw new HttpsError('failed-precondition', 'policyId required');

//   if (!userToken?.uid) throw new HttpsError('unauthenticated', 'must be signed in');

//   const db = getFirestore();

//   let policy: Policy;
//   try {
//     const policySnap = await policiesCollection(db).doc(policyId).get();

//     const policyData = policySnap.data();

//     if (!policySnap.exists || !policyData)
//       throw new HttpsError('not-found', `policy not found (ID: ${policyId})`);

//     policy = policyData;
//   } catch (err: any) {
//     error('Error fetching policy', { err });
//     if (err instanceof HttpsError) throw err;
//     let msg = `error fetching policy (${policyId})`;
//     if (err.message) msg = err.message;
//     throw new HttpsError('internal', msg);
//   }

//   const client = new ExportSdkClient(exportSDKKey.value());

//   const templateId = decPageTemplateId.value();
//   const templateData: DecPageTemplateData = {
//     insuredAddressLine1: '806 Olympic St',
//     insuredAddressLine2: 'STE 204',
//     insuredCity: 'Nashville',
//     insuredEmail: 'spencer.carlson@gmail.com',
//     insuredName: 'Spencer Carlson',
//     insuredPostal: '12333',
//     insuredState: 'TN',
//     insurerName: 'Rockingham Insurance',
//     agencyAddressLine1: '123 Main St',
//     agencyAddressLine2: 'Suite 2000',
//     agencyCity: 'Nashville',
//     agencyName: 'ABC Insurance Co.',
//     agencyPostal: '12345',
//     agencyState: 'TN',
//     agentEmail: 'test@gmail.com',
//     agentName: 'John Doe',
//     agentphone: '(123) 234-2983',
//     policyEffectiveDate: 'August 31, 2023',
//     policyExpirationDate: 'August 31, 2024',
//     policyId: '123LSKDJF2L3K4LKJ',
//     surplusLinesLicenseNum: '123LICENSE',
//     surplusLinesLicensePhone: '(234) 234-2344',
//     surplusLinesLicenseState: 'TN',
//     surplusLinesName: 'Ron Carlson',
//     docsAttached: [
//       {
//         docTitle: 'Example Doc Attachment One',
//       },
//       {
//         docTitle: 'Example Doc Attachment Two',
//       },
//       {
//         docTitle: 'Example Doc Attachment Three',
//       },
//       {
//         docTitle: 'Example Doc Attachment Four',
//       },
//     ],
//   };

//   // TODO: fetch static files
//   try {
//     // use binary to merge pdfs?? or stream to temp file then stream attachements to temp ??
//     // const binary = await client.renderPdf<DecPageTemplateData>(templateId, templateData);

//     const stream = await client.renderPdfToStream<DecPageTemplateData>(templateId, templateData);

//     // example: https://exportsdk.com/how-to-generate-pdfs-with-nodejs
//     // // Calling the template render func with dynamic data
//     // const result = await createTemplate(req.body);

//     // // Setting up the response headers
//     // res.setHeader('Content-Type', 'application/pdf');
//     // res.setHeader('Content-Disposition', `attachment; filename=export.pdf`);

//     // // Streaming our resulting pdf back to the user
//     // result.pipe(res);

//     res.setHeader('Content-Type', 'application/pdf')
//     res.setHeader('Content-Disposition', `attachment;filename=export.pdf`)

//     res.pipe(stream)

//   } catch (err: any) {
//     error('error generating pdf', { err })
//     // res.status(500).send()
//     throw new HttpsError('internal', 'error generating pdf')
//   }
// };

// // const validateFirebaseIdToken = async (req, res, next) => {
// async function getUserToken(req: Request) {
//   info('Checking if request is authorized with Firebase ID token');

//   if (
//     (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
//     !(req.cookies && req.cookies.__session)
//   ) {
//     error(
//       'No Firebase ID token was passed as a Bearer token in the Authorization header.',
//       'Make sure you authorize your request by providing the following HTTP header:',
//       'Authorization: Bearer <Firebase ID Token>' // ,
//       // 'or by passing a "__session" cookie.'
//     );
//     // res.status(403).send('Unauthorized');
//     // return;
//     throw new HttpsError('unauthenticated', 'unauthorized');
//   }

//   let idToken;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     info('Found "Authorization" header');
//     // Read the ID Token from the Authorization header.
//     idToken = req.headers.authorization.split('Bearer ')[1];
//   }
//   // else if (req.cookies) {
//   //   functions.logger.log('Found "__session" cookie');
//   //   // Read the ID Token from cookie.
//   //   idToken = req.cookies.__session;
//   // }
//   else {
//     // res.status(403).send('Unauthorized');
//     // return;
//     throw new HttpsError('unauthenticated', 'unauthorized');
//   }

//   try {
//     const decodedIdToken = await getAuth().verifyIdToken(idToken);
//     info('ID Token correctly decoded', { decodedIdToken });
//     return decodedIdToken;
//     // req.user = decodedIdToken;
//     // next();
//     // return;
//   } catch (err) {
//     error('Error while verifying Firebase ID token', { err });
//     throw new HttpsError('unauthenticated', 'unauthorized');
//     // res.status(403).send('Unauthorized');
//     // return;
//   }
// }

// {
//   "agencyAddressLine1": "123 Main St",
//   "agencyAddressLine2": "Suite 2000",
//   "agencyCity": "Nashville",
//   "agencyName": "ABC Insurance Co.",
//   "agencyPostal": "12345",
//   "agencyState": "TN",
//   "agentEmail": "test@gmail.com",
//   "agentName": "John Doe",
//   "agentphone": "(123) 234-2983",
//   "insuredAddressLine1": "806 Olympic St",
//   "insuredAddressLine2": "STE 204",
//   "insuredCity": "Nashville",
//   "insuredEmail": "spencer.carlson@gmail.com",
//   "insuredName": "Spencer Carlson",
//   "insuredPostal": "12333",
//   "insuredState": "TN",
//   "insurerName": "Rockingham Insurance",
//   "policyEffectiveDate": "August 31, 2023",
//   "policyExpirationDate": "August 31, 2024",
//   "policyId": "123LSKDJF2L3K4LKJ",
//   "surplusLinesLicenseNum": "123LICENSE",
//   "surplusLinesLicensePhone": "(234) 234-2344",
//   "surplusLinesLicenseState": "TN",
//   "surplusLinesName": "Ron Carlson",
//   "mortgagee": "",
//   "mortgageeAddressLine1": "4567 State St.",
//   "mortgageeAddressLine2": "PO Box 1290",
//   "mortgageeCity": "Los Angeles",
//   "mortgageeState": "CA",
//   "mortgageePostal": "90007",
//   "mortgageeLoanNum": "123TEST",
//   "coverageSummary": [
//     {
//       "coverageTitle": "Building",
//       "coverageAmount": "$ 800,000"
//     },
//     {
//       "coverageTitle": "Contents",
//       "coverageAmount": "$ 200,000"
//     }
//   ],
//   "docsAttached": [
//     {
//       "additonalDocs": "Example Doc Attachment One"
//     },
//     {
//       "additonalDocs": "Example Doc Attachment Two"
//     },
//     {
//       "additonalDocs": "Example Doc Attachment Three"
//     },
//     {
//       "additonalDocs": "Example Doc Attachment Four"
//     }
//   ]
// }
