/**
 * BigQuery table schemas for all data pipeline tables.
 *
 * Conventions:
 *  - Column names are snake_case (BQ standard).
 *  - All CDC tables carry four system columns: _id, _deleted, _doc_version,
 *    _ingested_at. These support deduplication views and soft-delete handling.
 *  - Firestore Timestamps are stored as TIMESTAMP.
 *  - Firestore GeoPoints are split into _latitude / _longitude FLOAT64 pairs.
 *  - Nested Firestore maps are RECORD (STRUCT); arrays of objects are REPEATED RECORD.
 *  - Arrays of scalars (e.g. transaction_types) are REPEATED STRING.
 *  - Complex maps that don't have a fixed shape (e.g. by_state aggregations) are
 *    serialized as a JSON STRING so the schema stays stable as enum values evolve.
 */

// ---------------------------------------------------------------------------
// Local type alias — mirrors BigQuery's TableField interface without importing
// the deep private type path from the package.
// ---------------------------------------------------------------------------

export interface TableField {
  name: string;
  /** BQ primitive types + RECORD for nested structs. */
  type:
    | 'STRING'
    | 'INTEGER'
    | 'INT64'
    | 'FLOAT'
    | 'FLOAT64'
    | 'NUMERIC'
    | 'BOOLEAN'
    | 'BOOL'
    | 'TIMESTAMP'
    | 'DATE'
    | 'JSON'
    | 'RECORD';
  mode?: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  description?: string;
  fields?: TableField[];
}

export interface TableSchema {
  fields: TableField[];
}

/** Full config passed to table-provisioning helpers. */
export interface TableConfig {
  tableId: string;
  schema: TableSchema;
  /** Column used for date-range partitioning (must be TIMESTAMP or DATE). */
  partitionField: string;
  /** Up to four columns for BQ clustering (left-to-right priority). */
  clusterFields: string[];
  description?: string;
}

// ---------------------------------------------------------------------------
// Reusable field groups
// ---------------------------------------------------------------------------

/** Four system columns appended to every CDC table. */
const SYSTEM_FIELDS: TableField[] = [
  {
    name: '_id',
    type: 'STRING',
    mode: 'REQUIRED',
    description: 'Firestore document ID.',
  },
  {
    name: '_deleted',
    type: 'BOOLEAN',
    mode: 'REQUIRED',
    description: 'TRUE when the source document was deleted.',
  },
  {
    name: '_doc_version',
    type: 'INTEGER',
    mode: 'NULLABLE',
    description: 'metadata.version from the Firestore document at ingest time.',
  },
  {
    name: '_ingested_at',
    type: 'TIMESTAMP',
    mode: 'REQUIRED',
    description: 'Wall-clock time when this row was written to BigQuery.',
  },
];

/** common/src/types/common.ts → Address */
const ADDRESS_FIELDS: TableField[] = [
  { name: 'address_line1', type: 'STRING', mode: 'NULLABLE' },
  { name: 'address_line2', type: 'STRING', mode: 'NULLABLE' },
  { name: 'city', type: 'STRING', mode: 'NULLABLE' },
  { name: 'state', type: 'STRING', mode: 'NULLABLE' },
  { name: 'postal', type: 'STRING', mode: 'NULLABLE' },
  { name: 'county_fips', type: 'STRING', mode: 'NULLABLE' },
  { name: 'county_name', type: 'STRING', mode: 'NULLABLE' },
];

/** common/src/types/policy.ts → CompressedAddress (embedded in PolicyLocation) */
const COMPRESSED_ADDRESS_FIELDS: TableField[] = [
  { name: 's1', type: 'STRING', mode: 'NULLABLE', description: 'addressLine1' },
  { name: 's2', type: 'STRING', mode: 'NULLABLE', description: 'addressLine2' },
  { name: 'c', type: 'STRING', mode: 'NULLABLE', description: 'city' },
  { name: 'st', type: 'STRING', mode: 'NULLABLE', description: 'state (2-char)' },
  { name: 'p', type: 'STRING', mode: 'NULLABLE', description: 'postal code' },
];

