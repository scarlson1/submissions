import { Link } from '@mui/material';
import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';

import { Quote } from 'common';
import { GridCellCopy } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import {
  addrCityCol,
  addrCountyCol,
  addrFIPSCol,
  addrLine1Col,
  addrLine2Col,
  addrPostalCol,
  addrStateCol,
  addressSummaryCol,
  agencyAddressCol,
  agencyNameCol,
  agentEmailCol,
  agentPhoneCol,
  annualPremiumCol,
  createdCol,
  currencyCol,
  deductibleCol,
  idCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  namedInsuredDisplayNameCol,
  namedInsuredEmailCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  namedInsuredPhoneCol,
  nestedAgencyOrgIdCol,
  nestedAgentNameCol,
  nestedAgentUserIdCol,
  ratingDataBasementCol,
  ratingDataCBRSCol,
  ratingDataDistToCoastFeetCol,
  ratingDataFloodZoneCol,
  ratingDataNumStoriesCol,
  ratingDataPriorLossCountCol,
  ratingDataPropertyCodeCol,
  ratingDataReplacementCostCol,
  ratingDataSqFootageCol,
  ratingDataYearBuiltCol,
  tivCol,
  updatedCol,
  userIdCol,
} from './gridColumns';

export const quoteCols: GridColDef<Quote>[] = [
  addressSummaryCol,
  addrLine1Col,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  addrCountyCol,
  addrFIPSCol,
  annualPremiumCol,
  {
    ...currencyCol,
    field: 'quoteTotal',
    headerName: 'Quote Total',
    description: 'premium + taxes + fees',
  },
  namedInsuredDisplayNameCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  namedInsuredEmailCol,
  namedInsuredPhoneCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  deductibleCol,
  ratingDataReplacementCostCol,
  ratingDataPropertyCodeCol,
  ratingDataYearBuiltCol,
  ratingDataSqFootageCol,
  ratingDataNumStoriesCol,
  ratingDataBasementCol,
  ratingDataDistToCoastFeetCol,
  ratingDataCBRSCol,
  ratingDataFloodZoneCol,
  ratingDataPriorLossCountCol,
  nestedAgentNameCol,
  agentEmailCol,
  agentPhoneCol,
  agencyNameCol,
  agencyAddressCol,
  createdCol,
  updatedCol,
  nestedAgencyOrgIdCol,
  nestedAgentUserIdCol,
  { ...userIdCol, description: 'userId of record owner (named insured in most cases)' },
  {
    ...idCol,
    headerName: 'Quote ID',
  },
  // TODO: use regular ID column ??
  {
    field: 'submissionId',
    headerName: 'Submission ID',
    description: 'Submission from which the quote was created',
    minWidth: 240,
    flex: 1,
    renderCell: (params) => {
      if (!params.value) return null;
      return (
        <Link
          component={RouterLink}
          to={createPath({
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            params: { submissionId: params.value },
          })}
        >
          <GridCellCopy value={params.value} />
        </Link>
      );
    },
  },
];

export const QUOTE_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
  annualPremium: false,
  'namedInsured.firstName': false,
  'namedInsured.lastName': false,
  'namedInsured.email': false,
  'namedInsured.phone': false,
  'address.addressLine1': false,
  'address.addressLine2': false,
  'address.city': false,
  'address.state': false,
  'address.postal': false,
  'address.countyName': false,
  'address.countyFIPS': false,
  'metadata.updated': false,
  'agent.phone': false,
  'agent.userId': false,
  'ratingPropertyData.replacementCost': false,
  'ratingPropertyData.CBRSDesignation': false,
  'ratingPropertyData.basement': false,
  'ratingPropertyData.distToCoastFeet': false,
  'ratingPropertyData.floodZone': false,
  'ratingPropertyData.numStories': false,
  'ratingPropertyData.propertyCode': false,
  'ratingPropertyData.sqFootage': false,
  'ratingPropertyData.yearBuilt': false,
  'agency.address': false,
};
