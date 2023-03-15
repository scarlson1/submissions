import { PubSub } from '@google-cloud/pubsub';

const pubSubClient = new PubSub();

export async function publishMessage(topicNameOrId: string, data: { [key: string]: any }) {
  // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
  const dataBuffer = Buffer.from(JSON.stringify(data));

  try {
    const messageId = await pubSubClient.topic(topicNameOrId).publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published to ${topicNameOrId}.`);
    return messageId;
  } catch (error) {
    // eslint-disable-next-line
    // @ts-ignore
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
    return Promise.reject(error);
  }
}
