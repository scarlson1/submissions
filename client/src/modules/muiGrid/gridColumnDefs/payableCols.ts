import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import { Payable } from 'common';
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
  statusCol,
  stripeAmountCol,
  stripeCustomerIdCol,
  taxesSumCol,
  updatedCol,
} from './gridColumns';

export const payableCols: GridColDef<Payable>[] = [
  { ...idCol, headerName: 'Payable ID' },
  invoiceNumberCol,
  invoiceIdCol,
  statusCol,
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
  stripeCustomerIdCol, // TODO: linkable to stripe ??
  {
    ...idCol,
    field: 'paymentIntentId',
    headerName: 'Payment Intent',
  },
  {
    field: 'receiptNumber',
    headerName: 'Receipt',
    sortable: false,
    filterable: false,
  },
  // TODO: hosted invoice URL ?? download PDF (component/button)
  // TODO: amount totals
  // TODO: transfers
  createdCol,
  updatedCol,
];

export const PAYABLE_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
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
};
