import { isValid } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

import { dateWithTimeZone } from '../../modules/storage/index.js';

export const csvCellToTimestamp = (value: string) =>
  value && isValid(new Date(value)) ? Timestamp.fromDate(dateWithTimeZone(value) as Date) : null;
