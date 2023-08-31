import { DataObjectRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';

import { COLLECTIONS, ServerDataGridCollectionProps, Transaction } from 'common';
import { ServerDataGrid } from 'components';
import { useShowJson, useWidth } from 'hooks';
import { transactionCols } from 'modules/muiGrid/gridColumnDefs';

export type TransactionsGridProps = ServerDataGridCollectionProps;

export const TransactionsGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: TransactionsGridProps) => {
  const { isSmall } = useWidth();
  const showJson = useShowJson<Transaction>(COLLECTIONS.TRANSACTIONS);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

  const columns: GridColDef[] = useMemo(() => {
    const actions = [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 100,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          <GridActionsCellItem
            icon={
              <Tooltip title='show JSON' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
            label='Show JSON'
            showInMenu={isSmall}
          />,
        ],
      },
    ];

    return [...actions, ...transactionCols, ...additionalColumns];
  }, [isSmall, renderActions, additionalColumns, handleShowJson]);

  return (
    <ServerDataGrid
      colName='TRANSACTIONS'
      columns={columns}
      density='compact'
      autoHeight
      initialState={{
        columns: {
          columnVisibilityModel: {
            id: false,
            trxInterfaceType: false,
            product: false,
            externalId: false,
            tiv: false,
            homeState: false,
            dailyPremium: false,
            'metadata.updated': false,
            'insuredLocation.address.addressLine1': false,
            'insuredLocation.address.addressLine2': false,
            'insuredLocation.address.city': false,
            'insuredLocation.address.state': false,
            'insuredLocation.address.postal': false,
            'insuredLocation.address.countyName': false,
            'insuredLocation.address.countyFIPS': false,
            'insuredLocation.coordinates.latitude': false,
            'insuredLocation.coordinates.longitude': false,
            'mailingAddress.addressLine1': false,
            'mailingAddress.addressLine2': false,
            'mailingAddress.city': false,
            'mailingAddress.state': false,
            'mailingAddress.postal': false,
          },
        },
        sorting: {
          sortModel: [{ field: 'metadata.created', sort: 'desc' }],
        },
        pagination: { paginationModel: { page: 0, pageSize: 10 } },
        ...initialState,
      }}
      {...props}
    />
  );
};
