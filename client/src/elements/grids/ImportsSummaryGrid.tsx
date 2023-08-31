import { DataObjectRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { capitalize } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { COLLECTIONS, ImportSummary, WithId } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useShowJson } from 'hooks';
import { importSummaryCols } from 'modules/muiGrid/gridColumnDefs';
import { formatFirestoreTimestamp } from 'modules/utils';
import { ADMIN_ROUTES, createPath } from 'router';

export interface ImportSummaryGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'colName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  // additionalColumns?: GridColDef<any, any, any>[];
}

export const ImportsSummaryGrid = ({
  renderActions = () => [],
  ...props
}: ImportSummaryGridProps) => {
  const navigate = useNavigate();
  const showJson = useShowJson<ImportSummary>(COLLECTIONS.DATA_IMPORTS, [], getImportSummaryTitle);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

  const importColumns = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='view JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
            label='View JSON'
          />,
        ],
      },
      ...importSummaryCols,
    ],
    [renderActions, handleShowJson]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='DATA_IMPORTS'
        columns={importColumns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: { id: false },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        // onRowDoubleClick={(params) => navigate(params.id.toString())}
        onRowDoubleClick={(params) =>
          navigate(
            createPath({
              path: ADMIN_ROUTES.IMPORT_REVIEW,
              params: { importId: params.id.toString() },
            })
          )
        }
        {...props}
      />
    </Box>
  );
};

function getImportSummaryTitle(data: WithId<ImportSummary>) {
  return `${capitalize(data.targetCollection)} import ${
    data.metadata?.created ? formatFirestoreTimestamp(data.metadata?.created, 'date') : ''
  }`.trim();
}
