import { GridColDef } from '@mui/x-data-grid';
import { Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import {
  nestedAgentUserIdCol,
  createdCol,
  currencyCol,
  deductibleCol,
  idCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  ratingDataBasementCol,
  ratingDataCBRSCol,
  ratingDataDistToCoastFeetCol,
  ratingDataFloodZoneCol,
  ratingDataNumStoriesCol,
  ratingDataPropertyCodeCol,
  ratingDataReplacementCostCol,
  ratingDataSqFootageCol,
  ratingDataYearBuiltCol,
  updatedCol,
  userIdCol,
  addrLine1Col,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  namedInsuredEmailCol,
  namedInsuredPhoneCol,
  namedInsuredDisplayNameCol,
  tivCol,
  agentEmailCol,
  agentPhoneCol,
  nestedAgencyOrgIdCol,
  agencyNameCol,
  agencyAddressCol,
  addressSummaryCol,
  addrCountyCol,
  addrFIPSCol,
  annualPremiumCol,
  nestedAgentNameCol,
} from './gridColumns';
import { ADMIN_ROUTES, createPath } from 'router';
import { GridCellCopy } from 'components';

export const quoteCols: GridColDef[] = [
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
