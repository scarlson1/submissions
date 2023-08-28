import { MISC_PUB_SUB_TOPICS } from '../../common';
import { GetStaticMapImagesPayload } from '../../pubsub/getStaticMapImages';
import { publishMessage } from './publishMessage';

export function publishGetLocationImages(payload: GetStaticMapImagesPayload) {
  return publishMessage(MISC_PUB_SUB_TOPICS.LOCATION_IMG, payload);
}
