import { Address, CompressedAddress, Nullable } from '../common';

export function getFormattedAddress(addr: Nullable<Address>) {
  let formatted = `${addr?.addressLine1 || ''}`;
  if (addr?.addressLine2) formatted += `, ${addr.addressLine2}`;
  if (addr?.city) formatted += `, ${addr.city}`;
  if (addr?.state) formatted += `, ${addr.state}`;
  if (addr?.postal) formatted += `, ${addr.postal}`;

  return formatted;
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
