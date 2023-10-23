import { warn } from 'firebase-functions/logger';
import { ParsedPolicyRow } from '../models/index.js';

export function validatePolicyRowZod(row: unknown) {
  // const parsed = ParsedPolicyRowZ.safeParse(row)
  // return parsed.success
  try {
    ParsedPolicyRow.parse(row);
    return true;
  } catch (err: any) {
    warn(`Row validation failed`, { err });
    return false;
  }
}
