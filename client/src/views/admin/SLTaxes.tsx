import React from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { GridColDef, GridRenderCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import { BasicDataGrid } from 'components';
import { Tax } from 'common/types';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { taxesCollection } from 'common/firestoreCollections';
import {
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  formatGridPercent,
  isCurrentDateBetween,
} from 'modules/utils/helpers';
import { createPath, ADMIN_ROUTES } from 'router';
import { renderChips } from 'components/RenderGridCellHelpers';
import { CheckRounded, CloseRounded } from '@mui/icons-material';

export const adminTaxLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    return getDocs(query(taxesCollection, orderBy('metadata.created', 'desc'), limit(100))).then(
      (querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }))
    );
  } catch (err) {
    throw new Response(`Error fetching submissions`);
  }
};

export interface TaxWithId extends Tax {
  id: string;
}

const taxColumns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'Doc ID',
    minWidth: 160,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'state',
    headerName: 'State',
    minWidth: 80,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'displayName',
    headerName: 'Display Name',
    minWidth: 160,
    flex: 0.8,
    editable: false,
  },
  {
    field: 'active',
    headerName: 'Active',
    description: 'Current date is after effective date and before expiration (if exists)',
    minWidth: 80,
    flex: 0.5,
    headerAlign: 'center',
    align: 'center',
    editable: false,
    valueGetter: (params) =>
      isCurrentDateBetween(params.row.effectiveDate?.toDate(), params.row.expirationDate?.toDate()),
    renderCell: (params) => {
      const isActive = !!params.value;

      if (isActive) return <CheckRounded color='success' fontSize='small' />;
      return <CloseRounded color='disabled' fontSize='small' />;
    },
  },
  {
    field: 'effectiveDate',
    headerName: 'Effective Date',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.effectiveDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'expirationDate',
    headerName: 'Expiration Date',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.expirationDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'rate',
    headerName: 'Rate',
    description:
      'Percentage rate (0.01 = 1%) applied to the sum of the fields in subject base, or a fixed rate for fixed dollar taxes',
    minWidth: 80,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
    valueGetter: (params) => params.row.rate || null,
    valueFormatter: (params: GridValueFormatterParams<number>) => {
      if (params.value > 0.15) return formatGridCurrency(params);
      return formatGridPercent(params, 2);
    },
    renderCell: (params: GridRenderCellParams<any, any, any>) => {
      // const rateType = params.row.rateType || (params.value > 0.15 ? 'fixed' : 'percent');
      // console.log('renderCall params: ', params);
      return (
        <Tooltip title={`${params.value}`} placement='left'>
          <Typography variant='body2'>{params.formattedValue}</Typography>
        </Tooltip>
      );
    },
  },
  {
    field: 'subjectBase',
    headerName: 'Subject Base',
    minWidth: 340,
    flex: 1,
    editable: false,
    renderCell: renderChips,
  },
  {
    field: 'transactionTypes',
    headerName: 'Transaction Types',
    minWidth: 340,
    flex: 1,
    editable: false,
    renderCell: (params) => renderChips(params, { variant: 'outlined', color: 'success' }),
  },
  {
    field: 'LOB',
    headerName: 'LOB',
    minWidth: 200,
    flex: 0.6,
    editable: false,
    renderCell: (params) => renderChips(params, { variant: 'outlined' }),
  },
  {
    field: 'baseRoundType',
    headerName: 'Base Round',
    minWidth: 100,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'baseDigits',
    headerName: 'Base Digits',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
  },
  {
    field: 'resultRoundType',
    headerName: 'Result Round',
    minWidth: 100,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'resultDigits',
    headerName: 'Result Round',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
  },
  {
    field: 'refundable',
    headerName: 'Refundable',
    minWidth: 100,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'metadata.created',
    headerName: 'Created',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.metadata.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'metadata.updated',
    headerName: 'Updated',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.metadata.updated || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
];

export interface SLTaxesProps {}

export const SLTaxes: React.FC<SLTaxesProps> = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as TaxWithId[];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5' gutterBottom sx={{ ml: 4 }}>
          Surplus Lines Taxes
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={taxColumns}
          density='compact'
          autoHeight
          initialState={{
            columns: {
              columnVisibilityModel: {
                // baseDigits: false,
                // resultDigits: false,
                id: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            // pagination: { paginationModel: { pageSize: 5 } },
            pagination: { pageSize: 10 },
            // filter: {
            //   filterModel: {
            //     items: [{ columnField: 'status', operatorValue: 'equals', value: 'pending' }],
            //   },
            // },
          }}
        />
      </Box>
    </Box>
  );
};
