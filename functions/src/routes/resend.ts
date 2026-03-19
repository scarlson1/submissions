// Resend webhook
// Updates email status in firestore & notifies via slack

import { info } from 'console';
import cors from 'cors';
import express, { Request, Response } from 'express';
// import { Filter, getFirestore } from 'firebase-admin/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { error, warn } from 'firebase-functions/logger';
import { projectID } from 'firebase-functions/params';
import { type Request as FBRequest } from 'firebase-functions/v2/https';
import {
  Resend,
  type EmailBouncedEvent,
  type EmailComplainedEvent,
  type EmailDeliveredEvent,
  type EmailFailedEvent,
  type EmailSentEvent,
} from 'resend';
import z from 'zod';
import {
  emailActivityCollection,
  resendKey,
  resendSecret,
} from '../common/index.js';
// import type { Submission } from '../types/collections.js';
// import { submissionsCollection } from '../utils/collections.js';

// option to set up Resend receiving emails ??
// https://resend.com/docs/dashboard/receiving/introduction

// docs: https://resend.com/docs/webhooks/emails/delivered

const app = express();

// TODO: set cors allowed origin from env var ??
// app.use(express.json()); // must use raw request body (place webhook route above express.json() or omit the json middleware)
app.use(cors());
// app.use(logRequest);

app.get('/health', (_: Request, res: Response) => {
  res.send({ status: 'healthy' });
});

type ResendEventPayload =
  | EmailDeliveredEvent
  | EmailComplainedEvent
  | EmailBouncedEvent
  | EmailFailedEvent
  | EmailSentEvent;

const saveEvent = async (emailId: string, data: Record<string, any>) => {
  try {
    //   const docId = data.sg_event_id || uuid();
    const eventRef = emailActivityCollection(getFirestore()).doc(emailId);

    const firestoreTimestamp = data.timestamp
      ? Timestamp.fromDate(new Date(data.timestamp * 1000))
      : null;

    await eventRef.set({
      ...data,
      firestoreTimestamp,
      metadata: {
        updated: Timestamp.now(),
      },
    });

    info(`Saved sendgrid event (ID: ${emailId})`, { data });
  } catch (err: unknown) {
    error('Error saving sendgrid event to db (ID: )', { err, data });
  }
};

// const fetchEmailSnap = async (emailId: string) => {
//   const emailCol = emailActivityCollection(getFirestore());
//   const q = emailCol.where('emailId', '==', emailId);

//   const result = await q.get();
//   if (result.empty) throw new Error('not found');

//   return result.docs[0];
// };

const Headers = z.object({
  id: z.string(),
  timestamp: z.string(),
  signature: z.string(),
});

interface Payload {
  type: string;
  created_at: string;
  data: Record<string, any>;
}

