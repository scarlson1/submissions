import { MISC_PUB_SUB_TOPICS } from '../../common/index.js';
import { GetStaticMapImagesPayload } from '../../pubsub/getStaticMapImages.js';
import { publishMessage } from './publishMessage.js';

export function publishGetLocationImages(payload: GetStaticMapImagesPayload) {
  return publishMessage(MISC_PUB_SUB_TOPICS.LOCATION_IMG, payload);
}
