import { Collection, Policy, PolicyLocation, Quote } from '@idemand/common';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getReportErrorFn } from '../common/helpers.js';
import { calcPremiumByBillingEntity } from '../modules/rating/index.js';
import { onCallWrapper } from '../services/sentry/onCallWrapper.js';
import { compressAddress } from '../utils/helpers.js';
import { AgentAndAgencyDoc, requireOwnerAgentAdmin } from './utils/auth.js';
import { getDocData } from './utils/db.js';
import { validate } from './utils/validation.js';

// type DocWithBilling = {
//   defaultBillingEntityId: string;
//   // billingEntities: Record<string, BillingEntity>;
//   totalsByBillingEntity: TotalsByBillingEntity;
//   // homeState: State;
//   taxes: TaxItem[];
//   fees: FeeItem[];
//   // locations: Record<string, PolicyLocation>;
// } & AgentAndAgencyDoc &
//   Record<string, any>;

// calc for entire policy and update doc or pass data in body ??
// reusable for add/remove locations ??
const reportErr = getReportErrorFn('calcTotalsByBillingEntity');

interface CalcTotalsByBillingEntityRequest {
  collection: Collection;
  docId: string;
}

const calcTotalsByBillingEntity = async ({
  data,
  auth,
}: CallableRequest<CalcTotalsByBillingEntityRequest>) => {
  const { collection, docId } = data;
  validate(Collection.safeParse(collection).success, 'failed-precondition', 'invalid collection');
  validate(docId, 'failed-precondition', 'docId required');

  const db = getFirestore();
  const docRef = db.collection(collection).doc(docId); // as DocumentReference<DocWithBilling>;
  const docData = await getDocData(docRef);

  // only callable by user, agent, orgAdmin, iDemandAdmin
  requireOwnerAgentAdmin(auth, docData as AgentAndAgencyDoc);

  try {
    let lcnArr: PolicyLocation[] = [];
    let policyTermPremium;

    if (collection === 'policies') {
      // docData.locations
      let policyData = docData as any as Policy;
      lcnArr = Object.values(policyData.locations);
      policyTermPremium = policyData.termPremium;
    } else if (collection === 'quotes') {
      const quote = docData as any as Quote;
      validate(
        typeof quote.annualPremium === 'number' && quote.annualPremium > 100,
        'failed-precondition',
        'invalid annual premium'
      );
      let lcn: PolicyLocation = {
        address: compressAddress(quote.address),
        coords: quote.coordinates as GeoPoint,
        annualPremium: quote.annualPremium,
        termPremium: quote.annualPremium,
        billingEntityId: quote.defaultBillingEntityId,
      };
      lcnArr = [lcn];
      policyTermPremium = quote.annualPremium;
    }

    validate(typeof policyTermPremium === 'number', 'failed-precondition', 'invalid term premium');
    validate(
      lcnArr && lcnArr.length && PolicyLocation.safeParse(lcnArr[0]),
      'failed-precondition',
      'missing or invalid location data'
    );

    // const {
    //   termPremium: policyTermPremium,
    //   inStatePremium,
    //   outStatePremium,
    // } = calcPolicyPremium(docData.homeState, lcnArr);
    const totalsByBillingEntity = calcPremiumByBillingEntity(
      lcnArr,
      policyTermPremium,
      docData.taxes,
      docData.fees
    );

    await docRef.update({
      totalsByBillingEntity,
      'metadata.updated': Timestamp.now(),
    });

    return { totalsByBillingEntity };
  } catch (err: any) {
    reportErr('Error calculating totals by billing entity', data, err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'error calculating totals by billing entity');
  }
};

export default onCallWrapper<CalcTotalsByBillingEntityRequest>(
  'calcTotalsByBillingEntity',
  calcTotalsByBillingEntity
);
