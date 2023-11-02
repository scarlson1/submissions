import { BillingEntity, Policy } from '../common/index.js';

// TODO: build class so methods can be reused ?? (with firestore converter??)
export function getBillingEntityId(policy: Policy & Record<string, any>, lcnId: string) {
  const policyLcn = policy.locations[lcnId];
  if (!policyLcn) throw new Error(`location not found`);
  return policyLcn.billingEntityId;
}

export function getBillingEntityDetails(policy: Policy & Record<string, any>, lcnId: string) {
  const { billingEntities, namedInsured } = policy;
  if (!billingEntities) {
    const fallback: BillingEntity = {
      displayName: namedInsured.displayName,
      email: namedInsured.email,
      phone: namedInsured.phone,
      billingType: 'invoice',
      paymentMethods: [],
    };
    return fallback;
  }
  const defaultBillingEntity = billingEntities[policy.defaultBillingEntityId || 'namedInsured'];

  return billingEntities[getBillingEntityId(policy, lcnId)] || defaultBillingEntity;
}

export function getBillingEntityTotals(policy: Policy, lcnId: string) {
  return policy.totalsByBillingEntity[getBillingEntityId(policy, lcnId)];
}
