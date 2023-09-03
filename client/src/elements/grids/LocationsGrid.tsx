import { GridColDef } from '@mui/x-data-grid';
import { useMemo } from 'react';

import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useAsyncToast, useGridActions, useWidth } from 'hooks';
import { locationCols } from 'modules/muiGrid';

export type LocationGridProps = ServerDataGridCollectionProps;

export const LocationsGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: LocationGridProps) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);

  const columns = useMemo<GridColDef[]>(
    () => [
      // TODO: add request edit button, etc.
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 100,
        getActions: (params) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: isSmall }),
          floodFactorAction(params, { showInMenu: isSmall }),
        ],
      },
      ...locationCols,
      ...additionalColumns,
    ],
    [renderActions, googleMapsAction, floodFactorAction, isSmall, additionalColumns]
  );

  return (
    <ServerDataGrid
      colName='LOCATIONS'
      columns={columns}
      pageSizeOptions={[5, 10, 25, 100]}
      initialState={{
        columns: {
          columnVisibilityModel: {
            id: false,
            product: false,
            policyId: false,
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
  );
};
