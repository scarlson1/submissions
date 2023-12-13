import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';
import { ROUTES, createPath } from 'router';

import { Claim, Receivable, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useGridShowJson } from 'hooks';
import { RECEIVABLE_COLUMN_VISIBILITY, receivableCols } from 'modules/muiGrid/gridColumnDefs';

// requires rxjs query unless iDemand admin ?? get policies by user/agent/org, then fetch receivables ??

export type ReceivablesGridProps = ServerDataGridCollectionProps<Receivable>;

export const ReceivablesGrid = ({
  renderActions = () => [],
  additionalColumns,
  ...props
}: ReceivablesGridProps) => {
  const navigate = useNavigate();
  const { data } = useSigninCheck({ requiredClaims: { [Claim.Enum.iDemandAdmin]: true } });
  const renderShowJson = useGridShowJson(
    'receivables',
    { showInMenu: true },
    { requiredClaims: { [Claim.Enum.iDemandAdmin]: true } },
    null,
    null
  );

  const receivableColumns: GridColDef<Receivable>[] = useMemo(
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
      ...receivableCols,
      ...(additionalColumns || []),
    ],
    [renderActions, renderShowJson, additionalColumns]
  );

  if (!data.hasRequiredClaims) return null;

  return (
    <ServerDataGrid
      colName='receivables'
      columns={receivableColumns}
      density='compact'
      autoHeight
      // TODO: change path to view receivable details once route added (or use same route and display different components depending on status)
      onRowDoubleClick={(params) =>
        navigate(
          createPath({
            path: ROUTES.PAYABLE_CHECKOUT,
            params: { receivableId: params.id.toString() },
          })
        )
      }
      slotProps={{
        toolbar: { csvOptions: { allColumns: false } },
      }}
      initialState={{
        columns: {
          columnVisibilityModel: RECEIVABLE_COLUMN_VISIBILITY,
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
