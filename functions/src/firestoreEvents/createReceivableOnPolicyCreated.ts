import { Organization, Policy, orgsCollection } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { getReportErrorFn, receivablesCollection, stripeSecretKey } from '../common/index.js';
import { createDocId, getDocData } from '../modules/db/utils.js';
import { generateInvoiceForReceivable } from '../modules/payments/generateInvoiceForReceivable.js';
import {
  createReceivableObject,
  getInvoiceDueDateTS,
  getLcnSummariesByCusId,
} from '../modules/payments/index.js';
import { getComm } from '../modules/rating/utils.js';
import { getStripe } from '../services/stripe.js';
import { verify } from '../utils/index.js';

// TODO: move to pub sub ?? or module so it can be reused for policy changes, renewal, etc.
// scenarios:
//    - create receivable from new policy
//    - create receivable from adding location
//    - policy renewal

// TODO: send notifications to each billing entity
//    - if invoice --> create invoice and send
//    - if checkout or empty --> link to checkout page for receivable

const reportErr = getReportErrorFn('createReceivableOnPolicyCreated');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
    }
  >
) => {
  const { policyId } = event.params;
  info(`policy created (${policyId}) - creating receivables...`);
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    let p = event.data?.data() as Policy;
    verify(p, 'new policy missing data');
    const policy = { ...p, id: policyId };

    const db = getFirestore();
    const receivablesCol = receivablesCollection(db);

    const billingEntityIds = Object.keys(policy.billingEntities);

    const agencyId = policy.agency.orgId;
    const orgRef = orgsCollection(db).doc(agencyId);
    const org = await getDocData<Organization>(orgRef);
    const stripeAccountId = org.stripeAccountId;
    if (!stripeAccountId) throw new Error('missing stripe account Id');

    const stripe = getStripe(stripeSecretKey.value());
    const batch = db.batch();
    const receivableIds = [];

    // const subProducerCommPct = await getSubProducerCommPct(db, policy);
    const { subproducerCommissionPct } = await getComm(
      policy.commSource,
      policy.agency.orgId,
      policy.agent.userId,
      policy.product
    );

    for (let cusId of billingEntityIds) {
      const totals = policy.totalsByBillingEntity[cusId];
      if (!totals) throw new Error(`missing totals for billing ID ${cusId}`);

      const billingEntityLocations = getLcnSummariesByCusId(cusId, policy.locations);

      const receivable = await createReceivableObject(stripe, {
        cusId,
        policyId,
        totals,
        billingEntityLocations,
        subProducerCommPct: subproducerCommissionPct,
        dueDate: getInvoiceDueDateTS(
          policy?.metadata?.created || Timestamp.now(),
          policy.effectiveDate
        ),
      });

      let receivableRef = receivablesCol.doc(`rec_${createDocId(7)}`);
      info(`adding receivable ${receivableRef.id} to batch for policy ${policyId}`, {
        ...receivable,
      });

      batch.set(receivableRef, receivable);
      receivableIds.push(receivableRef.id);
    }

    await batch.commit();

    // emit pub sub event to create invoice for receivable ??
    // TODO: move to correct place --> temp including here for testing
    for (let receivableId of receivableIds) {
      try {
        let invoiceId = await generateInvoiceForReceivable(stripe, receivableId);
        await stripe.invoices.sendInvoice(invoiceId);
        info(`Created invoice for receivable ${invoiceId}`);
      } catch (err: any) {
        reportErr(`Error creating / sending invoice for receivable `, { receivableId }, err);
      }
    }
    return;
  } catch (err: any) {
    let msg = 'Error creating receivable for new policy';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
    return;
  }
};
