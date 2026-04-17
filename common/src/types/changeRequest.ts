import type {
  ChangeRequestStatus,
  ChangeRequestTrxType,
  SubmittedChangeRequestStatus,
} from '../enums.js';
import type {
  AdditionalInterest,
  Address,
  BaseDoc,
  Coords,
  DeepPartial,
  Limits,
  Nullable,
  RatingPropertyData,
  Timestamp,
} from './common.js';
import type { ILocation } from './location.js';
import type { NamedInsured, Policy } from './policy.js';
import type { CancellationReason } from './transaction.js';

export interface PolicyChangeValues {
  namedInsured: Omit<NamedInsured, 'userId' | 'orgId'>;
  mailingAddress: Address;
  // effectiveDate: Date | null;
  // expirationDate: Date | null; // TODO: ability to request date changes ??
  requestEffDate: Date; // change to timestamp ??
}

export interface LocationChangeValues {
  limits: Limits;
  deductible: number;
  // effectiveDate: Date;
  // expirationDate: Date;
  additionalInterests: AdditionalInterest[];
  externalId: string;
  requestEffDate: Date;
}

// TODO: create ChangeRequestTrxType, then TransactionType  = ChangeRequestTrxType & 'renewal' | 'new'

// TODO:  should add key for each trx type ?? change request doesn't need to mirror transaction type 1:1
// ex: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
// then have approval function split into different transactions ??

// TODO: change security rules to fetch policy instead of storing agentId and agencyId
// OR are they there for querying purposes ?? (would require rxjs if not ??)

export interface BaseChangeRequest extends BaseDoc {
  trxType: ChangeRequestTrxType; // TODO: delete - handle trx by looping through endorsement and amendment changes
  requestEffDate: Timestamp;
  policyId: string;
  // policyVersion: number | null;
  createdAtPolicyVersion?: number | null;
  policyChangesCalcVersion?: number | null;
  mergedWithPolicyVersion?: number | null; // remove in favor of object
  mergedWithVersions?: Record<string, number>; // TODO: make required once extending with ProcessedPolicyChangeRequest
  userId: string;
  agent: {
    userId: string | null;
  };
  agency: {
    orgId: string | null;
  };
  status: ChangeRequestStatus;
  processedTimestamp?: Timestamp;
  processedByUserId?: string | null;
  submittedBy: {
    userId: string | null;
    displayName: string;
    email: string | null;
  };
  underwriterNotes?: string | null;
  error?: string; // string or array of strings/objects ??
  _lastCommitted?: Timestamp;
}

// TODO: DraftChangeRequest ??

// TODO: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
// separate out form values in calcLocationChange to produce ^^

export interface PolicyChangeRequest extends BaseChangeRequest {
  formValues: LocationChangeValues; // TODO: support multi-location. remove req eff date from form values
  endorsementChanges: Record<
    string,
    Pick<
      ILocation,
      | 'limits'
      | 'deductible'
      | 'annualPremium'
      | 'ratingDocId'
      | 'TIV'
      | 'RCVs'
      | 'termPremium'
      | 'termDays'
    >
  >;
  amendmentChanges: Record<
    string,
    Partial<Pick<ILocation, 'additionalInsureds' | 'mortgageeInterest'>>
  >;
  locationChanges: PolicyChangeRequest['endorsementChanges'] &
    PolicyChangeRequest['amendmentChanges'];
  policyChanges: DeepPartial<Policy>;
  policyChangesCalcVersion?: number | null;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
  scope: 'location'; // TODO: delete (only to pass validation in calcLocationChanges)
}

export type CalcPolicyChangesResult = Pick<
  Policy,
  | 'termPremium'
  | 'price'
  | 'inStatePremium'
  | 'outStatePremium'
  | 'locations'
  | 'termPremiumWithCancels'
  | 'taxes'
  | 'totalsByBillingEntity'
> &
  Partial<Pick<Policy, 'cancelEffDate' | 'cancelReason' | 'termDays'>>;

