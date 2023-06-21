import React, { useCallback, useMemo } from 'react';
import { Box, Link, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  DataGridProps,
  GridActionsCellItem,
  GridActionsColDef,
  GridColDef,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import { DataObjectRounded, SendRounded } from '@mui/icons-material';
import { QueryConstraint } from 'firebase/firestore';
import { useSigninCheck } from 'reactfire';

import { ADMIN_ROUTES, createPath } from 'router';
import {
  Quote,
  nestedAgentUserIdCol,
  agentNameCol,
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
  subproducerCommissionCol,
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
} from 'common';
import { BasicDataGrid, GridCellCopy } from 'components';
import { useCollectionData, useJsonDialog, useSendQuoteNotification, useWidth } from 'hooks';
import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';

export interface QuotesGridProps extends Partial<DataGridProps> {
  // rows: WithId<Quote>[];
  queryConstraints?: QueryConstraint[];
  // actions?: React.ReactElement<GridActionsCellItemProps>[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
  columnOverrides?: GridColDef<any, any, any>[] | GridActionsColDef[];
}

export const QuotesGrid: React.FC<QuotesGridProps> = ({
  // rows = [],
  queryConstraints = [],
  // actions = [],
  renderActions = () => [],
  columnOverrides = [],
  ...props
}) => {
  const navigate = useNavigate();
  const dialog = useJsonDialog();
  const { isSmall } = useWidth();
  const sendNotifications = useSendQuoteNotification();
  const { data: authCheckResult } = useSigninCheck({
    validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'IDEMAND_ADMIN']),
  });

  const { data, status } = useCollectionData<Quote>('QUOTES', queryConstraints, {
    suspense: false,
    initialData: [],
  });

  const showJson = useCallback(
    (params: GridRowParams) => () => {
      let d = data.find((q) => q.id === params.id);
      if (!d) return;
      dialog(d, `Quote Data ${params.id}`);
    },
    [data, dialog]
  );

  const handleSendNotifications = useCallback(
    (params: GridRowParams) => () => {
      sendNotifications(params.id as string);
    },
    [sendNotifications]
  );

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
            onClick={showJson(params)}
            label='Details'
            showInMenu={isSmall}
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
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      {
        ...currencyCol,
        field: 'quoteTotal',
        headerName: 'Quote Total',
      },
      statusCol,
      namedInsuredDisplayNameCol,
      namedInsuredFirstNameCol,
      namedInsuredLastNameCol,
      namedInsuredEmailCol,
      namedInsuredPhoneCol,
      {
        ...currencyCol,
        field: 'termPremium',
        headerName: 'Term Premium',
      },
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
      subproducerCommissionCol,
      agentNameCol,
      agentEmailCol,
      agentPhoneCol,
      agencyNameCol,
      agencyAddressCol,
      createdCol,
      updatedCol,
      nestedAgencyOrgIdCol,
      nestedAgentUserIdCol,
      userIdCol,
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
    [showJson, handleSendNotifications, columnOverrides, renderActions, isSmall, authCheckResult]
  );

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <BasicDataGrid
        // @ts-ignore
        rows={data}
        columns={quoteColumns}
        loading={status === 'loading'}
        density='compact'
        autoHeight
        onRowDoubleClick={(params) => navigate(params.id.toString())}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: { csvOptions: { allColumns: true } },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              insuredFirstName: false,
              insuredLastName: false,
              addressLine2: false,
              postal: false,
              termPremium: false,
              updated: false,
              agentId: false,
              CBRSDesignation: false,
              basement: false,
              distToCoastFeet: false,
              floodZone: false,
              numStories: false,
              propertyCode: false,
              sqFootage: false,
              yearBuilt: false,
              submissionId: false,
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
