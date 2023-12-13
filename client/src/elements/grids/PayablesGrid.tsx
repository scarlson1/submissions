import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';
import { ROUTES, createPath } from 'router';

import { Claim, Payable, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useGridShowJson } from 'hooks';
import { PAYABLE_COLUMN_VISIBILITY, payableCols } from 'modules/muiGrid/gridColumnDefs';

// requires rxjs query unless iDemand admin ?? get policies by user/agent/org, then fetch payables ??

export type PayablesGridProps = ServerDataGridCollectionProps<Payable>;

export const PayablesGrid = ({
  renderActions = () => [],
  additionalColumns,
  ...props
}: PayablesGridProps) => {
  const navigate = useNavigate();
  const { data } = useSigninCheck({ requiredClaims: { [Claim.Enum.iDemandAdmin]: true } });
  const renderShowJson = useGridShowJson(
    'payables',
    { showInMenu: true },
    { requiredClaims: { [Claim.Enum.iDemandAdmin]: true } },
    null,
    null
  );

  const payableColumns: GridColDef<Payable>[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip placement='top' title='view policy'>
          //       <DescriptionRounded />
          //     </Tooltip>
          //   }
          //   onClick={viewPolicyDoc(params)}
          //   label='View Policy'
          //   disabled={!(params.row.documents && params.row.documents[0]?.downloadUrl)}
          // />,
          ...renderShowJson(params),
        ],
      },
      ...payableCols,
      ...(additionalColumns || []),
    ],
    [renderActions, renderShowJson, additionalColumns]
  );

  if (!data.hasRequiredClaims) return null;

  return (
    <ServerDataGrid
      colName='payables'
      columns={payableColumns}
      density='compact'
      autoHeight
      // TODO: change path to view payable details once route added (or use same route and display different components depending on status)
      onRowDoubleClick={(params) =>
        navigate(
          createPath({ path: ROUTES.PAYABLE_CHECKOUT, params: { payableId: params.id.toString() } })
        )
      }
      slotProps={{
        toolbar: { csvOptions: { allColumns: false } },
      }}
      initialState={{
        columns: {
          columnVisibilityModel: PAYABLE_COLUMN_VISIBILITY,
        },
        sorting: {
          sortModel: [{ field: 'metadata.created', sort: 'desc' }],
        },
        pagination: { paginationModel: { page: 0, pageSize: 10 } },
      }}
      {...props}
    />
  );
};