// TODO: firestore rules not allowing frontend to update locationChanges, endorsementChanges, etc.
// new cancel request interface - not in use yet
export interface CancellationRequest extends BaseChangeRequest {
  trxType: 'cancellation' | 'flat_cancel';
  formValues: {
    requestEffDate: Timestamp;
    cancelReason: CancellationReason;
  };
  // need to add cancelChanges ?? or something to indicate trx type
  // locationChanges: Record<string, Pick<ILocation, 'termPremium'>>;
  // locationChanges: Record<
  //   string,
  //   Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>
  // >;
  locationChanges: Pick<
    ILocation,
    'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'
  >;
  cancellationChanges: Record<
    string,
    Pick<
      ILocation,
      'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'
    >
  >; // Record<string, Partial<ILocation>>;
  policyChanges?: CalcPolicyChangesResult;
  // policyChanges?: Pick<
  //   Policy,
  //   | 'termPremium'
  //   | 'termDays'
  //   | 'price'
  //   | 'inStatePremium'
  //   | 'outStatePremium'
  //   | 'locations'
  //   | 'termPremiumWithCancels'
  //   | 'taxes'
  // > &
  //   Partial<Pick<Policy, 'cancelEffDate' | 'cancelReason'>>;
  policyChangesCalcVersion?: number | null;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
}

export interface LocationChangeRequest extends BaseChangeRequest {
  scope: 'location';
  policyChanges?: DeepPartial<Policy>;
  locationChanges: DeepPartial<ILocation>;
  formValues: LocationChangeValues;
  locationId: string;
  externalId?: string | null;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

// TODO: separate out flat cancel ??
export interface LocationCancellationRequest extends Omit<
  LocationChangeRequest,
  'formValues' | 'locationChanges'
> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason?: CancellationReason;
  formValues: CancelValues;
  locationChanges?: DeepPartial<ILocation>;
  isAddLocationRequest?: false;
}

// TODO: policy cancel request includes location changes (term premium, cancelEffDate, cancelReason, etc.)
// should be object for each location
export interface PolicyChangeRequestOld extends BaseChangeRequest {
  scope: 'policy';
  policyChanges: DeepPartial<Policy>;
  locationChanges: Record<string, Partial<ILocation>>;
  formValues: PolicyChangeValues;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

export interface CancelValues {
  requestEffDate: Date;
  reason: CancellationReason;
}

export interface PolicyCancellationRequest extends Omit<
  PolicyChangeRequestOld,
  'formValues'
> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason?: CancellationReason;
  formValues: CancelValues;
  isAddLocationRequest?: false;
}

export interface AddLocationValues {
  externalId?: string;
  address: Address;
  coordinates: Nullable<Coords>;
  limits: Limits;
  deductible: number;
  effectiveDate: Timestamp;
  billingEntityId: string; // TODO: add ability to create new billing entity ?? add select input to form
  ratingPropertyData: Pick<
    Nullable<RatingPropertyData>,
    | 'basement'
    | 'replacementCost'
    | 'sqFootage'
    | 'yearBuilt'
    | 'priorLossCount'
    | 'numStories'
    | 'floodZone'
  >;
  additionalInterests: AdditionalInterest[];
}

// type test = z.infer<typeof ChangeRequestStatus.exclude('draft')>
// type PostDraftStatus = ChangeRequestStatus.exclude(['draft'])

export interface AddLocationRequest extends Omit<BaseChangeRequest, 'status'> {
  trxType: 'endorsement';
  scope: 'add_location'; // TODO: use scope instead of isAddLocationRequest ?? once submitted, should scope change to endorsement ??
  // status: 'submitted' | 'accepted' | 'denied' | 'under_review' | 'cancelled' | 'error';
  // status:  // z.enum(ChangeRequestStatusEnum.options.filter...) // TODO: remove 'draft'
  status: SubmittedChangeRequestStatus;
  formValues: AddLocationValues;
  policyChanges?: DeepPartial<Policy>;
  locationChanges?: DeepPartial<ILocation>;
  endorsementChanges?: PolicyChangeRequest['endorsementChanges'];
  isAddLocationRequest: true; // TODO: remove ?? use scope = 'add_location' instead ??
  locationId: string;
}

export interface DraftAddLocationRequest extends Omit<
  AddLocationRequest,
  'formValues' | 'status' | 'locationId'
> {
  status: 'draft';
  formValues: Partial<AddLocationValues>;
  locationId?: string;
}

export type ChangeRequest =
  | LocationChangeRequest
  | LocationCancellationRequest
  | PolicyChangeRequestOld
  | PolicyCancellationRequest
  | AddLocationRequest
  | DraftAddLocationRequest
  | PolicyChangeRequest;
