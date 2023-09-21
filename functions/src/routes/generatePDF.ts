import * as bodyParser from 'body-parser';
import cors from 'cors';
import { format } from 'date-fns';
import express from 'express';
import 'express-async-errors';
import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { Response } from 'firebase-functions/v1';

import {
  Disclosure,
  ILocation,
  PolicyNew,
  Product,
  RequestUserAuth,
  WithId,
  disclosuresCollection,
  formatPhoneNumber,
  locationsCollection,
  policiesCollectionNew,
  statesList,
} from '../common/index.js';
import { getAllById } from '../modules/db/index.js';
import {
  AdditionalInterestsItem,
  PolicyDecPDFLocations,
} from '../services/pdf/components/index.js';
import {
  formatLocationData,
  generatePolicyDecPDF,
  getLocationInterests,
  getPremiumTable,
  tiptapJsonToText,
} from '../services/pdf/index.js';
import {
  currentUser,
  errorHandler,
  generatePDFSchema,
  requireAuth,
  validateRequest,
} from './middlewares/index.js';

// https://github.com/firebase/functions-samples/blob/main/Node-1st-gen/authorized-https-endpoint/functions/index.js

// NOTE: using v1 because hosting redirects don't work with v2

// TODO: store record of when policy was generated in subcollection of policy?
// with template, template version, timestamp, requesting user, etc. ??

interface PremiumTableItem {
  itemTitle: string;
  subjectAmount: string;
  rate: string;
  value: string;
}

const app = express();
// const router = express.Router();

app.use(cors()); // { origin: true }
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(validateFirebaseIdToken);
app.use(currentUser);
app.use(requireAuth);

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
  agentPhone: string;
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
  homeState: string;
  homeStateFullName: string;
  disclosure?: string;
}

app.post(
  '/generateDecPDF',
  generatePDFSchema,
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
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

    let policy: PolicyNew;
    try {
      const policySnap = await policiesCollectionNew(db).doc(policyId).get();

      const policyData = policySnap.data();

      if (!policySnap.exists || !policyData) {
        res.status(404).send(`policy not found (ID: ${policyId})`);
        return;
      }

      policy = policyData;
    } catch (err: any) {
      error('Error fetching policy', { err });
      // TODO: use custom error classes
      res.status(500).send(`error fetching policy (${policyId})`);
      return;
    }

    const locationIds = policy.locations && Object.keys(policy.locations);
    if (!locationIds || !locationIds.length) {
      res.status(400).send('missing locations in policy');
      return;
    }

    const locationsCol = locationsCollection(db);
    const locationsQuerySnap = await getAllById(locationsCol, locationIds);
    if (locationsQuerySnap.empty) {
      res.status(400).send('location records not found');
      return;
    }
    if (locationsQuerySnap.docs.length !== locationIds.length) {
      res.status(400).send('location record not found');
      return;
    }

    let locations = locationsQuerySnap.docs.map((snap) => ({
      ...snap.data(),
      id: snap.id,
    })) as WithId<ILocation>[];

    const locationData = formatLocationData(locations);
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
      homeState: policy?.homeState || '',
      homeStateFullName: statesList[policy?.homeState || ''] || '',
      agencyName: agency.name,
      agencyAddressLine1: agency?.address?.addressLine1,
      agencyAddressLine2: agency?.address?.addressLine2,
      agencyCity: agency?.address?.city,
      agencyState: agency?.address?.state,
      agencyPostal: agency?.address?.postal,
      agentEmail: agent?.email,
      agentName: agent?.name,
      agentPhone: formatPhoneNumber(policy?.agent?.phone || '') || '',
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
      const disclosureCol = disclosuresCollection(db);
      const disclosure = await getStateDisclosure(disclosureCol, policy.homeState, policy.product);
      if (disclosure && disclosure.content) {
        templateData['disclosure'] = tiptapJsonToText(disclosure.content);
      } else info(`No state disclosure found for ${policy.homeState}`);
    } catch (err: any) {
      console.log('error fetching disclosure / converting to HTML', err);
    }

    try {
      const result = await generatePolicyDecPDF(templateData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=export.pdf`);

      result.pipe(res);
    } catch (err: any) {
      error('Error generating PDF from react-pdf template', { err });
      res.status(500).send('Error generating pdf');
    }

    return;
  }
);

app.use(errorHandler);

// app.use('/pdf-api', router);

export default app;

export async function getStateDisclosure(
  colRef: CollectionReference<Disclosure>,
  state: string,
  product: Product
) {
  const snap = await colRef
    .where('state', '==', state)
    .where('products', 'array-contains', product)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data();
}
