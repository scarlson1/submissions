import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import Stripe from 'stripe';
import { payablesCollection } from '../../common/index.js';
import { getDocData } from '../db/index.js';

// process idea - create draft invoice for payable
// add payables to batch with policy
// on payable created firestore event --> finalize invoice ??
// const invoice = await stripe.invoices.finalizeInvoice('{{INVOICE_ID}}');
// or "As soon as the an invoice is sent, Stripe finalizes it."
// const invoice = await stripe.invoices.sendInvoice('{{INVOICE_ID}}');

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
  // TODO: add due date to payable

  // create stripe invoice
  const invoice = await stripe.invoices.create({
    customer: payable.stripeCustomerId,
    description: `Invoice for policy ${payable.policyId}, billed to ${
      payable.billingEntityDetails?.name || payable.billingEntityDetails.email
    }`,
    // auto_advance: bool,
    collection_method: 'send_invoice',
    payment_settings: {
      payment_method_types: ['ach_debit', 'customer_balance', 'link', 'us_bank_account'], // TODO: look up difference between ach credit vs debit & us_bank_account
      ...(invoiceOptions?.payment_settings || {}),
    },
    // days_until_due: // TODO: calc using lesser of policy eff date and 30 days ??
    // due_date: // alt to days until due
    // effective_date: When defined, this value replaces the system-generated ‘Date of issue’ printed on the invoice PDF and receipt.
    ...(invoiceOptions || {}),
    metadata: {
      transferGroup: payable.transferGroup,
      ...(invoiceOptions?.metadata || {}),
      policyId: payable.policyId,
    },
    currency: 'USD',
  });
  info(`Stripe invoice created ${invoice.id} from payable ${payable.id}`, {
    policyId: payable.policyId,
  });

  // The maximum number of invoice items is 250.
  // If set auto_advance to false, can continue to modify the invoice until it's finalized
  // TODO: subgroups / summarize for taxes and fees
  // https://stripe.com/docs/invoicing/group-line-items
  // item grouping (beta): https://stripe.com/docs/invoicing/line-item-grouping
  const feeItemPromises = payable.fees.map((f) =>
    stripe.invoiceItems.create({
      customer: payable.stripeCustomerId,
      amount: f.value * 100,
      invoice: invoice.id,
      description: f.displayName,
    })
  );
  const taxItemPromises = payable.fees.map((f) =>
    stripe.invoiceItems.create({
      customer: payable.stripeCustomerId,
      amount: f.value * 100,
      invoice: invoice.id,
      description: f.displayName,
    })
  );
  const invoiceItems = await Promise.all([...feeItemPromises, ...taxItemPromises]);
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
