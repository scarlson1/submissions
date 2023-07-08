import { error, info } from 'firebase-functions/logger';
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { CollectionReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
// import sgMail from '@sendgrid/mail';
// import client from '@sendgrid/client'; // , { Client as SgClient }
// import { HttpMethod } from '@sendgrid/helpers/classes/request';
// import {
//   EventWebhook,
//   EventWebhookHeader
// } from '@sendgrid/eventwebhook';
// import { CallableRequest } from 'firebase-functions/v2/https';
import { v4 as uuid } from 'uuid';

import {
  emailActivityCollection,
  // sendGridWebhookVerificationKey,
  // sendgridApiKey,
} from '../common';

// TODO: signed event verification key:
// https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
// https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/event-webhook.md

// Sendgrid event webhook: https://docs.sendgrid.com/for-developers/tracking-events/event
// https://docs.sendgrid.com/for-developers/tracking-events/twilio-sendgrid-event-webhook-overview

// verifying request example: https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/event-webhook.md

// const verifyRequest = function (
//   publicKey: string,
//   payload: string | Buffer,
//   signature: string,
//   timestamp: string
// ) {
//   const eventWebhook = new EventWebhook();
//   const ecPublicKey = eventWebhook.convertPublicKeyToECDSA(publicKey);
//   return eventWebhook.verifySignature(ecPublicKey, payload, signature, timestamp);
// };

const app = express();

app.use(cors({ origin: true }));
// parse req.body as a Buffer (or use req.rawBody)
// app.use(bodyParser.raw({ type: 'application/json'}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// REQUIRES PURCHASE ($5/month): https://sendgrid.com/solutions/add-ons/30-days-additional-email-activity-history/
// const getEmailDetails = async (client: SgClient, msgId?: string | null) => {
//   if (!msgId) return null;
//   try {
//     const request = {
//       url: `/v3/messages/${msgId}`,
//       method: 'GET' as HttpMethod,
//     };
//     const [res, body] = await client.request(request);

//     console.log('SG mes details res', res);
//     console.log('SG mes details body: ', body);

//     return res.body || null;
//   } catch (err: any) {
//     error(`Error fetching email datails ${msgId}`);
//     return null;
//   }
// };

const saveEvent = async (eventColRef: CollectionReference<any>, data: Record<string, any>) => {
  try {
    const docId = data.sg_event_id || uuid();
    const eventRef = eventColRef.doc(docId);

    const firestoreTimestamp = data.timestamp
      ? Timestamp.fromDate(new Date(data.timestamp * 1000))
      : null;

    await eventRef.set({
      ...data,
      firestoreTimestamp,
      metadata: {
        created: Timestamp.now(),
      },
    });

    info(`Saved sendgrid event (ID: ${docId})`, { data });
  } catch (err: any) {
    error(`Error saving sendgrid event to db (ID: )`, { err, data });
  }
};

app.post('/event', async (req: Request, res: Response) => {
  // TODO: enable signature verification
  // const signature = req.get(EventWebhookHeader.SIGNATURE());
  // const timestamp = req.get(EventWebhookHeader.TIMESTAMP());

  // // const requestBody = req.body;
  // // Alternatively, if using firebase cloud functions, remove the middleware and use:
  // // @ts-ignore
  // const requestBody = (req as CallableRequest).rawBody;

  // try {
  //   verifyRequest(
  //     sendGridWebhookVerificationKey.value(),
  //     requestBody,
  //     signature || '',
  //     timestamp || ''
  //   );
  // } catch (err: any) {
  //   error('Sendgrid event verification failed', { err });
  //   return;
  // }

  var events = req.body as SGWebhookBody;
  info('New sendgrid event recieved', { events });

  // const client = require('@sendgrid/client');
  // client.setApiKey(sendgridApiKey.value());

  const db = getFirestore();
  const eventColRef = emailActivityCollection(db);

  events.forEach(async function (event: any) {
    // const msgId = event.sg_message_id;
    // const msgDetails = await getEmailDetails(client, msgId);

    await saveEvent(eventColRef, event); // { event, emailData: msgDetails }
  });

  res.send({ status: 'processed' });
});

export default app;

// SOURCE: https://github.com/sendgrid/sendgrid-nodejs/pull/1370

// These typings are derived from https://docs.sendgrid.com/for-developers/tracking-events/event
// BEWARE: those docs seem to be incorrect in several places

type SGBaseProps = {
  /** The email address of the recipient */
  email: string;

  /** The UNIX timestamp of when the message was sent */
  timestamp: number;

  /**
   * A unique ID to this event that you can use for deduplication purposes.
   * These IDs are up to 100 characters long and are URL safe.
   */
  sg_event_id: string;
  unique_args: Map<string, string>;
  marketing_campaign_id: number;
  marketing_campaign_name: string;

  // You can attach "unique args" (also called "custom args") to SendGrid send() requests.
  // These are then included in webhook events for emails resulting from that request.
  // Due to gross API design, these args are just splurged here together with the "official" properties.
  [uniqueArg: string]: unknown;
};

type SGPropSmtpId = {
  /** A unique ID attached to the message by the originating system */
  'smtp-id': string;
};

type SGPropUserAgent = {
  /**
   * The user agent responsible for the event.
   * This is usually a web browser.
   * For example, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36".
   */
  useragent: string;
};

type SGPropIP = {
  /** The IP address used to send the email.
   * For open and click events, it is the IP address of the recipient who engaged with the email.
   */
  ip: string;
};

type SGPropMessageId = {
  /** A unique, internal SendGrid ID for the message.
   * The first half of this ID is pulled from the smtp-id.
   */
  sg_message_id: string;
};

type SGPropReason = {
  /** Any sort of error response returned by the receiving server that describes the reason this event type was triggered. */
  reason: string;
};

type SGPropTLS = {
  /** Indicates whether TLS encryption was used in sending this message. */
  tls: boolean;
};

type SGPropCategory = {
  /**
   * Categories are custom tags that you set for the purpose of organizing your emails.
   * If you send single categories as an array, they will be returned by the webhook as an array.
   * If you send single categories as a string, they will be returned by the webhook as a string.
   */
  category: string | string[];
};

type SGPropASMGroupId = {
  /**
   * The ID of the unsubscribe group the recipient's email address is included in.
   * ASM IDs correspond to the ID that is returned when you create an unsubscribe group.
   */
  asm_group_id: number;
};

type SGEventProcessed = {
  event: 'processed';

  /** For emails sent with a specified IP Pool, you can view the IP Pool in the event data for a processed event. */
  pool: {
    name: string;
    id: number;
  };
} & SGBaseProps &
  SGPropSmtpId &
  SGPropMessageId &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventDropped = {
  event: 'dropped';
} & SGBaseProps &
  SGPropSmtpId &
  SGPropMessageId &
  SGPropReason &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventDelivered = {
  event: 'delivered';

  /** The full text of the HTTP response error returned from the receiving server. */
  response: string;
} & SGBaseProps &
  SGPropSmtpId &
  SGPropIP &
  SGPropMessageId &
  SGPropTLS &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventDeferred = {
  event: 'deferred';

  /** The number of times SendGrid has attempted to deliver this message. */
  attempt: string;
} & SGBaseProps &
  SGPropSmtpId &
  SGPropIP &
  SGPropMessageId &
  SGPropReason &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventBounce = {
  event: 'bounce';

  /**
   * In the event of an asynchronous bounce, the message ID will not be available.
   * An asynchronous bounce occurs when a message is first accepted by the receiving mail server and then bounced at a later time.
   * When this happens, there is less information available about the bounce.
   */
  sg_message_id?: string;

  /** Status code string. Corresponds to HTTP status code - for example, a JSON response of 5.0.0 is the same as a 500 error response. */
  status: string;

  /** indicates whether the bounce event was a hard bounce (type=bounce) or block (type=blocked) */
  type: 'bounce' | 'blocked';

  /**
   * Twilio SendGrid conveniently buckets SMTP failure messages into classifications by mapping each unique response to one of seven groups:
   * Invalid Address, Technical, Content, Reputation, Frequency/Volume, Mailbox Unavailable, or Unclassified.
   */
  bounce_classification: string;
} & SGBaseProps &
  SGPropSmtpId &
  SGPropIP &
  SGPropReason &
  SGPropTLS &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventOpen = {
  event: 'open';

  /**
   * When this field is set to true, it means that SendGrid has received signals indicating that a recipient with MPP enabled has triggered an open event.
   * When this field is false, it indicates that the event was triggered by a conventional open.
   * This field was added as a response to the anonymization of some open event tracking caused by Apple Mail Privacy Protection.
   */
  sg_machine_open: false;
} & SGBaseProps &
  SGPropUserAgent &
  SGPropIP &
  SGPropMessageId &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventClick = {
  event: 'click';

  /** The URL where the event originates. For click events, this is the URL clicked on by the recipient. */
  url: string;

  /** If there is more than one of the same links in an email, this tells you which of those identical links was clicked. */
  url_offset?: {
    index: number;
  };
} & SGBaseProps &
  SGPropUserAgent &
  SGPropIP &
  SGPropMessageId &
  SGPropCategory &
  SGPropASMGroupId;

type SGEventSpamReport = {
  event: 'spamreport';
} & SGBaseProps &
  SGPropMessageId &
  SGPropCategory;

type SGEventUnsubscribe = {
  event: 'unsubscribe';
} & SGBaseProps &
  SGPropMessageId &
  SGPropCategory;

type SGEventGroupUnsubscribe = {
  event: 'group_unsubscribe';
} & SGBaseProps &
  SGPropUserAgent &
  SGPropIP &
  SGPropMessageId &
  SGPropASMGroupId;

type SGEventGroupResubscribe = {
  event: 'group_resubscribe';
} & SGBaseProps &
  SGPropUserAgent &
  SGPropIP &
  SGPropMessageId &
  SGPropASMGroupId;

type SGEvent =
  | SGEventProcessed
  | SGEventDropped
  | SGEventDelivered
  | SGEventDeferred
  | SGEventBounce
  | SGEventOpen
  | SGEventClick
  | SGEventSpamReport
  | SGEventUnsubscribe
  | SGEventGroupUnsubscribe
  | SGEventGroupResubscribe;

type SGWebhookBody = SGEvent[];
