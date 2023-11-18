import { QUOTE_STATUS, Quote } from 'common';
import { DocumentReference, FieldPath, WhereFilterOp, getDoc, where } from 'firebase/firestore';

export async function getData<T>(ref: DocumentReference<T>, errMsg: string = 'record not found') {
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!(snap.exists() && data)) throw new Error(errMsg);
  return { ...data, id: ref.id };
}

export type QueryArgs = [string | FieldPath, WhereFilterOp, any];

export function mapWhereConstraints(constraints: QueryArgs[]) {
  return constraints.map((c) => where(c[0], c[1], c[2]));
}

// // TODO: use once using location versioning
// export function getLocationDocIds(locations: Policy['locations']) {
//   return Object.values(locations).map((lcnSum) => lcnSum.lcnDocId);
// }

export function getQuoteStatus({ status, quoteExpirationDate }: Quote) {
  if (status === QUOTE_STATUS.BOUND) return QUOTE_STATUS.BOUND;
  if (status === QUOTE_STATUS.CANCELLED) return QUOTE_STATUS.CANCELLED;
  if (quoteExpirationDate && quoteExpirationDate.toMillis() < new Date().getTime())
    return QUOTE_STATUS.EXPIRED;
  if (status === QUOTE_STATUS.DRAFT) return QUOTE_STATUS.DRAFT;
  if (status === QUOTE_STATUS.AWAITING_USER) return QUOTE_STATUS.AWAITING_USER;
  return 'unknown';
}
