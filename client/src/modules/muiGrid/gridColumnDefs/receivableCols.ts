import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import { Receivable } from 'common';
import {
  billingEntityEmail,
  billingEntityName,
  billingEntityPhone,
  createdCol,
  downloadInvoiceCol,
  dueDateCol,
  feesSumCol,
  idCol,
  invoiceIdCol,
  invoiceNumberCol,
  locationAddressesCol,
  locationsCountCol,
  paidCol,
  paidOutOfBandCol,
  policyIdCol,
  receiptNumberCol,
  statusCol,
  stripeAmountCol,
  stripeCustomerIdCol,
  stripeHostedInvoiceUrlCol,
  taxesSumCol,
  updatedCol,
} from './gridColumns';

export const receivableCols: GridColDef<Receivable>[] = [
  { ...idCol, headerName: 'Receivable ID' },
  invoiceNumberCol,
  statusCol,
  paidCol,
  billingEntityName,
  billingEntityEmail,
  billingEntityPhone,
  {
    ...stripeAmountCol,
    field: 'termPremiumAmount',
    headerName: 'Entity Term Premium',
  },
  feesSumCol,
  taxesSumCol,
  {
    ...stripeAmountCol,
    field: 'totalAmount',
    headerName: 'Amount',
    sortable: true,
    filterable: true,
  },
  dueDateCol,
  downloadInvoiceCol,
  locationAddressesCol,
  locationsCountCol,
  policyIdCol,
  stripeCustomerIdCol,
  stripeHostedInvoiceUrlCol,
  receiptNumberCol, // TODO: link to receipt ??
  // TODO: amount totals
  // TODO: transfers
  // TODO:  refunded, etc.
  createdCol,
  updatedCol,
];

export const adminReceivableCols: GridColDef<Receivable>[] = [
  paidOutOfBandCol,
  invoiceIdCol,
  {
    ...idCol,
    minWidth: 220,
    field: 'paymentIntentId',
    headerName: 'Payment Intent',
  },
];

export const RECEIVABLE_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
  id: false,
  invoiceId: false,
  status: false,
  'billingEntityDetails.name': false,
  'billingEntityDetails.phone': false,
  termPremiumAmount: false,
  fees: false,
  taxes: false,
  stripeCustomerId: false,
  paymentIntentId: false,
  receiptNumber: false,
  'metadata.updated': false,
  paidOutOfBand: false,
};
