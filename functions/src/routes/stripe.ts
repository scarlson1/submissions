import { usersCollection } from '@idemand/common';
import axios from 'axios';
import express, { Response } from 'express';
import 'express-async-errors';
import { param } from 'express-validator';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Request as FBRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import invariant from 'tiny-invariant';
import {
  functionsBaseURL,
  getReportErrorFn,
  hostingBaseURL,
  mgaDomain,
  mgaOrgId,
  orgsCollection,
  RequestUserAuth,
  stripeEndpointSecret,
  stripeSecretKey,
} from '../common/index.js';
import {
  handleInvoiceFinalized,
  syncTransfer,
} from '../modules/payments/index.js';
import { setTransferGroupOnPaymentIntentCreated } from '../modules/payments/setTransferGroupOnPaymentIntentCreated.js';
import { getStripe } from '../services/index.js';
import {
  publishChargeSucceeded,
  publishRefundCreated,
} from '../services/pubsub/index.js';
import { createStripeConnectAccount } from '../utils/index.js';
import { NotAuthorizedError } from './errors/index.js';
import {
  currentUser,
  requireAuth,
  requireClaim,
  validateRequest,
} from './middlewares/index.js';
import {
  accountLinkSchema,
  accountSessionSchema,
} from './middlewares/schemas/stripe.js';

// event types: https://stripe.com/docs/api/events/types

// TODO: create separate endpoint for connected accounts: https://stripe.com/docs/connect/webhooks#connect-webhooks
// and invoice, charges, refunds ??

const reportErr = getReportErrorFn('stripe');

const endpointSecret = stripeEndpointSecret.value();

