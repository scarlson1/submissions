import { Policy } from '@idemand/common';
import { Timestamp } from 'firebase-admin/firestore';

export function getLcnSummariesByCusId(cusId: string, locations: Policy['locations']) {
  let billingEntityLocations: Policy['locations'] = {};
  for (let [lcnId, lcn] of Object.entries(locations)) {
    if (lcn.billingEntityId === cusId) billingEntityLocations[lcnId] = lcn;
  }
  return billingEntityLocations;
}
// TODO: invoice due date calc
export function getInvoiceDueDate(effDate: Timestamp) {
  return effDate;
}
