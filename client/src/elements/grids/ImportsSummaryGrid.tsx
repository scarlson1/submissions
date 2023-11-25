import { Box } from '@mui/material';
import { GridRowParams } from '@mui/x-data-grid';
import { capitalize } from 'lodash';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { CLAIMS, ImportSummary, WithId } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useGridShowJson } from 'hooks';
import { importSummaryCols } from 'modules/muiGrid';
import { formatFirestoreTimestamp } from 'modules/utils';
import { ADMIN_ROUTES, createPath } from 'router';

export interface ImportSummaryGridProps
  extends Omit<
    ServerDataGridProps<ImportSummary>,
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
  const renderShowJson = useGridShowJson(
    'dataImports',
    { showInMenu: false },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } },
    getImportSummaryTitle
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
          ...renderShowJson(params),
        ],
      },
      ...importSummaryCols,
    ],
    [renderActions, renderShowJson]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='dataImports'
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
