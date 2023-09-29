import { hasAny } from '../../utils/index.js';

// TODO: need to also check property details that go to SR (optionally pass propertyDetails as second arg ??)
const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

export const requiresRerate = (changesKeys: string[]) => {
  return hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);
};
