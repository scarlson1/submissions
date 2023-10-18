import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { CLAIMS, COLLECTIONS, ServerDataGridCollectionProps, Transaction } from 'common';
import { ServerDataGrid } from 'components';
import { useGridShowJson, useWidth } from 'hooks';
import { TRANSACTION_COLUMN_VISIBILITY, transactionCols } from 'modules/muiGrid';

export type TransactionsGridProps = ServerDataGridCollectionProps;

export const TransactionsGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: TransactionsGridProps) => {
  const { isSmall } = useWidth();
  const renderShowJson = useGridShowJson<Transaction>(
    COLLECTIONS.TRANSACTIONS,
    { showInMenu: isSmall },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }
  );

  const columns: GridColDef[] = useMemo(() => {
    const actions = [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 80 : 100,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          ...renderShowJson(params),
        ],
      },
    ];

    return [...actions, ...transactionCols, ...additionalColumns];
  }, [isSmall, renderActions, renderShowJson, additionalColumns]);

  return (
    <ServerDataGrid
      colName='TRANSACTIONS'
      columns={columns}
      density='compact'
      autoHeight
      initialState={{
        columns: {
          columnVisibilityModel: TRANSACTION_COLUMN_VISIBILITY,
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
