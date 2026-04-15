import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import type { Receivable } from '@idemand/common';
import {
  billingEntityName,
  downloadInvoiceCol,
  dueDateCol,
  invoiceNumberCol,
  locationsCountCol,
  policyIdCol,
  statusCol,
  stripeAmountCol,
  totalAmountPaidCol,
} from './gridColumns';

export const userReceivableCols: GridColDef<Receivable>[] = [
  statusCol,
  invoiceNumberCol,
  policyIdCol,
  billingEntityName,
  {
    ...stripeAmountCol,
    field: 'totalAmount',
    headerName: 'Amount',
    sortable: true,
    filterable: false,
  },
  totalAmountPaidCol,
  dueDateCol,
  locationsCountCol,
  downloadInvoiceCol,
];

export const USER_RECEIVABLE_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
  'billingEntityDetails.name': false,
  locationsCount: false,
  totalAmountPaid: false,
};
