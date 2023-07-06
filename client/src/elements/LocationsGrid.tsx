import { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGridProps, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { BasicDataGrid } from 'components';
import { PolicyLocation } from 'common';
import { useAsyncToast, useGridActions, useWidth } from 'hooks';
import { locationCols } from 'modules/gridColumnDefs';

// TODO: handle > 100 locations
// need to implement pagination
// TODO: limit viewable columns depending on permissions

interface LocationsGridProps extends Omit<DataGridProps, 'rows' | 'columns' | 'initialState'> {
  locations: PolicyLocation[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
  initialState?: Omit<DataGridProps['initialState'], 'pagination'>;
}

export const LocationsGrid = ({
  locations,
  renderActions = () => [],
  ...props
}: LocationsGridProps) => {
  // const { data: iDAdminCheck } = useSigninCheck({ requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true }})
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
        width: isSmall ? 60 : 80,
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
        rows={locations || []}
        columns={locationColumns}
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
              latitude: false,
              longitude: false,
              // annualPremium: false,
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
              created: false,
              updated: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
