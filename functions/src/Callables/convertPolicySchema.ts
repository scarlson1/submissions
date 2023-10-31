import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { inspect } from 'util';
import { ZodError } from 'zod';
import {
  ILocationPolicy,
  Policy,
  locationsCollection,
  policiesCollection,
} from '../common/index.js';
import { createDocId } from '../modules/db/index.js';
import {
  calcPolicyPremium,
  calcPremiumByBillingEntity,
  getCarrierByState,
  sumPolicyTermPremiumIncludeCancels,
} from '../modules/rating/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { compressAddress } from '../utils/index.js';
import { requireIDemandAdminClaims, validate } from './utils/index.js';

interface ConvertPolicySchemaProps {
  policyId: string;
}

const convertPolicySchema = async ({ data, auth }: CallableRequest<ConvertPolicySchemaProps>) => {
  info(`convert policy schema called...`, { ...data });

  requireIDemandAdminClaims(auth?.token);
  const { policyId } = data;
  validate(policyId, 'failed-precondition', 'policy ID required');

  const db = getFirestore();
  const policySnap = await policiesCollection(db).doc(policyId).get();
  const policy = policySnap.data();
  validate(policySnap.exists && policy, 'not-found', `policy not found (ID ${policyId})`);

  const { locations, ...policyData } = policy;

  const lcns = Object.values(policy.locations);
  validate(lcns.length, 'failed-precondition', 'policy missing locations');
  validate(policyData.homeState, 'failed-precondition', 'home state required');

  try {
    const batch = db.batch();
    const locationsCol = locationsCollection(db);

    const policyLocations: Policy['locations'] = {};

    for (let lcn of lcns) {
      const lcnId = createDocId(9);
      const lcnData: ILocationPolicy = {
        ...(lcn as unknown as Omit<ILocationPolicy, 'parentType'>),
        // @ts-ignore
        address: {
          ...(lcn.address || {}), // @ts-ignore
          addressLine2: lcn?.address?.addressLine2 || '',
        },
        parentType: 'policy',
        policyId,
        locationId: lcnId,
        metadata: {
          // @ts-ignore
          created: lcn.metadata?.created ?? Timestamp.now(),
          updated: Timestamp.now(),
        },
      };

      const parsedLcn = ILocationPolicy.parse(lcnData);

      const policyLcn = {
        address: compressAddress(lcnData.address),
        coords: lcnData.coordinates,
        termPremium: lcnData.termPremium,
        annualPremium: lcnData.annualPremium,
        billingEntityId: 'namedInsured',
        cancelEffDate: lcnData.cancelEffDate || null,
      };
      policyLocations[lcnId] = policyLcn;

      const lcnRef = locationsCol.doc(lcnId);
      batch.set(lcnRef, parsedLcn);
    }

    const billingEntities: Policy['billingEntities'] = {
      namedInsured: {
        displayName: policy.namedInsured?.displayName,
        email: policy.namedInsured?.email,
        phone: policy.namedInsured?.phone,
        billingType: 'checkout',
        paymentMethods: [],
      },
    };

    const lcnArr = Object.values(policyLocations);
    const { termPremium, inStatePremium, outStatePremium } = calcPolicyPremium(
      policyData.homeState,
      lcnArr
    );

    const termPremiumWithCancels = sumPolicyTermPremiumIncludeCancels(lcnArr);

    const totalsByBillingEntity = calcPremiumByBillingEntity(
      lcnArr,
      termPremium,
      policyData.taxes,
      policyData.fees
    );

    const newPolicyData = {
      ...policyData,
      billingEntities,
      defaultBillingEntityId: 'namedInsured',
      totalsByBillingEntity,
      termPremiumWithCancels,
      inStatePremium,
      outStatePremium,
      term: policyData.term || 1, // @ts-ignore
      paymentStatus: policyData.status || null,
      locations: policyLocations,
      metadata: {
        ...policyData.metadata,
        updated: Timestamp.now(),
      },
    };
    if (!newPolicyData.issuingCarrier)
      newPolicyData['issuingCarrier'] = getCarrierByState(policyData.homeState);

    const parsedPolicy = Policy.parse(newPolicyData);

    batch.set(policySnap.ref, parsedPolicy);

    await batch.commit();

    return { status: 'success' };
  } catch (err: any) {
    // error(err);
    console.log(inspect(err, false, null));
    if (err instanceof HttpsError) throw err;
    const details = err instanceof ZodError ? { errors: err.flatten() } : {};
    throw new HttpsError('internal', 'error converting policy', details);
  }
};

export default onCallWrapper<ConvertPolicySchemaProps>('convertPolicySchema', convertPolicySchema);
