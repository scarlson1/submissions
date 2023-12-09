import { Organization, Policy, orgsCollection } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { getReportErrorFn, payablesCollection, stripeSecretKey } from '../common/index.js';
import { createDocId, getDocData } from '../modules/db/utils.js';
import { generateInvoiceForPayable } from '../modules/payments/generateInvoiceForPayable.js';
import {
  createPayableObject,
  getInvoiceDueDateTS,
  getLcnSummariesByCusId,
} from '../modules/payments/index.js';
import { getComm } from '../modules/rating/utils.js';
import { getStripe } from '../services/stripe.js';
import { verify } from '../utils/index.js';

// TODO: move to pub sub ?? or module so it can be reused for policy changes, renewal, etc.
// scenarios:
//    - create payable from new policy
//    - create payable from adding location
//    - policy renewal

// TODO: send notifications to each billing entity
//    - if invoice --> create invoice and send
//    - if checkout or empty --> link to checkout page for payable

const reportErr = getReportErrorFn('createPayableOnPolicyCreated');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
    }
  >
) => {
  const { policyId } = event.params;
  info(`policy created (${policyId}) - creating payables...`);
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    let p = event.data?.data() as Policy;
    verify(p, 'new policy missing data');
    const policy = { ...p, id: policyId };

    const db = getFirestore();
    const payablesCol = payablesCollection(db);

    const billingEntityIds = Object.keys(policy.billingEntities);

    const agencyId = policy.agency.orgId;
    const orgRef = orgsCollection(db).doc(agencyId);
    const org = await getDocData<Organization>(orgRef);
    const stripeAccountId = org.stripeAccountId;
    if (!stripeAccountId) throw new Error('missing stripe account Id');

    const stripe = getStripe(stripeSecretKey.value());
    const batch = db.batch();
    const payableIds = [];

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

      const payable = await createPayableObject(stripe, {
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

      let payableRef = payablesCol.doc(`rec_${createDocId(7)}`);
      info(`adding payable ${payableRef.id} to batch for policy ${policyId}`, { ...payable });

      batch.set(payableRef, payable);
      payableIds.push(payableRef.id);
    }

    await batch.commit();

    // emit pub sub event to create invoice for payable ??
    // TODO: move to correct place --> temp including here for testing
    for (let payableId of payableIds) {
      try {
        let invoiceId = await generateInvoiceForPayable(stripe, payableId);
        await stripe.invoices.sendInvoice(invoiceId);
        info(`Created invoice for payable ${invoiceId}`);
      } catch (err: any) {
        reportErr(`Error creating / sending invoice for payable `, { payableId }, err);
      }
    }
    return;
  } catch (err: any) {
    let msg = 'Error creating payable for new policy';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
    return;
  }
};
