import { PubSub } from '@google-cloud/pubsub';
import { error } from 'firebase-functions/logger';
import { Request, Response } from 'firebase-functions/v1';
import { pubSubEmulatorHost } from '../common';

// work-around to publish in emulator environment (trigger from postman)

const pubsub = new PubSub();

export default async (request: Request, response: Response) => {
  // 1. make sure the function can't be used in production
  if (!pubSubEmulatorHost.value()) {
    error('This function should only run locally in an emulator.');
    response.status(400).end();
  }

  const payload = request.body.payload;
  const t = request.body.topic;
  if (!payload || !t) response.status(400).send({ message: 'Missing payload or topic' });

  try {
    // Memory leak bug:
    // https://github.com/googleapis/nodejs-pubsub/issues/1069 ??
    // const pubsub = new PubSub();

    // 2. make sure the test topic exists and
    // if it doesn't then create it.
    const [topics] = await pubsub.getTopics();

    // topic.name is of format 'projects/PROJECT_ID/topics/test-topic',
    const matchedTopic = topics.filter((topic) => topic.name.includes(t))?.[0];
    console.log('TEST TOPIC:', matchedTopic);
    if (!matchedTopic) {
      console.log(`pubsub topic "${t}" not found. creating topic...`);
      await pubsub.createTopic(t);
    }

    // 3. publish to test topic and get message ID
    const messageId = await pubsub.topic(t).publishMessage({
      json: { ...payload },
    });

    response
      .status(201)
      .send({ success: `Published to pubsub ${t} -- message ID: ${messageId}`, messageId });
  } catch (err: any) {
    response.status(400).send({ message: 'An error occurred', errMsg: err?.message || null });
  }

  // const dataBuffer = Buffer.from(JSON.stringify({ ...payload }));
  // try {
  //   const messageId = await pubsub.topic(t).publishMessage({ data: dataBuffer });

  //   // 4. send back a helpful message
  //   response
  //     .status(201)
  //     .send({ success: `Published to pubsub ${t} -- message ID: ${messageId}`, messageId });
  // } catch (err) {
  //   console.log('ERROR PUBLISHING MESSAGE: ', err);
  //   response.status(200).send({});
  // }
};