const app = express();

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // @ts-expect-error overriding request type
  async (req: FBRequest, res: Response) => {
    let event = req.body;
    // console.log('EVENT: ', event);
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const stripe = getStripe(stripeSecretKey.value());

    if (endpointSecret) {
      // Get the signature sent by Stripe
      // console.log('RAW HEADERS: ', req.rawHeaders); // @ts-ignore
      const signature = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature || '',
          endpointSecret,
        );
        // console.log('Signature verification succeeded');
      } catch (err: any) {
        const msg = `⚠️  Webhook signature verification failed. ${err.message}`;
        reportErr(
          msg,
          { eventType: event?.type, data: event?.data?.object || {} },
          err,
        );
        res.status(400).send({});
        return;
      }
    }

    console.log('Event Type => ', event.type);
    // console.log('Trigger Object Id => ', event.data.object.id);

    switch (event.type) {
      case 'payment_intent.created': {
        const createdPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('created payment intent: ', createdPaymentIntent);
        // update invoice-generated payment intent with transfer group from receivable doc
        await setTransferGroupOnPaymentIntentCreated(createdPaymentIntent);
        // TODO: delete ?? cannot update invoice-generated payment intent with transfer group - need to use source_charge directly ??

        break;
      }
      case 'payment_intent.partially_funded': {
        console.log('Pmt Intent partially funded: ', event.data.object);
        break;
      }
      case 'payment_intent.amount_capturable_updated': {
        console.log('Pmt Intent amt capturable updated: ', event.data.object);
        break;
      }
      // could use webhook to set the transfer group when invoice creates payment intent ??
      case 'payment_intent.processing': {
        const paymentIntentProcessing = event.data
          .object as Stripe.PaymentIntent;
        console.log('Pmt Intent Processing: ', paymentIntentProcessing);
        // TODO: handle payment intent processing

        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        console.log('payment failed: ', paymentIntentFailed);
        // TODO: handle payment intent failed

        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`,
        );
        // TODO: handle payment intent succeeded
        // use charge:succeeded instead ?? triggered by payment intent and invoice ??

        break;
      }
      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('payment method: ', paymentMethod);
        // TODO: handle pmt method attached
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);

        break;
      }
      case 'payment_method.dettached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('payment method detached: ', paymentMethod);

        break;
      }
      case 'payment_method.updated': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('payment method updated: ', paymentMethod);

        break;
      }
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('charge: ', charge);
        // emit pub sub event ??
        // trigger policy pmt status (might need to be updated by billing entity ??) or charge ID ??
        await publishChargeSucceeded({ charge });
        // TODO: need to use invoice.paid for out-of-band & invoice-native payment scenarios
        // TODO: doesn't run when payment made via bank transfer ? or paid out of network (paper check) ??
        // does invoice.paid or invoice_payment.paid ??

        break;
      }
      case 'charge.failed': {
        const failedCharge = event.data.object as Stripe.Charge;
        console.log('charge failed: ', failedCharge);

        break;
      }
      case 'charge.captured': {
        const capturedCharge = event.data.object as Stripe.Charge;
        console.log('charge captured: ', capturedCharge);

        break;
      }
      case 'charge.refunded': {
        const refundedCharge = event.data.object as Stripe.Charge;
        console.log('charge refunded: ', refundedCharge);
        // TODO: must reverse any transfers
        // use this event or 'refund.created' ??

        break;
      }
      case 'charge.pending': {
        const charge = event.data.object as Stripe.Charge;
        console.log('charge pending: ', charge);

        break;
      }
      // TODO: recommended connect endpoints: https://stripe.com/docs/connect/webhooks#connect-webhooks
      case 'account.updated': {
        // Allows you to monitor changes to connected account requirements and status changes.
        const account = event.data.object as Stripe.Account;
        console.log('account updated: ', account);

        break;
      }
      case 'payout.failed': {
        // Occurs when a payout fails. When a payout fails, the external account involved will be disabled, and no automatic or manual payouts can go through until the external account is updated.
        const failedPayout = event.data.object as Stripe.Payout;
        console.log('failed payout: ', failedPayout);

        break;
      }
      case 'payout.created': {
        const payout = event.data.object as Stripe.Payout;
        console.log('payout created: ', payout);

        break;
      }
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('payout paid: ', payout);

        break;
      }
      case 'payout.canceled': {
        const payout = event.data.object as Stripe.Payout;
        console.log('payout cancelled: ', payout);

        break;
      }
      case 'payout.updated': {
        const updatedPayout = event.data.object as Stripe.Payout;
        console.log('payout updated: ', updatedPayout);

        break;
      }
      // capability.updated
      case 'customer.created': {
        const createdCustomer = event.data.object as Stripe.Customer;
        console.log('customer created', createdCustomer);
        // ensure exists / set on user doc ??

        break;
      }
      case 'customer.deleted': {
        const deletedCustomer = event.data.object as Stripe.Customer;
        console.log('customer deleted', deletedCustomer);
        // await removeStripeCustomerId(deletedCustomer.id); // get by email & delete if id === deletedId ??

        break;
      }
      case 'customer.updated': {
        const updatedCustomer = event.data.object as Stripe.Customer;
        console.log('customer updated: ', updatedCustomer);

        break;
      }
      // case 'customer.source.created':
      // case 'customer.source.deleted':
      case 'customer.source.expiring': {
        const expiringSource = event.data.object as Stripe.Card;
        console.log('customer source expiring: ', expiringSource);

        break;
      }
      // case 'customer.source.updated':
      case 'customer.tax_id.created':
        console.log('customer tax id created');

        break;
      case 'customer.tax_id.deleted':
        console.log('customer tax id deleted');

        break;
      case 'customer.tax_id.updated':
        console.log('customer tax id updated');

        break;
      // case 'invoice.created':
      // case 'invoice.finalization_failed':
      case 'invoice.finalized': {
        const finalizedInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice finalized: ', finalizedInvoice);
        await handleInvoiceFinalized(finalizedInvoice);

        break;
      }
      case 'invoice.sent': {
        const sentInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice sent: ', sentInvoice);

        break;
      }
      case 'invoice.marked_uncollectible': {
        const uncollectibleInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice uncollectible: ', uncollectibleInvoice);

        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice paid: ', invoice);
        // need to handle receivable paid if invoice paid out of X (paper check ??) no charge.succeeded event ??
        // invoice.charge
        // invoice.paid_out_of_band
        // other successful payments handled by charge.paid event
        if (!invoice.charge) {
          // required values from charge object for createTaxTransactions, createTransfers, markPolicyPaid:
          // invoice, paid, receipt_number, receipt_url, payment_intent metadata, amount_captured, id

          const mockCharge: Stripe.Charge = {
            id: '',
            object: 'charge',
            application: null,
            application_fee: null,
            application_fee_amount: null,
            amount: invoice.amount_due,
            amount_captured: invoice.amount_paid,
            amount_refunded: 0, // invoice.amount
            balance_transaction: null,
            billing_details: {
              address: invoice.customer_address,
              email: invoice.customer_email,
              name: invoice.customer_name,
              phone: invoice.customer_phone,
            },
            calculated_statement_descriptor: invoice.statement_descriptor,
            created: Date.now(),
            currency: invoice.currency,
            description: invoice.description,
            captured: true,
            customer: invoice.customer,
            disputed: false,
            failure_balance_transaction: null,
            failure_code: null,
            failure_message: null,
            fraud_details: null,
            invoice: invoice.id,
            outcome: null,
            payment_method: null,
            payment_method_details: null,
            receipt_email: invoice.customer_email,
            livemode: invoice.livemode,
            metadata: invoice.metadata || {},
            on_behalf_of: invoice.on_behalf_of,
            paid: true,
            payment_intent: invoice.payment_intent,
            // payment_method: invoice.payment_settings.
            receipt_number: invoice.receipt_number,
            receipt_url: '',
            refunded: false,
            refunds: null,
            review: null,
            shipping: null,
            source: null,
            source_transfer: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'succeeded',
            // transfer: invoice.transfer_data?.destination,
            transfer_data: invoice.transfer_data,
            transfer_group: null, // invoice.transfer_data.
          };

          await publishChargeSucceeded({
            charge: mockCharge,
            paidOutOfBand: invoice.paid_out_of_band,
          });
        }

        break;
      }
      case 'invoice.payment_failed': {
        // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.
        const invoicePmtFailed = event.data.object as Stripe.Invoice;
        console.log('invoice pmt failed: ', invoicePmtFailed);

        break;
      }
      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice created: ', invoice);

        break;
      }
      case 'invoice.deleted': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice deleted: ', invoice);

        break;
      }
      case 'invoice.overdue': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice overdue: ', invoice);

        break;
      }
      case 'invoice.overpaid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice overpaid: ', invoice);

        break;
      }
      case 'invoice.updated': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice updated: ', invoice);

        break;
      }
      case 'invoice.voided': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice voided: ', invoice);

        break;
      }
      // case 'invoice_payment.paid': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   console.log('invoice_payment paid: ', invoice);

      //   break;
      // }
      // case 'invoice_payment.created': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   console.log('invoice_payment paid: ', invoice);

      //   break;
      // }
      // case 'invoice_payment.deleted': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   console.log('invoice_payment paid: ', invoice);

      //   break;
      // }
      case 'refund.created': {
        // Occurs whenever a refund from a customer’s cash balance is created.
        const refund = event.data.object as Stripe.Refund;
        console.log('refund created: ', refund);
        await publishRefundCreated({ refund });

        break;
      }
      case 'refund.updated': {
        // Occurs whenever a refund from a customer’s cash balance is updated.
        const updatedRefund = event.data.object as Stripe.Refund;
        console.log('refund created: ', updatedRefund);
        // any updates to receivable / transfers / taxes ??

        break;
      }
      // payout.failed (failure_code property indicates reason)
      // financial_connections.account.deactivated
      // financial_connections.account.reactivated
      // financial_connections.account.disconnected
      case 'person.created': {
        // Occurs whenever a person associated with an account is created.
        const createdPerson = event.data.object as Stripe.Person;
        console.log('person created: ', createdPerson);

        break;
      }
      case 'person.deleted': {
        // Occurs whenever a person associated with an account is deleted
        const deletedPerson = event.data.object as Stripe.Person;
        console.log('person deleted: ', deletedPerson);

        break;
      }
      case 'person.updated': {
        // Occurs whenever a person associated with an account is updated.
        const updatedPerson = event.data.object as Stripe.Person;
        console.log('person created: ', updatedPerson);

        break;
      }
      case 'transfer.created': {
        const createdTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer created: ', createdTransfer);
        await syncTransfer(createdTransfer, 'transfer.created');

        break;
      }
      case 'transfer.reversed': {
        const reversedTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer reversed: ', reversedTransfer);
        await syncTransfer(reversedTransfer, 'transfer.reversed');

        break;
      }
      case 'transfer.updated': {
        const updatedTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer updated: ', updatedTransfer);
        await syncTransfer(updatedTransfer, 'transfer.updated');

        break;
      }
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to ack event
    res.status(200).send({});
    return;
  },
);

app.use(express.json());
app.use(currentUser);
app.use(requireAuth);

// get Stripe client secret for embedded components (account onboarding, payments, payouts, etc.)
// ACCEPT ORG ID INSTEAD ??
app.post(
  '/accountSession',
  accountSessionSchema,
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    try {
      const accountId = req.body.accountId; // TODO: middleware to require account ID
      // const type = req.body.type || 'account_onboarding';
      const types = req.body.type;

      await verifyUserBelongsToOrg(req, accountId);

      // payments, payment_details, payouts in beta
      const stripe = getStripe(stripeSecretKey.value());
      const params: Stripe.AccountSessionCreateParams = {
        account: accountId,
        components: {
          payments: {
            enabled: types.includes('payments'), // TODO: pass type as array and check if payments is included ??
            features: {
              refund_management: false,
              dispute_management: false,
              capture_payments: false,
            },
          },
          payment_details: {
            enabled: types.includes('payment_details'),
            features: {
              refund_management: false,
              dispute_management: false,
              capture_payments: false,
            },
          },
          payouts: {
            enabled: types.includes('payouts'),
          },
        },
      };
      const accountSession = await stripe.accountSessions.create(params, {
        apiVersion: '2023-10-16; embedded_connect_beta=v2',
      });

      info('stripe account session created', {
        account: accountSession.account,
      });
      res.send({
        clientSecret: accountSession.client_secret,
      });
      return;
    } catch (err: any) {
      console.error(
        'An error occurred when calling the Stripe API to create an account session',
        err,
      );
      res.status(500).send({ error: err.message });
      return;
    }
  },
);

function extractUserOrg(req: RequestUserAuth) {
  let orgId = req.tenantId;
  if (
    req.user?.email?.endsWith(mgaDomain.value()) &&
    req.user?.email_verified
  ) {
    orgId = mgaOrgId.value();
  }
  if (!orgId) throw new Error('Tenant required');
  return orgId;
}

// TODO: move to middleware ??
async function verifyUserBelongsToOrg(req: RequestUserAuth, accountId: string) {
  const orgId = extractUserOrg(req);

  const orgStripeId = await getAccountId(getFirestore(), orgId);

  if (!orgStripeId || orgStripeId !== accountId) throw new NotAuthorizedError();
}

async function getAccountId(db: Firestore, orgId: string) {
  const orgSnap = await orgsCollection(db).doc(orgId).get();
  const accountId = orgSnap.data()?.stripeAccountId;
  if (!accountId) throw new Error('Org missing stripe account ID');
  return accountId;
}

// pass in accountId and reuse refresh endpoint ??
app.post(
  '/accountLink',
  requireClaim(['orgAdmin', 'iDemandAdmin']),
  accountLinkSchema, // TODO: update with returnUrl validation (not required)
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    try {
      const { orgId, returnUrl } = req.body; // or pass in query param & use get method??

      const uid = req.user?.uid;
      if (!uid) throw new NotAuthorizedError();
      const userSnap = await usersCollection(getFirestore()).doc(uid).get();
      if (userSnap.data()?.orgId !== orgId) throw new NotAuthorizedError();

      const accountId = await getAccountId(getFirestore(), orgId);

      const type = req.body.type || 'account_onboarding';

      const stripe = getStripe(stripeSecretKey.value());
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${functionsBaseURL.value()}/stripe/accountLink/${accountId}`,
        return_url: returnUrl || `${hostingBaseURL.value()}/account/org/stripe`,
        type,
        collect: 'eventually_due',
      });

      res.send({ accountLink: accountLink.url });
      return;
    } catch (err: any) {
      let msg = 'An error occurred creating account link';
      if (err.message) msg += `. ${err.message}`;
      console.error(msg, err);

      res.status(500).send({ error: msg });
      return;
    }
  },
);

