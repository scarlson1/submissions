import { PubSub } from '@google-cloud/pubsub';
import { error, info } from 'firebase-functions/logger';

import { pubSubEmulatorHost } from '../../utils/environmentVars.js';

// docs: https://cloud.google.com/pubsub/docs/publisher#publish-messages

let pubSubClient: PubSub | null = null;

function normalizePubSubEmulatorHost(host: string | undefined) {
  if (!host) return undefined;
  if (host.includes(':')) return host;
  return `127.0.0.1:${host}`;
}

function getPubSubClient() {
  if (pubSubClient) return pubSubClient;

  const isFunctionsEmulator =
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    Boolean(process.env.EVENTARC_EMULATOR);
  const configuredHost =
    process.env.PUBSUB_EMULATOR_HOST || pubSubEmulatorHost.value();
  const emulatorHost = isFunctionsEmulator
    ? normalizePubSubEmulatorHost(configuredHost)
    : undefined;

  if (emulatorHost) {
    process.env.PUBSUB_EMULATOR_HOST = emulatorHost;
    info('Using Pub/Sub emulator host', { emulatorHost });
  }

  pubSubClient = new PubSub();
  return pubSubClient;
}

export async function publishMessage(
  topicNameOrId: string,
  data: { [key: string]: any },
) {
  // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
  const dataBuffer = Buffer.from(JSON.stringify(data));

  try {
    const client = getPubSubClient();
    info(`Publishing new message to ${topicNameOrId}`, { data });
    const messageId = await client
      .topic(topicNameOrId)
      .publishMessage({ data: dataBuffer });

    info(`Message ${messageId} published to ${topicNameOrId}.`);

    return { messageId, topicNameOrId };
  } catch (err: any) {
    error(`Error while publishing pubsub event (${err?.message})`, { err });
    process.exitCode = 1;
    return Promise.reject(err);
  }
}
