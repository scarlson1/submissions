import { randomBytes } from 'crypto';
import { info } from 'firebase-functions/logger';
import { extname } from 'path';

import { Address, CompressedAddress, Nullable } from '../common';

export function getFormattedAddress(addr: Nullable<Address>) {
  let formatted = `${addr?.addressLine1 || ''}`;
  if (addr?.addressLine2) formatted += `, ${addr.addressLine2}`;
  if (addr?.city) formatted += `, ${addr.city}`;
  if (addr?.state) formatted += `, ${addr.state}`;
  if (addr?.postal) formatted += `, ${addr.postal}`;

  return formatted;
}

export function getFormattedAddressArray(addr: Nullable<Address>): [string, string] {
  let line1 = `${addr?.addressLine1 || ''}`;
  if (addr?.addressLine2) line1 += `, ${addr.addressLine2}`;
  let line2 = `${addr?.city || ''}`;
  if (addr?.state) line2 += `, ${addr.state}`;
  if (addr?.postal) line2 += ` ${addr.postal}`;

  return [line1, line2];
}

export function compressAddress(addr: Address): CompressedAddress {
  return {
    s1: addr.addressLine1 || '',
    s2: addr.addressLine2 || '',
    c: addr.city || '',
    st: addr.state || '',
    p: addr.postal || '',
  };
}

export function waitMilliSeconds(ms: number, reason?: string) {
  return new Promise<void>((resolve, reject) => {
    info(`Waiting ${ms} ms ${reason || ''}`, { reason });
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export function randomFileName(filePath: string) {
  return randomBytes(20).toString('hex') + extname(filePath);
}

export function hasOne(arr1: string[], arr2: string[]) {
  return arr1.some((r) => arr2.indexOf(r) >= 0);
}
