import { GridColDef } from '@mui/x-data-grid';

import { PolicyClaim, PolicyClaimStatus } from '@idemand/common';
import {
  addressSummaryCol,
  createdCol,
  dateColBaseProps,
  idCol,
  locationIdCol,
  policyIdCol,
  statusCol,
  updatedCol,
} from './gridColumns';

const occurrenceDateCol: GridColDef<PolicyClaim> = {
  ...dateColBaseProps,
  field: 'occurrenceDate',
  headerName: 'Date of Loss',
  filterable: true,
  sortable: true,
  valueGetter: (params) => params.row.occurrenceDate || null,
};

const submittedAtCol: GridColDef<PolicyClaim> = {
  ...dateColBaseProps,
  field: 'submittedAt',
  headerName: 'Submitted',
  filterable: true,
  sortable: true,
  valueGetter: (params) => params.row.submittedAt || null,
};

const claimAddressCol: GridColDef<PolicyClaim> = {
  ...addressSummaryCol,
  field: 'address',
  headerName: 'Location Address',
  sortable: false,
  filterable: false,
  valueGetter: (params) => {
    const a = params.row.address;
    if (!a) return null;
    let formatted = '';
    if (a.addressLine1) formatted += a.addressLine1;
    if (a.city) formatted += `, ${a.city}`;
    if (a.state) formatted += `, ${a.state}`;
    return formatted || null;
  },
};

const namedInsuredCol: GridColDef<PolicyClaim> = {
  field: 'namedInsured.displayName',
  headerName: 'Named Insured',
  type: 'string',
  minWidth: 180,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params) =>
    params.row.namedInsured?.displayName ||
    [params.row.namedInsured?.firstName, params.row.namedInsured?.lastName]
      .filter(Boolean)
      .join(' ') ||
    null,
};

const claimContactCol: GridColDef<PolicyClaim> = {
  field: 'contact.name',
  headerName: 'Contact',
  type: 'string',
  minWidth: 160,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params) =>
    [params.row.contact?.firstName, params.row.contact?.lastName]
      .filter(Boolean)
      .join(' ') || null,
};

const descriptionCol: GridColDef<PolicyClaim> = {
  field: 'description',
  headerName: 'Description',
  type: 'string',
  minWidth: 220,
  flex: 1.5,
  editable: false,
  filterable: false,
  sortable: false,
};

export const claimCols: GridColDef<PolicyClaim>[] = [
  idCol,
  policyIdCol,
  locationIdCol,
  occurrenceDateCol,
  submittedAtCol,
  {
    ...statusCol,
    filterable: true,
    valueOptions: PolicyClaimStatus.options,
  },
  claimAddressCol,
  namedInsuredCol,
  claimContactCol,
  descriptionCol,
  createdCol,
  updatedCol,
];

export const CLAIM_COLUMN_VISIBILITY = {
  id: false,
  locationId: false,
  description: false,
  'contact.name': false,
  'metadata.updated': false,
};
