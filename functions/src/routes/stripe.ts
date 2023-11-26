import express, { Response } from 'express';
import 'express-async-errors';
import { Request } from 'firebase-functions/v2/https';
import { stripeSecretKey } from '../common/index.js';
import { getStripe } from '../services/index.js';

const endpointSecret = 'whsec_ac4f0585f7511a2616f0750393299ffdddab9f7275dfd743786982df5e9cc9eb';

const app = express();

// app.use(
//   bodyParser.json({
//     verify: (req, res, buf) => {
//       req.rawBody = buf;
//     },
//   })
// );

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // @ts-ignore
  async (req: Request, res: Response) => {
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
        console.log('Signature verification succeeded');
      } catch (err: any) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        res.sendStatus(400).send({});
        return;
      }
    }

    console.log('Event Type => ', event.type);
    console.log('Trigger Object Id => ', event.data.object.id);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.processing':
        const paymentIntentProcessing = event.data.object;
        console.log('Pmt Intent Processing: ', paymentIntentProcessing);

        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        console.log('payment failed: ', paymentIntentFailed);

        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('payment method: ', paymentMethod);
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
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

export default app;
