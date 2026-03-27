import { Policy } from '@idemand/common';
import { add, max, min } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

export function getLcnSummariesByCusId(cusId: string, locations: Policy['locations']) {
  let billingEntityLocations: Policy['locations'] = {};
  for (let [lcnId, lcn] of Object.entries(locations)) {
    if (lcn.billingEntityId === cusId) billingEntityLocations[lcnId] = lcn;
  }
  return billingEntityLocations;
}

// earlier of 1) 14 calendar days from bind, or 2) later of effective date/ 5 days from bind.
export function getInvoiceDueDateTS(bindDate: Timestamp, effDate: Timestamp) {
  // TODO: bind date not stored in policy ??
  const bind14 = add(bindDate.toDate(), { days: 14 });
  const bind5 = add(bindDate.toDate(), { days: 5 });

  const dueDate = min([bind14, max([effDate.toDate(), bind5])]);
  return Timestamp.fromDate(dueDate);
}
