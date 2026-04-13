import { GridColDef } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { Claim, type ILocation } from '@idemand/common';
import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import {
  useAsyncToast,
  useGridActions,
  useGridShowJson,
  useWidth,
} from 'hooks';
import { LOCATION_COLUMN_VISIBILITY, locationCols } from 'modules/muiGrid';

export type LocationGridProps = ServerDataGridCollectionProps<ILocation>;

export const LocationsGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: LocationGridProps) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);
  const renderShowJson = useGridShowJson(
    'locations',
    { showInMenu: true },
    { requiredClaims: { [Claim.enum.iDemandAdmin]: true } },
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      // TODO: add request edit button, etc.
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 120,
        getActions: (params) => [
          ...renderActions(params),
          ...renderShowJson(params),
          googleMapsAction(params, { showInMenu: true }),
          floodFactorAction(params, { showInMenu: true }),
        ],
      },
      ...locationCols,
      ...additionalColumns,
    ],
    [
      renderActions,
      renderShowJson,
      googleMapsAction,
      floodFactorAction,
      isSmall,
      additionalColumns,
    ],
  );

  return (
    <ServerDataGrid<ILocation>
      colName='locations'
      columns={columns}
      pageSizeOptions={[5, 10, 25, 100]}
      autoHeight
      {...props}
      initialState={{
        columns: {
          columnVisibilityModel: LOCATION_COLUMN_VISIBILITY,
        },
        sorting: {
          sortModel: [{ field: 'metadata.created', sort: 'desc' }],
        },
        pagination: { paginationModel: { page: 0, pageSize: 5 } },
        ...(initialState || {}),
      }}
    />
  );
};