app.post(
  '/',
  express.raw({
    type: 'application/json',
    // verify: (req: any, res, buf) => {
    //   req['rawBody'] = buf.toString('utf-8'); // works, but need to update FBRequest type
    // },
  }),
  // @ts-expect-error assert request type
  async (req: FBRequest & { rawRequest: string }, res: Response) => {
    const resend = new Resend(resendKey.value());

    try {
      const headers = Headers.parse({
        id: req.headers['svix-id'],
        timestamp: req.headers['svix-timestamp'],
        signature: req.headers['svix-signature'],
      });

      // let body =
      resend.webhooks.verify({
        payload: req.rawBody.toString('utf8'),
        headers,
        webhookSecret: resendSecret.value(),
      }) as Payload;
    } catch (err) {
      console.log(err);
      // throw new Error('Invalid webhook');
      res.status(400).send({});
      return;
    }

    const body = req.body as ResendEventPayload;

    // https://resend.com/docs/dashboard/webhooks/event-types#sample-request-body
    const webhookType = body.type;
    info(`RESEND EVENT BODY [${webhookType}]: `, body);

    // const emailId = body.data.email_id;
    // const snap = await fetchEmailSnap(emailId);
    // const data = { ...snap.data(), id: snap.id };
    // const isAdminEmail = data.notifyAdminEmailId === emailId;

    // const updates: Partial<Submission> = {};
    // if (isAdminEmail) updates['notifyAdminStatus'] = webhookType;

    // TODO: filter by project (body.data.tags.projectId)
    const projectId = body.data.tags?.projectId;

    if (!projectId || projectId !== projectID.value()) {
      warn(
        `Returning early - project ID not matched [projectId: ${projectId}]`,
      );
      return;
    }

    switch (webhookType) {
      case 'email.sent':
        // Occurs whenever the API request was successful. Resend will attempt to deliver the message to the recipient’s mail server.
        await saveEvent(body.data.email_id, {
          status: body.type,
          ...body.data,
        });

        break;
      case 'email.delivered':
        // Occurs whenever Resend successfully delivered the email to the recipient’s mail server.
        // if (isAdminEmail) {
        //   const { data: emailData, error: emailError } =
        //     await resend.emails.send({
        //       from: 'Spencer Carlson <noreply@s-carlson.com>', // TODO: use env var
        //       to: data.email,
        //       subject: "I'll be in touch",
        //       html: `<p>Thanks ${
        //         data.name || ''
        //       }, </br></br>Your submission has been received and I'll get back to you shortly.</br></br>Best,</br>Spencer</p>`,
        //     });
        //   if (emailError) throw new Error(emailError.message);
        //   info('contact confirmation email sent', emailData, emailError);

        //   updates['notifyUserEmailId'] = emailData.id;
        // } else if (data.notifyUserEmailId) {
        //   console.log(`notify user email delivered [ID: ${emailId}]`);
        // }
        await saveEvent(body.data.email_id, {
          status: body.type,
          ...body.data,
        });

        break;
      //   case 'email.delivery_delayed':
      //     // Occurs whenever the email couldn’t be delivered due to a temporary issue.
      //     // Delivery delays can occur, for example, when the recipient’s inbox is full, or when the receiving email server experiences a transient issue.
      //     console.log(`Delivery delayed to ${data.email} [ID: ${emailId}]`);
      //     break;
      case 'email.failed':
        // Occurs whenever the email failed to send due to an error.
        // This event is triggered when there are issues such as invalid recipients, API key problems, domain verification issues, quota limits, or other sending failures.
        // console.log(`Delivery failed to ${data.email} [ID: ${emailId}]`);
        // updates['error'] =
        //   `failed to deliver email to ${body.data.to} [${body.data.failed.reason}]`;

        // TODO: notify admin (slack ??) ??

        await saveEvent(body.data.email_id, {
          status: body.type,
          ...body.data,
        });

        break;
      case 'email.complained':
        // Occurs whenever the email was successfully delivered, but the recipient marked it as spam.
        console.warn(
          `email marked as spam ${body.data.to} [ID: ${body.data.email_id}]`,
        );
        await saveEvent(body.data.email_id, {
          status: body.type,
          ...body.data,
        });

        break;
      case 'email.bounced':
        // Occurs whenever the recipient’s mail server permanently rejected the email.
        console.log(
          `Delivery failed to ${body.data.to} [ID: ${body.data.email_id}]`,
        );
        // updates['error'] =
        //   `failed to deliver email to ${body.data.to} [${body.data.failed.reason}]`;

        await saveEvent(body.data.email_id, {
          status: body.type,
          ...body.data,
        });

        break;
      //   case 'email.opened':
      //     // Occurs whenever the recipient opened the email.
      //     break;
      //   case 'email.clicked':
      //     // Occurs whenever the recipient clicks on an email link.
      //     break;

      default:
        info(`Ignoring Resend webhook event [type: ${webhookType}]`);
    }

    // if (Object.keys(updates).length) {
    //   info('Updating doc: ', updates);
    //   await snap.ref.update(updates);
    // }

    res.status(200).send({});
    // } catch (err) {
    //   res.status(500).send();
    // }
  },
);

app.all('/', (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});

// Sentry.setupExpressErrorHandler(app);

// app.use(errorHandler);

export default app;