// refresh account link (Stripe calls to get new link in some scenarios)
app.get(
  '/accountLink/:accountId',
  requireClaim(['orgAdmin', 'iDemandAdmin']),
  param('accountId').isString().notEmpty(),
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    try {
      let accountId = req.params?.accountId;
      invariant(accountId);
      accountId = Array.isArray(accountId) ? accountId[0] : accountId;

      const orgId = extractUserOrg(req);
      const orgStripeAccountId = await getAccountId(getFirestore(), orgId);
      if (orgStripeAccountId !== accountId) throw new NotAuthorizedError();

      const stripe = getStripe(stripeSecretKey.value());

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${functionsBaseURL.value()}/stripe/accountLink/${accountId}`, // needs to call account links again to generate a new link
        return_url: `${hostingBaseURL.value()}account/org/stripe`,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      res.redirect(accountLink.url);
      return;
    } catch (err: any) {
      let msg = 'An error occurred creating account link';
      if (err.message) msg += `. ${err.message}`;
      console.error(msg, err);

      res.status(500).send({ error: msg });
      return;
    }
  },
);

app.get(
  '/account/:orgId',
  requireClaim(['orgAdmin', 'iDemandAdmin']),
  param('orgId').isString().notEmpty(),
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    try {
      let orgId = req.params.orgId;
      if (Array.isArray(orgId)) orgId = orgId[0];
      const user = req.user;
      const isIDemandAdmin = user?.iDemandAdmin || false;

      console.log(orgId, user?.firebase.tenant, req.user);

      if (!isIDemandAdmin && orgId !== user?.firebase.tenant)
        throw new Error('tenantId must match requested orgId');

      const db = getFirestore();
      const accountId = await getAccountId(db, orgId);
      console.log(accountId);

      const stripe = getStripe(stripeSecretKey.value());
      const account = await stripe.accounts.retrieve(accountId);
      // TODO: check if we need to remove any sensitive info ??

      res.send({ ...account });
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: 'an error occurred' });
      return;
    }
  },
);

// createStripeConnectAccount can also be called as callable firebase function
app.get(
  '/account/initialize/:orgId',
  param('orgId').isString().notEmpty(),
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    let orgId = req.params.orgId;
    if (Array.isArray(orgId)) orgId = orgId[0];

    const user = req.user;
    const tenantId = req.tenantId;
    const isIDemandAdmin = user?.iDemandAdmin;
    const isOrgAdmin = user?.orgAdmin && orgId === tenantId;

    if (!(isIDemandAdmin || isOrgAdmin)) throw new NotAuthorizedError();

    try {
      const account = await createStripeConnectAccount(
        stripeSecretKey.value(),
        orgId,
      );

      res.status(201).send({ stripeAccountId: account.id });
    } catch (err: any) {
      const msg = 'Error creating stripe connect account';
      reportErr(`${msg} ${err?.message || ''}`.trim(), {}, err);
      res.status(500).send({ message: msg });
    }
  },
);

// Ensures stripe customer exists for each billing entity (by email)
// TODO: DELETE ?? moved to addBillingEntity callable function (& delete <BillingStep /> - replaced by <AddBillingEntity />) ?? Or keep in case it needs to be called via api ??
// TODO: validation middleware
// app.post(
// '/bind/quote/getCustomers',
// async (req: RequestUserAuth, res: Response) => {
//   try {
//     const quoteId = req.body.quoteId;
//     const billingEntities = req.body.billingEntities; // formatted [{ email, displayName, phone }] ??
//     const stripe = getStripe(stripeSecretKey.value());
//     info(`fetching stripe customers for quote ${quoteId}...`);

//     // TODO: update quote schema for stripe
//     // const stripeCustomerDetails: Record<string, {displayName: string, email: string, phone: string, billingType: BillingEntity['billingType'], address?: Address | null }> = {}
//     const stripeCustomerDetails: Record<
//       string,
//       Pick<BillingEntity, 'displayName' | 'email' | 'phone' | 'billingType'>
//     > = {};

// for (const billingEntity of billingEntities) {
//   try {
//     const cus = await getActiveStripeCustomerByEmail(
//       stripe,
//       billingEntity?.email,
//     );
//     if (!cus.email) throw new Error('missing email');
//     info(
//       `billing entity email matched existing customer ${cus.id} - ${cus.email}`,
//     );
//     stripeCustomerDetails[cus.id] = {
//       displayName: cus.name || '',
//       email: cus.email || '',
//       phone: cus.phone || '',
//       billingType: billingEntity.billingType || 'checkout',
//     };
//   } catch (err: any) {
//     const cus = await stripe.customers.create({
//       name: billingEntity.displayName || '',
//       email: billingEntity.email,
//       phone: billingEntity.phone || '',
//     });
//     info(`new stripe customer created ${cus.id} - ${cus.email}`);
//     stripeCustomerDetails[cus.id] = {
//       displayName: cus.name || '',
//       email: cus.email || '',
//       phone: cus.phone || '',
//       billingType: billingEntity.billingType || 'checkout',
//     };
//   }
// }

// // res.status(200).send(stripeCustomerDetails)
// const db = getFirestore();
// const quotesCol = quotesCollection(db);
// await quotesCol.doc(quoteId).update({
//   // @ts-ignore
//   billingEntities: stripeCustomerDetails,
//   'metadata.updated': Timestamp.now(),
// });

// info('Updated quote with stripe customer details', {
//   ...stripeCustomerDetails,
// });

// res.status(200).send(stripeCustomerDetails);
// } catch (err: any) {
//   let msg = 'Error retrieving/creating stripe customer(s)';
//   if (err?.message) msg += ` (${err.message})`;
//   reportErr(msg, {}, err);
//   res
//     .status(500)
//     .send({ message: 'Error creating/retrieving Stripe details' });
// }
// },
// );

app.get(
  '/invoice/:invoiceId/download',
  async (req: RequestUserAuth, res: Response) => {
    // allow unauthenticated ??
    if (!req.user?.uid) throw new NotAuthorizedError();
    let invoiceId = req.params.invoiceId;
    if (Array.isArray(invoiceId)) invoiceId = invoiceId[0];

    let invoice;
    try {
      const stripe = getStripe(stripeSecretKey.value());
      invoice = await stripe.invoices.retrieve(invoiceId);
    } catch (err: any) {
      reportErr('Error fetching invoice to download PDF', { invoiceId }, err);
      res.status(404).send('Invoice not found');
      return;
    }

    const invoiceUrl = invoice.invoice_pdf;
    if (!invoiceUrl) {
      res.status(400).send('Invoice PDF not available');
      return;
    }

    try {
      return axios
        .get(invoiceUrl, { responseType: 'stream' })
        .then((response) => {
          response.data.pipe(res);
        });
    } catch (err: any) {
      reportErr(
        'Error fetching invoice PDF and piping response to client',
        { invoiceId },
        err,
      );
      res.status(500).send('Error downloading PDF');
      return;
    }
  },
);

export default app;
