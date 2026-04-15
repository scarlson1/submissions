import { RENEWAL_PUB_SUB_TOPICS, TRX_PUB_SUB_TOPICS } from '../../common/index.js';
import {
  AmendmentPayload,
  EndorsementPayload,
  LocationCancelPayload,
  PolicyCreatedPayload,
  PolicyRenewalPayload,
  ReinstatementPayload,
  RenewalLapsedPayload,
  RenewalRequestedPayload,
} from '../../pubsub/index.js';
import { publishMessage } from './publishMessage.js';

export function publishEndorsement(payload: EndorsementPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.ENDORSEMENT, payload);
}

export function publishAmendment(payload: AmendmentPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.AMENDMENT, payload);
}

export function publishLocationCancel(payload: LocationCancelPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.LOCATION_CANCELLATION, payload);
}

export function publishPolicyCreated(payload: PolicyCreatedPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.POLICY_CREATED, payload);
}

export function publishRenewal(payload: PolicyRenewalPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.POLICY_RENEWAL, payload);
}

export function publishReinstatement(payload: ReinstatementPayload) {
  return publishMessage(TRX_PUB_SUB_TOPICS.POLICY_REINSTATEMENT, payload);
}

export function publishRenewalRequested(payload: RenewalRequestedPayload) {
  return publishMessage(RENEWAL_PUB_SUB_TOPICS.RENEWAL_REQUESTED, payload);
}

export function publishRenewalApproved(payload: RenewalRequestedPayload) {
  return publishMessage(RENEWAL_PUB_SUB_TOPICS.RENEWAL_APPROVED, payload);
}

export function publishRenewalLapsed(payload: RenewalLapsedPayload) {
  return publishMessage(RENEWAL_PUB_SUB_TOPICS.RENEWAL_LAPSED, payload);
}
