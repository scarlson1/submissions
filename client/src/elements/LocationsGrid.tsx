import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGridProps } from '@mui/x-data-grid';

import { BasicDataGrid } from 'components';
import {
  addrCityCol,
  addrLine1Col,
  addrLine2Col,
  addrStateCol,
  addrPostalCol,
  addrCountyCol,
  addrFIPSCol,
  annualPremiumCol,
  deductibleCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  PolicyLocation,
  addressSummaryCol,
  ratingDataReplacementCostCol,
  ratingDataPropertyCodeCol,
  ratingDataYearBuiltCol,
  ratingDataSqFootageCol,
  ratingDataNumStoriesCol,
  ratingDataBasementCol,
  ratingDataDistToCoastFeetCol,
  ratingDataCBRSCol,
  ratingDataFloodZoneCol,
  createdCol,
  updatedCol,
  idCol,
  coordinatesCol,
  longitudeCol,
  latitudeCol,
  expirationDateCol,
  effectiveDateCol,
  booleanCalcActiveCol,
  additionalInsuredsCol,
  mortgageeCol,
  externalIdCol,
  ratingDocIdCol,
} from 'common';

// TODO: handle > 100 locations
// need to implement pagination
// TODO: limit viewable columns depending on permissions

interface LocationsGridProps extends Omit<DataGridProps, 'rows' | 'columns'> {
  locations: PolicyLocation[];
}

export const LocationsGrid = ({ locations, ...props }: LocationsGridProps) => {
  const locationColumns = useMemo(
    () => [
      // TODO: add request edit button, view google maps, etc.
      idCol,
      addressSummaryCol,
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      addrCountyCol,
      addrFIPSCol,
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      tivCol,
      deductibleCol,
      annualPremiumCol,
      booleanCalcActiveCol,
      effectiveDateCol,
      expirationDateCol,
      additionalInsuredsCol,
      mortgageeCol,
      coordinatesCol,
      latitudeCol,
      longitudeCol,
      ratingDataReplacementCostCol,
      ratingDataPropertyCodeCol,
      ratingDataYearBuiltCol,
      ratingDataSqFootageCol,
      ratingDataNumStoriesCol,
      ratingDataBasementCol,
      ratingDataDistToCoastFeetCol,
      ratingDataCBRSCol,
      ratingDataFloodZoneCol,
      ratingDocIdCol,
      externalIdCol,
      createdCol,
      updatedCol,
    ],
    []
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
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
