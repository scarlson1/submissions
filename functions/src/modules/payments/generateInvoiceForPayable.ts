import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { round } from 'lodash-es';
import Stripe from 'stripe';
import { payablesCollection } from '../../common/index.js';
import { getDocData } from '../db/index.js';

// process idea - create draft invoice for payable
// add payables to batch with policy
// on payable created firestore event --> finalize invoice ?? (currently sending in onPolicyCreated event)

// payment intent created when invoice is finalized (update payable from payment intent created or invoice finalized event ??)

// TODO: don't allow creating new invoice if already exists on payable ??
// or only allow if invoice expired ?? (if already exists --> fetch invoice --> if expired --> create new one)
// throw error if invoice is paid ??
// TODO: func for updating payable amounts ?? need to update invoice too - dont allow unless draft or open

/**
 * Creates invoice and line items from payable, and adds invoice ID to payable doc
 * @param {Stripe} stripe Stripe instance
 * @param {string} payableId payable doc ID
 * @param {Omit<Stripe.InvoiceCreateParams, 'customer'>} invoiceOptions add/override invoice properties
 * @returns {string} invoice ID
 */
export const generateInvoiceForPayable = async (
  stripe: Stripe,
  payableId: string,
  invoiceOptions?: Omit<Stripe.InvoiceCreateParams, 'customer'>
) => {
  const db = getFirestore();
  const payableRef = payablesCollection(db).doc(payableId);
  const payable = await getDocData(payableRef, `Payable not found (ID: ${payableRef.id})`);

  const invoiceDueDate = payable.dueDate;
  const dueDateSeconds = round(invoiceDueDate.toMillis() / 1000);

  const invoice = await stripe.invoices.create({
    customer: payable.stripeCustomerId,

    description: `Invoice for policy ${payable.policyId}, billed to ${
      payable.billingEntityDetails?.name || payable.billingEntityDetails.email
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
      // transferGroup: payable.transferGroup, // only available once payment intent created
      ...(invoiceOptions?.metadata || {}),
      policyId: payable.policyId,
    },
    currency: 'USD',
    // can add up to 4 custom fields (displayed on invoice)
    custom_fields: [
      {
        name: 'Policy ID',
        value: payable.policyId,
      },
      // TODO: add transaction type (new policy, endorsement, etc ) ??
    ],
  });

  info(`Stripe invoice created ${invoice.id} from payable ${payable.id}`, {
    policyId: payable.policyId,
  });

  // The maximum number of invoice items is 250.
  // If set auto_advance to false, can continue to modify the invoice until it's finalized
  // TODO: subgroups / summarize for taxes and fees
  // https://stripe.com/docs/invoicing/group-line-items
  // item grouping (beta): https://stripe.com/docs/invoicing/line-item-grouping
  const premiumItemPromise = stripe.invoiceItems.create({
    customer: payable.stripeCustomerId,
    amount: payable.termPremiumAmount,
    invoice: invoice.id,
    description: `Term premium for policy ${payable.policyId}`,
  });
  const feeItemPromises = payable.fees.map((f) =>
    stripe.invoiceItems.create({
      customer: payable.stripeCustomerId,
      amount: f.value * 100,
      invoice: invoice.id,
      description: f.displayName,
    })
  );
  const taxItemPromises = payable.taxes.map((f) =>
    stripe.invoiceItems.create({
      customer: payable.stripeCustomerId,
      amount: f.value * 100,
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

  // set invoice Id on payable
  await payableRef.update({
    invoiceId: invoice.id,
    'metadata.updated': Timestamp.now(),
  });
  info(`set invoice ID ${invoice.id} on payable doc ${payableRef.id}`);

  return invoice.id;
};
