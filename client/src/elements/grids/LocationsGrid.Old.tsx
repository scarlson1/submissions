import { Box } from '@mui/material';
import { DataGridProps, GridColDef, GridRowParams, useGridApiRef } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { PolicyLocation } from 'common';
import { BasicDataGrid } from 'components';
import { useAsyncToast, useGridActions, useWidth } from 'hooks';
import { locationCols } from 'modules/muiGrid/gridColumnDefs';

// TODO: use useReducer to handle sorting and filtering
// ref: https://github.com/TarikHuber/material-ui-filter/blob/master/src/store/selectors.js
// TODO: limit viewable columns depending on permissions

interface LocationsGridProps extends Omit<DataGridProps, 'rows' | 'columns' | 'initialState'> {
  locations: PolicyLocation[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
  initialState?: Omit<DataGridProps['initialState'], 'pagination'>;
}

export const LocationsGridOld = ({
  locations,
  renderActions = () => [],
  ...props
}: LocationsGridProps) => {
  const apiRef = useGridApiRef();
  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);

  const locationColumns = useMemo(
    () => [
      // TODO: add request edit button, etc.
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 100,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: isSmall }),
          floodFactorAction(params, { showInMenu: isSmall }),
        ],
      },
      ...locationCols,
    ],
    [renderActions, googleMapsAction, floodFactorAction, isSmall]
  );

  return (
    <Box>
      <BasicDataGrid
        apiRef={apiRef}
        rows={locations || []}
        columns={locationColumns}
        pageSizeOptions={[5, 10, 25, 100]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              product: false,
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'address.countyName': false,
              'address.countyFIPS': false,
              coordinates: false,
              latitude: false,
              longitude: false,
              annualPremium: false,
              'ratingPropertyData.CBRSDesignation': false,
              'ratingPropertyData.basement': false,
              'ratingPropertyData.distToCoastFeet': false,
              'ratingPropertyData.floodZone': false,
              'ratingPropertyData.numStories': false,
              'ratingPropertyData.propertyCode': false,
              'ratingPropertyData.sqFootage': false,
              'ratingPropertyData.yearBuilt': false,
              'ratingPropertyData.replacementCost': false,
              'ratingPropertyData.ratingDocId': false,
              ratingDocId: false,
              externalId: false,
              'metadata.created': false,
              'metadata.updated': false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 5 } },
        }}
        {...props}
      />
    </Box>
  );
};
