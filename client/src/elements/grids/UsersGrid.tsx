import { Box } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, createPath } from 'router';

import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { userCols } from 'modules/muiGrid/gridColumnDefs';

type UsersGridProps = ServerDataGridCollectionProps;

export const UsersGrid = ({
  renderActions,
  additionalColumns = [],
  initialState,
  ...props
}: UsersGridProps) => {
  const navigate = useNavigate();
  const columns: GridColDef[] = useMemo(() => {
    const actions = renderActions
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: 80,
            getActions: (params: GridRowParams) => [...renderActions(params)],
          },
        ]
      : [];

    return [...actions, ...userCols, ...additionalColumns];
  }, [renderActions, additionalColumns]);

  const viewUser = useCallback(
    ({ id }: GridRowParams) => {
      navigate(createPath({ path: ROUTES.USER, params: { userId: id.toString() } }));
    },
    [navigate]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='users'
        columns={columns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          ...initialState,
        }}
        onRowDoubleClick={viewUser}
        {...props}
      />
    </Box>
  );
};
