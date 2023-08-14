import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useWidth } from 'hooks';
import { transactionCols } from 'modules/muiGrid/gridColumnDefs';

export type TransactionsGridProps = ServerDataGridCollectionProps;

export const TransactionsGrid = ({
  renderActions,
  additionalColumns = [],
  initialState,
  ...props
}: TransactionsGridProps) => {
  const { isSmall } = useWidth();

  const columns: GridColDef[] = useMemo(() => {
    const actions = renderActions
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: isSmall ? 60 : 100,
            getActions: (params: GridRowParams) => [...renderActions(params)],
          },
        ]
      : [];

    return [...actions, ...transactionCols, ...additionalColumns];
  }, [isSmall, renderActions, additionalColumns]);

  return (
    <ServerDataGrid
      collName='TRANSACTIONS'
      columns={columns}
      density='compact'
      autoHeight
      initialState={{
        columns: {
          columnVisibilityModel: {
            // product: false, TODO: uncomment after testing
            // externalId: false,
            // term: false,
            // tiv: false,
            // homeState: false,
            // dailyPremium: false,
            // policyAnnualDWP: false,
            // 'metadata.updated': false,
            // 'insuredLocation.address.addressLine1': false,
            // 'insuredLocation.address.addressLine2': false,
            // 'insuredLocation.address.city': false,
            // 'insuredLocation.address.state': false,
            // 'insuredLocation.address.postal': false,
            // 'mailingAddress.addressLine1': false,
            // 'mailingAddress.addressLine2': false,
            // 'mailingAddress.city': false,
            // 'mailingAddress.state': false,
            // 'mailingAddress.postal': false,
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
