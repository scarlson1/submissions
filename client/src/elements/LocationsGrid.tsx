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
      idCol,
      addressSummaryCol,
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      addrCountyCol,
      addrFIPSCol,
      annualPremiumCol,
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      tivCol,
      deductibleCol,
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
              annualPremium: false,
              CBRSDesignation: false,
              basement: false,
              distToCoastFeet: false,
              floodZone: false,
              numStories: false,
              propertyCode: false,
              sqFootage: false,
              yearBuilt: false,
              replacementCost: false,
              ratingDocIdCol: false,
              externalIdCol: false,
              created: false,
              updated: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          // pagination: { pageSize: 10 },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
