import React, { useCallback, useMemo } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { BasicDataGrid } from 'components';
import { limit, orderBy } from 'firebase/firestore';
import { formatGridCurrency, formatGridPercent } from 'modules/utils/helpers';
import { createPath, ADMIN_ROUTES } from 'router';
import { useCollectionData } from 'hooks';
import {
  LOBCol,
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  policyTrxTypesCol,
  productsCol,
  stateCol,
  subjectBaseCol,
  updatedCol,
} from 'common';
import { EditRounded } from '@mui/icons-material';

export const SLTaxes = () => {
  const navigate = useNavigate();
  const { data, status } = useCollectionData('TAXES', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);

  const handleEditTax = useCallback(
    ({ id }: GridRowParams) =>
      () => {
        navigate(
          createPath({ path: ADMIN_ROUTES.SL_TAXES_EDIT, params: { taxId: id.toString() } })
        );
      },
    [navigate]
  );

  const taxColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={handleEditTax(params)}
            label='Edit'
          />,
        ],
      },
      idCol,
      productsCol,
      stateCol,
      {
        field: 'displayName',
        headerName: 'Display Name',
        minWidth: 160,
        flex: 0.8,
        editable: false,
      },
      booleanCalcActiveCol,
      effectiveDateCol,
      expirationDateCol,
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
      subjectBaseCol,
      policyTrxTypesCol,
      LOBCol,
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
        type: 'boolean',
        minWidth: 100,
        flex: 0.6,
        editable: false,
      },
      createdCol,
      updatedCol,
    ],
    [handleEditTax]
  );

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
          loading={status === 'loading'}
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
            pagination: { paginationModel: { pageSize: 10 } },
            // pagination: { pageSize: 10 },
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