/** common/src/types/common.ts → AgentDetails */
const AGENT_FIELDS: TableField[] = [
  { name: 'name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'email', type: 'STRING', mode: 'NULLABLE' },
  { name: 'phone', type: 'STRING', mode: 'NULLABLE' },
  { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
];

/** common/src/types/common.ts → AgencyDetails */
const AGENCY_FIELDS: TableField[] = [
  { name: 'name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'org_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'stripe_account_id', type: 'STRING', mode: 'NULLABLE' },
  {
    name: 'address',
    type: 'RECORD',
    mode: 'NULLABLE',
    fields: ADDRESS_FIELDS,
  },
];

/** common/src/types/policy.ts → NamedInsured */
const NAMED_INSURED_FIELDS: TableField[] = [
  { name: 'display_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'first_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'last_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'email', type: 'STRING', mode: 'NULLABLE' },
  { name: 'phone', type: 'STRING', mode: 'NULLABLE' },
  { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'org_id', type: 'STRING', mode: 'NULLABLE' },
];

/** common/src/types/common.ts → Limits */
const LIMITS_FIELDS: TableField[] = [
  { name: 'limit_a', type: 'INTEGER', mode: 'NULLABLE', description: 'Building coverage limit' },
  { name: 'limit_b', type: 'INTEGER', mode: 'NULLABLE', description: 'Other structures limit' },
  { name: 'limit_c', type: 'INTEGER', mode: 'NULLABLE', description: 'Contents limit' },
  { name: 'limit_d', type: 'INTEGER', mode: 'NULLABLE', description: 'Loss of use limit' },
];

/** common/src/types/common.ts → RCVs */
const RCV_FIELDS: TableField[] = [
  { name: 'building', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'other_structures', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'contents', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'bi', type: 'INTEGER', mode: 'NULLABLE', description: 'Business income RCV' },
  { name: 'total', type: 'INTEGER', mode: 'NULLABLE' },
];

/** common/src/types/common.ts → RatingPropertyData */
const RATING_PROPERTY_DATA_FIELDS: TableField[] = [
  { name: 'flood_zone', type: 'STRING', mode: 'NULLABLE' },
  { name: 'basement', type: 'STRING', mode: 'NULLABLE' },
  { name: 'cbrs_designation', type: 'STRING', mode: 'NULLABLE' },
  { name: 'dist_to_coast_feet', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'num_stories', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'property_code', type: 'STRING', mode: 'NULLABLE' },
  { name: 'replacement_cost', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'sq_footage', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'year_built', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'ffh', type: 'INTEGER', mode: 'NULLABLE', description: 'First floor height' },
  { name: 'prior_loss_count', type: 'STRING', mode: 'NULLABLE' },
  { name: 'units', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'elevation', type: 'FLOAT', mode: 'NULLABLE' },
];

/** common/src/types/fees.ts → FeeItem (used as REPEATED RECORD on policies / quotes) */
const FEE_ITEM_FIELDS: TableField[] = [
  { name: 'display_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'value', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'refundable', type: 'BOOLEAN', mode: 'NULLABLE' },
];

/**
 * common/src/types/taxes.ts → TaxItem (used as REPEATED RECORD on policies / quotes).
 * Omits metadata, effectiveDate, products, rateType, LOB per TaxItem's Zod definition.
 */
const TAX_ITEM_FIELDS: TableField[] = [
  { name: 'display_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'rate', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'state', type: 'STRING', mode: 'NULLABLE' },
  { name: 'value', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'subject_base_amount', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'base_digits', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'result_digits', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'base_round_type', type: 'STRING', mode: 'NULLABLE' },
  { name: 'result_round_type', type: 'STRING', mode: 'NULLABLE' },
  { name: 'transaction_types', type: 'STRING', mode: 'REPEATED' },
  { name: 'refundable', type: 'BOOLEAN', mode: 'NULLABLE' },
  { name: 'calc_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
  { name: 'expiration_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
  { name: 'tax_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'tax_calc_id', type: 'STRING', mode: 'NULLABLE' },
];

// ---------------------------------------------------------------------------
// Table schemas
// ---------------------------------------------------------------------------

/**
 * policies — one row per Firestore policy document write.
 * The embedded `locations` record is normalized out into `policy_locations`.
 */
export const POLICIES_SCHEMA: TableSchema = {
  fields: [
    // Core policy fields
    { name: 'product', type: 'STRING', mode: 'NULLABLE', description: 'flood | wind' },
    { name: 'payment_status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'term', type: 'INTEGER', mode: 'NULLABLE', description: 'Policy term in days' },
    { name: 'home_state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'term_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'term_premium_with_cancels', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'in_state_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'out_state_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'term_days', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'price', type: 'FLOAT', mode: 'NULLABLE', description: 'Total charged to insured' },
    { name: 'effective_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'expiration_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'cancel_eff_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'cancel_reason', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'quote_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'external_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'issuing_carrier', type: 'STRING', mode: 'NULLABLE' },
    { name: 'comm_source', type: 'STRING', mode: 'NULLABLE' },
    // Nested structs
    {
      name: 'named_insured',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: NAMED_INSURED_FIELDS,
    },
    {
      name: 'mailing_address',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: [
        ...ADDRESS_FIELDS,
        { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      ],
    },
    {
      name: 'agent',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENT_FIELDS,
    },
    {
      name: 'agency',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENCY_FIELDS,
    },
    // Repeated line items
    {
      name: 'fees',
      type: 'RECORD',
      mode: 'REPEATED',
      fields: FEE_ITEM_FIELDS,
    },
    {
      name: 'taxes',
      type: 'RECORD',
      mode: 'REPEATED',
      fields: TAX_ITEM_FIELDS,
    },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * policy_locations — one row per location within a policy document write.
 * Sourced from the `locations` Firestore collection (ILocationPolicy).
 * The policy document's embedded PolicyLocation record is intentionally excluded
 * here; these rows come from the flat `locations` collection CDC trigger, which
 * carries the full BaseLocation shape including coordinates and rating data.
 */
export const POLICY_LOCATIONS_SCHEMA: TableSchema = {
  fields: [
    { name: 'location_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'policy_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'quote_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'submission_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'parent_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'external_id', type: 'STRING', mode: 'NULLABLE' },
    // Geographic
    { name: 'latitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'longitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'geo_hash', type: 'STRING', mode: 'NULLABLE' },
    {
      name: 'address',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: ADDRESS_FIELDS,
    },
    // Premium
    { name: 'annual_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'term_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'term_days', type: 'INTEGER', mode: 'NULLABLE' },
    // Coverage
    { name: 'tiv', type: 'FLOAT', mode: 'NULLABLE', description: 'Total insured value' },
    { name: 'deductible', type: 'INTEGER', mode: 'NULLABLE' },
    {
      name: 'limits',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: LIMITS_FIELDS,
    },
    {
      name: 'rcvs',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: RCV_FIELDS,
    },
    // Rating
    {
      name: 'rating_property_data',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: RATING_PROPERTY_DATA_FIELDS,
    },
    // Lifecycle
    { name: 'effective_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'expiration_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'cancel_eff_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'cancel_reason', type: 'STRING', mode: 'NULLABLE' },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * transactions — one row per write to the `transactions` Firestore collection.
 * Covers PremiumTransaction, OffsetTransaction, and AmendmentTransaction via a
 * unified schema; fields not applicable to a given trxInterfaceType are NULL.
 */
export const TRANSACTIONS_SCHEMA: TableSchema = {
  fields: [
    { name: 'trx_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'trx_interface_type', type: 'STRING', mode: 'NULLABLE', description: 'premium | offset | amendment' },
    { name: 'product', type: 'STRING', mode: 'NULLABLE' },
    { name: 'policy_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'location_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'external_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'term', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'booking_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'issuing_carrier', type: 'STRING', mode: 'NULLABLE' },
    { name: 'named_insured', type: 'STRING', mode: 'NULLABLE' },
    { name: 'home_state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'policy_eff_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'policy_exp_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'trx_eff_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'trx_exp_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'trx_days', type: 'INTEGER', mode: 'NULLABLE' },
    {
      name: 'agent',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENT_FIELDS,
    },
    {
      name: 'agency',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENCY_FIELDS,
    },
    // PremiumTransaction / OffsetTransaction fields (NULL on AmendmentTransaction)
    { name: 'term_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'mga_commission', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'mga_commission_pct', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'net_dwp', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'daily_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'net_error_adj', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'surplus_lines_tax', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'surplus_lines_regulatory_fee', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'mga_fee', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'inspection_fee', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'cancel_reason', type: 'STRING', mode: 'NULLABLE' },
    // PremiumTransaction-only fields
    { name: 'tiv', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'deductible', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'location_annual_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'term_prorated_pct', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'billing_entity_id', type: 'STRING', mode: 'NULLABLE' },
    {
      name: 'limits',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: LIMITS_FIELDS,
    },
    {
      name: 'rcvs',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: RCV_FIELDS,
    },
    {
      name: 'rating_property_data',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: [
        ...RATING_PROPERTY_DATA_FIELDS,
        { name: 'tier1', type: 'BOOLEAN', mode: 'NULLABLE' },
        { name: 'construction', type: 'STRING', mode: 'NULLABLE' },
      ],
    },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * submissions — one row per write to the `submissions` Firestore collection.
 */
export const SUBMISSIONS_SCHEMA: TableSchema = {
  fields: [
    { name: 'product', type: 'STRING', mode: 'NULLABLE' },
    { name: 'status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'submitted_by_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'deductible', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'annual_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'geo_hash', type: 'STRING', mode: 'NULLABLE' },
    { name: 'latitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'longitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'comm_source', type: 'STRING', mode: 'NULLABLE' },
    {
      name: 'address',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: ADDRESS_FIELDS,
    },
    {
      name: 'limits',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: LIMITS_FIELDS,
    },
    {
      name: 'rating_property_data',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: RATING_PROPERTY_DATA_FIELDS,
    },
    {
      name: 'agent',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENT_FIELDS,
    },
    {
      name: 'agency',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENCY_FIELDS,
    },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * quotes — one row per write to the `quotes` Firestore collection.
 */
export const QUOTES_SCHEMA: TableSchema = {
  fields: [
    { name: 'policy_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'product', type: 'STRING', mode: 'NULLABLE' },
    { name: 'status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'home_state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'submission_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'external_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'deductible', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'annual_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'quote_total', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'card_fee', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'latitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'longitude', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'geo_hash', type: 'STRING', mode: 'NULLABLE' },
    { name: 'comm_source', type: 'STRING', mode: 'NULLABLE' },
    { name: 'rating_doc_id', type: 'STRING', mode: 'NULLABLE' },
    // Timestamps
    { name: 'effective_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'quote_published_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'quote_expiration_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'quote_bound_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    // Nested structs
    {
      name: 'address',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: ADDRESS_FIELDS,
    },
    {
      name: 'limits',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: LIMITS_FIELDS,
    },
    {
      name: 'rating_property_data',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: RATING_PROPERTY_DATA_FIELDS,
    },
    {
      name: 'named_insured',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: [
        { name: 'first_name', type: 'STRING', mode: 'NULLABLE' },
        { name: 'last_name', type: 'STRING', mode: 'NULLABLE' },
        { name: 'email', type: 'STRING', mode: 'NULLABLE' },
        { name: 'phone', type: 'STRING', mode: 'NULLABLE' },
        { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
      ],
    },
    {
      name: 'agent',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENT_FIELDS,
    },
    {
      name: 'agency',
      type: 'RECORD',
      mode: 'NULLABLE',
      fields: AGENCY_FIELDS,
    },
    // Repeated line items
    {
      name: 'fees',
      type: 'RECORD',
      mode: 'REPEATED',
      fields: FEE_ITEM_FIELDS,
    },
    {
      name: 'taxes',
      type: 'RECORD',
      mode: 'REPEATED',
      fields: TAX_ITEM_FIELDS,
    },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * tax_transactions — one row per write to the `taxTransactions` Firestore collection.
 * Covers both TaxOgTransaction and TaxReversalTransaction; reversal-only fields are
 * NULL on original transaction rows.
 */
export const TAX_TRANSACTIONS_SCHEMA: TableSchema = {
  fields: [
    { name: 'type', type: 'STRING', mode: 'NULLABLE', description: 'transaction | reversal' },
    { name: 'tax_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'tax_calc_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'policy_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'invoice_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'payment_intent_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'charge_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'receivable_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'stripe_customer_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'charge_amount', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'tax_amount', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'refundable', type: 'BOOLEAN', mode: 'NULLABLE' },
    { name: 'tax_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    // TaxReversalTransaction-only fields (NULL on original transactions)
    { name: 'refund_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'reversal_original_transaction_id', type: 'STRING', mode: 'NULLABLE' },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * tax_calculations — one row per write to the `taxCalculations` Firestore collection.
 * Stores the full TaxCalc object including the subject base breakdown used for
 * reconciliation verification.
 */
export const TAX_CALCULATIONS_SCHEMA: TableSchema = {
  fields: [
    { name: 'tax_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'tax_calc_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'display_name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'rate', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'value', type: 'FLOAT', mode: 'NULLABLE', description: 'Calculated tax amount' },
    { name: 'subject_base_amount', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'base_digits', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'result_digits', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'base_round_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'result_round_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'transaction_types', type: 'STRING', mode: 'REPEATED' },
    { name: 'refundable', type: 'BOOLEAN', mode: 'NULLABLE' },
    { name: 'calc_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'expiration_date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'stripe_customer_id', type: 'STRING', mode: 'NULLABLE' },
    {
      name: 'subject_base_item_values',
      type: 'RECORD',
      mode: 'NULLABLE',
      description: 'Breakdown of the subject base amount used in the tax calculation.',
      fields: [
        { name: 'premium', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'inspection_fees', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'mga_fees', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'out_state_premium', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'home_state_premium', type: 'FLOAT', mode: 'NULLABLE' },
      ],
    },
    // System columns
    ...SYSTEM_FIELDS,
  ],
};

/**
 * portfolio_exposure — one row per (bucket, snapshot_date) from the daily batch job.
 * Partitioned on computed_at so queries can cheaply scan a date range.
 * No _deleted column — this table is append-only (full overwrite per partition run).
 */
export const PORTFOLIO_EXPOSURE_SCHEMA: TableSchema = {
  fields: [
    { name: 'snapshot_date', type: 'DATE', mode: 'REQUIRED', description: 'YYYY-MM-DD of the batch run.' },
    { name: 'bucket_id', type: 'STRING', mode: 'REQUIRED', description: 'state#countyFips#floodZone#geohashPrefix' },
    { name: 'state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'county_fips', type: 'STRING', mode: 'NULLABLE' },
    { name: 'county_name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'flood_zone', type: 'STRING', mode: 'NULLABLE' },
    { name: 'geohash_prefix', type: 'STRING', mode: 'NULLABLE', description: 'First N chars of geohash (precision from config).' },
    { name: 'location_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'total_insured_value', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'total_term_premium', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'avg_deductible', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'computed_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'computed_by', type: 'STRING', mode: 'NULLABLE', description: 'Function name + invocation ID for traceability.' },
  ],
};

/**
 * portfolio_concentration_alerts — one row per alert emitted by the daily portfolio job.
 */
export const PORTFOLIO_CONCENTRATION_ALERTS_SCHEMA: TableSchema = {
  fields: [
    { name: 'alert_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'bucket_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'county_fips', type: 'STRING', mode: 'NULLABLE' },
    { name: 'flood_zone', type: 'STRING', mode: 'NULLABLE' },
    { name: 'geohash_prefix', type: 'STRING', mode: 'NULLABLE' },
    { name: 'alert_type', type: 'STRING', mode: 'NULLABLE', description: 'absolute_tiv | week_over_week_shift' },
    { name: 'current_tiv', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'threshold_tiv', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'previous_tiv', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'shift_pct', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'status', type: 'STRING', mode: 'NULLABLE', description: 'active | resolved | acknowledged' },
    { name: 'detected_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'resolved_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
  ],
};

/**
 * tax_reconciliation_reports — one row per daily reconciliation report.
 * State and transaction-type breakdowns are JSON strings to avoid a wide schema
 * that would need updating as new states or transaction types are added.
 */
export const TAX_RECONCILIATION_REPORTS_SCHEMA: TableSchema = {
  fields: [
    { name: 'report_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'report_date', type: 'DATE', mode: 'REQUIRED' },
    { name: 'total_tax_collected', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'total_tax_refunded', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'net_tax_liability', type: 'FLOAT', mode: 'NULLABLE' },
    {
      name: 'by_state_json',
      type: 'STRING',
      mode: 'NULLABLE',
      description: 'JSON: Record<State, { collected, refunded, net_liability }>',
    },
    {
      name: 'by_transaction_type_json',
      type: 'STRING',
      mode: 'NULLABLE',
      description: 'JSON: Record<TransactionType, { collected, refunded }>',
    },
    { name: 'discrepancy_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'total_discrepancy_amount', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'processed_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'lookback_days', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'generated_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
  ],
};

// ---------------------------------------------------------------------------
// Table registry
// ---------------------------------------------------------------------------

/**
 * All pipeline tables with their partition and cluster configuration.
 * Passed to `ensureTables()` during setup and can be imported by row-transform
 * modules that need to reference table IDs.
 */
export const TABLE_CONFIGS: TableConfig[] = [
  {
    tableId: 'policies',
    schema: POLICIES_SCHEMA,
    partitionField: 'effective_date',
    clusterFields: ['home_state', 'product', 'payment_status'],
    description: 'CDC mirror of the Firestore policies collection.',
  },
  {
    tableId: 'policy_locations',
    schema: POLICY_LOCATIONS_SCHEMA,
    partitionField: 'effective_date',
    clusterFields: ['state', 'flood_zone', 'county_fips'],
    description: 'CDC mirror of the Firestore locations collection (parentType=policy).',
  },
  {
    tableId: 'transactions',
    schema: TRANSACTIONS_SCHEMA,
    partitionField: 'booking_date',
    clusterFields: ['trx_type', 'policy_id', 'home_state'],
    description: 'CDC mirror of the Firestore transactions collection.',
  },
  {
    tableId: 'submissions',
    schema: SUBMISSIONS_SCHEMA,
    partitionField: '_ingested_at',
    clusterFields: ['status', 'home_state'],
    description: 'CDC mirror of the Firestore submissions collection.',
  },
  {
    tableId: 'quotes',
    schema: QUOTES_SCHEMA,
    partitionField: 'quote_published_date',
    clusterFields: ['status', 'home_state', 'submission_id'],
    description: 'CDC mirror of the Firestore quotes collection.',
  },
  {
    tableId: 'tax_transactions',
    schema: TAX_TRANSACTIONS_SCHEMA,
    partitionField: 'tax_date',
    clusterFields: ['state', 'tax_id', 'type'],
    description: 'CDC mirror of the Firestore taxTransactions collection.',
  },
  {
    tableId: 'tax_calculations',
    schema: TAX_CALCULATIONS_SCHEMA,
    partitionField: 'calc_date',
    clusterFields: ['state', 'tax_id'],
    description: 'CDC mirror of the Firestore taxCalculations collection.',
  },
  {
    tableId: 'portfolio_exposure',
    schema: PORTFOLIO_EXPOSURE_SCHEMA,
    partitionField: 'computed_at',
    clusterFields: ['state', 'flood_zone', 'county_fips'],
    description: 'Daily exposure bucket snapshots from the portfolio aggregation job.',
  },
  {
    tableId: 'portfolio_concentration_alerts',
    schema: PORTFOLIO_CONCENTRATION_ALERTS_SCHEMA,
    partitionField: 'detected_at',
    clusterFields: ['state', 'flood_zone', 'alert_type'],
    description: 'Concentration risk alerts emitted by the portfolio aggregation job.',
  },
  {
    tableId: 'tax_reconciliation_reports',
    schema: TAX_RECONCILIATION_REPORTS_SCHEMA,
    partitionField: 'report_date',
    clusterFields: ['report_date'],
    description: 'Daily tax reconciliation summaries.',
  },
];

/** Convenience lookup: tableId → TableConfig */
export const TABLE_CONFIG_BY_ID = Object.fromEntries(
  TABLE_CONFIGS.map((c) => [c.tableId, c]),
) as Record<string, TableConfig>;
