import { PubSub } from '@google-cloud/pubsub';
import { error, info } from 'firebase-functions/logger';

const pubSubClient = new PubSub();

export async function publishMessage(topicNameOrId: string, data: { [key: string]: any }) {
  // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
  const dataBuffer = Buffer.from(JSON.stringify(data));

  try {
    info(`Publishing new message to ${topicNameOrId}`, { data });
    const messageId = await pubSubClient.topic(topicNameOrId).publishMessage({ data: dataBuffer });

    info(`Message ${messageId} published to ${topicNameOrId}.`);

    return messageId;
  } catch (err: any) {
    error(`Error while publishing pubsub event (${err?.message})`, { err });
    process.exitCode = 1;
    return Promise.reject(error);
  }
}
