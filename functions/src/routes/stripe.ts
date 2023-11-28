import express, { Request as ERequest, Response } from 'express';
import 'express-async-errors';
import { param } from 'express-validator';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Request as FBRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import invariant from 'tiny-invariant';
import {
  RequestUserAuth,
  functionsBaseURL,
  getReportErrorFn,
  hostingBaseURL,
  orgsCollection,
  stripeSecretKey,
} from '../common/index.js';
import { getStripe } from '../services/index.js';
import { currentUser, requireAuth, validateRequest } from './middlewares/index.js';
import { accountLinkSchema, accountSessionSchema } from './middlewares/schemas/stripe.js';

// event types: https://stripe.com/docs/api/events/types

const reportErr = getReportErrorFn('stripe');

const endpointSecret = 'whsec_ac4f0585f7511a2616f0750393299ffdddab9f7275dfd743786982df5e9cc9eb';

const app = express();

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // @ts-ignore
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
        event = stripe.webhooks.constructEvent(req.rawBody, signature || '', endpointSecret);
        // console.log('Signature verification succeeded');
      } catch (err: any) {
        let msg = `⚠️  Webhook signature verification failed. ${err.message}`;
        reportErr(msg, { eventType: event?.type, data: event?.data?.object || {} }, err);
        res.sendStatus(400).send({});
        return;
      }
    }

    console.log('Event Type => ', event.type);
    // console.log('Trigger Object Id => ', event.data.object.id);

    // Handle the event
    switch (event.type) {
      // case 'payment_intent.': look up created event
      // could use webhook to set the transfer group when invoice creates payment intent ??
      case 'payment_intent.processing':
        const paymentIntentProcessing = event.data.object as Stripe.PaymentIntent;
        console.log('Pmt Intent Processing: ', paymentIntentProcessing);
        // TODO: handle payment intent processing

        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        console.log('payment failed: ', paymentIntentFailed);
        // TODO: handle payment intent failed

        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // TODO: handle payment intent succeeded
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        // use charge:succeeded instead ?? triggered by payment intent and invoice ??
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('payment method: ', paymentMethod);
        // TODO: handle pmt method attached
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        console.log('charge: ', charge);
        // emit pub sub event ??
        // trigger policy pmt status (might need to be updated by billing entity ??) or charge ID ??

        break;
      case 'charge.failed':
        const failedCharge = event.data.object as Stripe.Charge;
        console.log('charge failed: ', failedCharge);
        break;
      case 'charge.captured':
        const capturedCharge = event.data.object as Stripe.Charge;
        console.log('charge captured: ', capturedCharge);
        break;
      case 'charge.refunded':
        const refundedCharge = event.data.object as Stripe.Charge;
        console.log('charge refunded: ', refundedCharge);
        // TODO: must reverse any transfers
        // use this event or 'refund.created' ??
        break;
      // account.updated
      // capability.updated
      case 'customer.created':
        const createdCustomer = event.data.object as Stripe.Customer;
        console.log('customer created', createdCustomer);
        // ensure exists / set on user doc ??
        break;
      case 'customer.deleted':
        const deletedCustomer = event.data.object as Stripe.Customer;
        console.log('customer deleted', deletedCustomer);
        // await removeStripeCustomerId(deletedCustomer.id); // get by email & delete if id === deletedId ??
        break;
      case 'customer.updated':
        const updatedCustomer = event.data.object as Stripe.Customer;
        console.log('customer updated: ', updatedCustomer);
        break;
      // case 'customer.source.created':
      // case 'customer.source.deleted':
      case 'customer.source.expiring':
        const expiringSource = event.data.object as Stripe.Card;
        console.log('customer source expiring: ', expiringSource);
        break;
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
      case 'invoice.finalized':
        const finalizedInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice finalized: ', finalizedInvoice);
        break;
      case 'invoice.sent':
        const sentInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice sent: ', sentInvoice);
        break;
      case 'invoice.marked_uncollectible':
        const uncollectibleInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice uncollectible: ', uncollectibleInvoice);
        break;
      case 'invoice.paid':
        const paidInvoice = event.data.object as Stripe.Invoice;
        console.log('invoice paid: ', paidInvoice);
        break;
      case 'invoice.payment_failed':
        // Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method.
        const invoicePmtFailed = event.data.object as Stripe.Invoice;
        console.log('invoice pmt failed: ', invoicePmtFailed);
        break;
      case 'refund.created':
        // Occurs whenever a refund from a customer’s cash balance is created.
        const refund = event.data.object as Stripe.Refund;
        console.log('refund created: ', refund);
        // use this event or 'charge.refunded' ??
        break;
      case 'refund.updated':
        // Occurs whenever a refund from a customer’s cash balance is updated.
        const updatedRefund = event.data.object as Stripe.Refund;
        console.log('refund created: ', updatedRefund);
        break;
      // payout.created
      // payout.updated
      case 'payout.paid':
        // Occurs whenever a payout is expected to be available in the destination account. If the payout fails, a payout.failed notification is also sent, at a later time.
        const paidPayout = event.data.object as Stripe.Payout;
        console.log('payout paid: ', paidPayout);
        break;
      // payout.failed (failure_code property indicates reason)
      // financial_connections.account.deactivated
      // financial_connections.account.reactivated
      // financial_connections.account.disconnected
      case 'person.created':
        // Occurs whenever a person associated with an account is created.
        const createdPerson = event.data.object as Stripe.Person;
        console.log('person created: ', createdPerson);
        break;
      case 'person.deleted':
        // Occurs whenever a person associated with an account is deleted
        const deletedPerson = event.data.object as Stripe.Person;
        console.log('person deleted: ', deletedPerson);
        break;
      case 'person.updated':
        // Occurs whenever a person associated with an account is updated.
        const updatedPerson = event.data.object as Stripe.Person;
        console.log('person created: ', updatedPerson);
        break;
      case 'transfer.created':
        const createdTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer created: ', createdTransfer);
        // TODO: mirror in DB
        break;
      case 'transfer.reversed':
        const reversedTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer reversed: ', reversedTransfer);
        // TODO: mirror in DB
        break;
      case 'transfer.updated':
        const updatedTransfer = event.data.object as Stripe.Transfer;
        console.log('transfer updated: ', updatedTransfer);
        // TODO: mirror in DB
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to ack event
    res.status(200).send({});
    return;
  }
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
  async (req: ERequest, res: Response) => {
    try {
      const accountId = req.body.accountId; // TODO: middleware to require account ID
      const type = req.body.type || 'account_onboarding';
      // payments, payment_details, payouts in beta
      const stripe = getStripe(stripeSecretKey.value());
      const accountSession = await stripe.accountSessions.create({
        account: accountId,
        components: {
          [type]: {
            enabled: true,
          },
        },
      });

      res.send({
        clientSecret: accountSession.client_secret,
      });
      return;
    } catch (err: any) {
      console.error(
        'An error occurred when calling the Stripe API to create an account session',
        err
      );
      res.status(500).send({ error: err.message });
      return;
    }
  }
);

