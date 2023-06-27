import React, { useCallback, useMemo } from 'react';
import { Box, Link, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { DataObjectRounded, SendRounded } from '@mui/icons-material';
import { useSigninCheck } from 'reactfire';

import { ADMIN_ROUTES, createPath } from 'router';
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
  statusCol,
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
  QUOTE_STATUS,
  addressSummaryCol,
  addrCountyCol,
  addrFIPSCol,
  annualPremiumCol,
  nestedAgentNameCol,
  COLLECTIONS,
} from 'common';
import { GridCellCopy, ServerDataGrid, ServerDataGridProps } from 'components';
import { useSendQuoteNotification, useShowJson, useWidth } from 'hooks';
import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { useAuth } from 'modules/components';

// TODO: need to use custom merge function for columnOverrides to prevent duplication "field" values

export interface QuotesGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  columnOverrides?: GridColDef<any, any, any>[]; // | GridActionsColDef[];
}

export const QuotesGrid: React.FC<QuotesGridProps> = ({
  renderActions = () => [],
  columnOverrides = [],
  ...props
}) => {
  const { claims } = useAuth();
  const { isSmall } = useWidth();
  const sendNotifications = useSendQuoteNotification();
  const showJson = useShowJson(COLLECTIONS.QUOTES);

  const { data: authCheckResult } = useSigninCheck({
    validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'IDEMAND_ADMIN']),
  });

  const handleShowJson = useCallback(
    (params: GridRowParams) => async () => {
      showJson(params.id.toString());
    },
    [showJson]
  );

  const handleSendNotifications = useCallback(
    (params: GridRowParams) => () => {
      sendNotifications(params.id as string);
    },
    [sendNotifications]
  );

  // TODO: create getActions() helper func to get actions depending on permissions (instead of disabling)

  const quoteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 120,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='View Raw JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
            label='Details'
            showInMenu={isSmall}
            disabled={!authCheckResult.hasRequiredClaims}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Send Notifications'>
                <SendRounded />
              </Tooltip>
            }
            onClick={handleSendNotifications(params)}
            label='Send Notifications'
            disabled={!authCheckResult.hasRequiredClaims}
            showInMenu={isSmall}
          />,
        ],
      },
      {
        ...statusCol,
        valueOptions: [
          QUOTE_STATUS.BOUND,
          QUOTE_STATUS.CANCELLED,
          QUOTE_STATUS.EXPIRED,
          QUOTE_STATUS.AWAITING_USER,
        ],
        editable: Boolean(claims?.iDemandAdmin),
        filterable: true,
      },
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
      // subproducerCommissionCol,
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
      ...columnOverrides,
    ],
    [
      handleShowJson,
      handleSendNotifications,
      columnOverrides,
      renderActions,
      isSmall,
      authCheckResult,
      claims,
    ]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        collName='QUOTES'
        columns={quoteColumns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
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
              updated: false,
              'agent.phone': false,
              'agent.userId': false,
              CBRSDesignation: false,
              basement: false,
              distToCoastFeet: false,
              floodZone: false,
              numStories: false,
              propertyCode: false,
              sqFootage: false,
              yearBuilt: false,
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
