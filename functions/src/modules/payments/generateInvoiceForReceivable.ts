import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { round } from 'lodash-es';
import Stripe from 'stripe';
import { receivablesCollection } from '../../common/index.js';
import { getDocData } from '../db/index.js';

// process idea - create draft invoice for receivable
// add receivables to batch with policy
// on receivable created firestore event --> finalize invoice ?? (currently sending in onPolicyCreated event)

// payment intent created when invoice is finalized (update receivable from payment intent created or invoice finalized event ??)

// TODO: don't allow creating new invoice if already exists on receivable ??
// or only allow if invoice expired ?? (if already exists --> fetch invoice --> if expired --> create new one)
// throw error if invoice is paid ??
// TODO: func for updating receivable amounts ?? need to update invoice too - dont allow unless draft or open

/**
 * Creates invoice and line items from receivable, and adds invoice ID to receivable doc
 * @param {Stripe} stripe Stripe instance
 * @param {string} receivableId receivable doc ID
 * @param {Omit<Stripe.InvoiceCreateParams, 'customer'>} invoiceOptions add/override invoice properties
 * @returns {string} invoice ID
 */
export const generateInvoiceForReceivable = async (
  stripe: Stripe,
  receivableId: string,
  invoiceOptions?: Omit<Stripe.InvoiceCreateParams, 'customer'>
) => {
  const db = getFirestore();
  const receivableRef = receivablesCollection(db).doc(receivableId);
  const receivable = await getDocData(
    receivableRef,
    `Receivable not found (ID: ${receivableRef.id})`
  );

  const invoiceDueDate = receivable.dueDate;
  const dueDateSeconds = round(invoiceDueDate.toMillis() / 1000);

  const invoice = await stripe.invoices.create({
    customer: receivable.stripeCustomerId,

    description: `Invoice for policy ${receivable.policyId}, billed to ${
      receivable.billingEntityDetails?.name || receivable.billingEntityDetails.email
    }`,
    collection_method: 'send_invoice',
    payment_settings: {
      payment_method_types: ['us_bank_account', 'customer_balance'],
      // 'link' link requires card to be enabled ??
      // Err message: "To use 'link' with the PaymentElement, please pass both 'link' and 'card' as payment_method_types."
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: {
            type: 'us_bank_transfer',
          },
        },
      },
      ...(invoiceOptions?.payment_settings || {}),
    },
    // if collection method is send_invoice, must provide days_until_due or due_date
    due_date: dueDateSeconds,
    // effective_date: When defined, this value replaces the system-generated ‘Date of issue’ printed on the invoice PDF and receipt.
    ...(invoiceOptions || {}),
    metadata: {
      // transferGroup: receivable.transferGroup, // only available once payment intent created
      ...(invoiceOptions?.metadata || {}),
      policyId: receivable.policyId,
    },
    currency: 'USD',
    // can add up to 4 custom fields (displayed on invoice)
    custom_fields: [
      {
        name: 'Policy ID',
        value: receivable.policyId,
      },
      // TODO: add transaction type (new policy, endorsement, etc ) ??
    ],
  });

  info(`Stripe invoice created ${invoice.id} from receivable ${receivable.id}`, {
    policyId: receivable.policyId,
  });

  // The maximum number of invoice items is 250.
  // If set auto_advance to false, can continue to modify the invoice until it's finalized
  // TODO: subgroups / summarize for taxes and fees
  // https://stripe.com/docs/invoicing/group-line-items
  // item grouping (beta): https://stripe.com/docs/invoicing/line-item-grouping
  const premiumItemPromise = stripe.invoiceItems.create({
    customer: receivable.stripeCustomerId,
    amount: receivable.termPremiumAmount,
    invoice: invoice.id,
    description: `Term premium for policy ${receivable.policyId}`,
  });
  // TODO: switch to feeAmount (calc when receivable created)
  const feeItemPromises = receivable.fees.map((f) =>
    stripe.invoiceItems.create({
      customer: receivable.stripeCustomerId,
      amount: round(f.value * 100),
      invoice: invoice.id,
      description: f.displayName,
    })
  );
  // TODO: switch to taxAmount (calc when receivable created)
  const taxItemPromises = receivable.taxes.map((f) =>
    stripe.invoiceItems.create({
      customer: receivable.stripeCustomerId,
      amount: round(f.value * 100),
      invoice: invoice.id,
      description: f.displayName,
    })
  );
  const invoiceItems = await Promise.all([
    premiumItemPromise,
    ...feeItemPromises,
    ...taxItemPromises,
  ]);

  invoiceItems.forEach((invoiceItem) => {
    info(`${invoiceItem.description} item (ID: ${invoiceItem.id}) added to invoice ${invoice.id}`);
  });

  // set invoice Id on receivable
  await receivableRef.update({
    invoiceId: invoice.id,
    'metadata.updated': Timestamp.now(),
  });
  info(`set invoice ID ${invoice.id} on receivable doc ${receivableRef.id}`);

  return invoice.id;
};