async function getAccountId(db: Firestore, orgId: string) {
  const orgSnap = await orgsCollection(db).doc(orgId).get();
  const accountId = orgSnap.data()?.stripeAccountId;
  if (!accountId) throw new Error('Org missing stripe account ID');
  return accountId;
}

// pass in accountId and reuse refresh endpoint ??
app.post(
  '/accountLink',
  // body('orgId').isString().notEmpty(),
  accountLinkSchema,
  validateRequest,
  async (req: ERequest, res: Response) => {
    try {
      // TODO: require auth middleware
      // require user tenantId == orgId
      const { orgId } = req.body; // or pass in query param ??
      const db = getFirestore();
      // const orgSnap = await orgsCollection(db).doc(orgId).get();
      // const accountId = orgSnap.data()?.stripeAccountId;
      // if (!accountId) throw new Error('Org missing stripe account ID');
      const accountId = await getAccountId(db, orgId);

      const type = req.body.type || 'account_onboarding';

      const stripe = getStripe(stripeSecretKey.value());

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${functionsBaseURL.value()}/stripe/accountLink/${accountId}`,
        return_url: `${hostingBaseURL.value()}account/org/${orgId}/onboarding`,
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
  }
);

// refresh account link
app.get(
  '/accountLink/:accountId',
  param('accountId').isString().notEmpty(),
  validateRequest,
  async (req: ERequest, res: Response) => {
    try {
      const accountId = req.params?.accountId;
      invariant(accountId);

      const stripe = getStripe(stripeSecretKey.value());

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${functionsBaseURL.value()}/stripe/accountLink/${accountId}`, // needs to call account links again to generate a new link
        return_url: `${hostingBaseURL.value()}account/org`, // ${orgId}/onboarding
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
  }
);

app.get(
  '/account/:orgId',
  param('orgId').isString().notEmpty(),
  validateRequest,
  async (req: RequestUserAuth, res: Response) => {
    try {
      const orgId = req.params.orgId;
      const user = req.user;
      const isIDemandAdmin = user?.iDemandAdmin || false;
      if (!isIDemandAdmin && orgId !== user?.firebase.tenant)
        throw new Error('tenantId must match requested orgId');

      const db = getFirestore();
      const accountId = await getAccountId(db, orgId);

      const stripe = getStripe(stripeSecretKey.value());
      const account = await stripe.accounts.retrieve(accountId);

      res.send({ ...account });
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: 'an error occurred' });
      return;
    }
  }
);

export default app;
