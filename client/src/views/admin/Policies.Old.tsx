import React, { useCallback, useMemo } from 'react';
import { limit, orderBy } from 'firebase/firestore';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { DataObjectRounded } from '@mui/icons-material';

import { BasicDataGrid } from 'components';
import { renderChips } from 'components/RenderGridCellHelpers';
import {
  ratingDataCBRSCol,
  POLICY_STATUS,
  addrCityCol,
  addrLine1Col,
  addrLine2Col,
  addrPostalCol,
  addrStateCol,
  nestedAgencyOrgIdCol,
  nestedAgentUserIdCol,
  nestedAgentNameCol,
  ratingDataBasementCol,
  createdCol,
  currencyCol,
  deductibleCol,
  ratingDataDistToCoastFeetCol,
  effectiveDateCol,
  emailCol,
  expirationDateCol,
  ratingDataFloodZoneCol,
  idCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  namedInsuredDisplayNameCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  ratingDataNumStoriesCol,
  orgNameCol,
  phoneCol,
  ratingDataPropertyCodeCol,
  ratingDataSqFootageCol,
  statusCol,
  updatedCol,
  userIdCol,
  ratingDataYearBuiltCol,
} from 'common';
import { useCollectionData, useJsonDialog } from 'hooks';

// REPLACED WITH POLICIES COMPONENT
// route changed from /admin/policies to /policies
// component handles different queries dependent on claims

// loader - use search or params to optionally prefilter by product ?
// TODO: can use useEffect + subscription to automatically update query when filter changes (like react query)

export const Policies: React.FC = () => {
  const { data, status } = useCollectionData('POLICIES', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);
  const dialog = useJsonDialog();

  const showJson = useCallback(
    (params: GridRowParams) => () => {
      let d = data.find((q) => q.id === params.id);
      if (!d) return;
      dialog(d, `Quote Data ${params.id}`);
    },
    [data, dialog]
  );

  const policyColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='View Raw JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={showJson(params)}
            label='Details'
          />,
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip placement='top' title='Edit'>
          //       <EditRounded />
          //     </Tooltip>
          //   }
          //   onClick={editQuote(params)}
          //   label='Send Notifications'
          // />,
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip placement='top' title='Send Notifications'>
          //       <SendRounded />
          //     </Tooltip>
          //   }
          //   onClick={handleSendNotifications(params)}
          //   label='Send Notifications'
          // />,
        ],
      },
      {
        ...statusCol,
        type: 'singleSelect',
        valueOptions: [
          POLICY_STATUS.PAID,
          POLICY_STATUS.AWAITING_PAYMENT,
          POLICY_STATUS.PAYMENT_PROCESSING,
          POLICY_STATUS.CANCELLED,
        ],
        editable: true,
      },
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      {
        ...currencyCol,
        field: 'price',
        headerName: 'Price',
      },
      namedInsuredDisplayNameCol,
      namedInsuredFirstNameCol,
      namedInsuredLastNameCol,
      {
        ...emailCol,
        field: 'insuredEmail',
        headerName: 'Insured Email',
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.email,
        // renderCell: renderGridEmail,
      },
      {
        ...phoneCol,
        field: 'insuredPhone',
        headerName: 'Insured Phone',
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.phone,
        // renderCell: renderGridPhone,
      },
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      deductibleCol,
      effectiveDateCol,
      expirationDateCol,
      nestedAgentNameCol,
      {
        ...emailCol,
        field: 'agentEmail',
        headerName: 'Agent Email',
        valueGetter: (params: GridValueGetterParams<any, any>) => params.row.agent?.email || null,
        // renderCell: renderGridEmail,
      },
      {
        ...phoneCol,
        field: 'agentPhone',
        headerName: 'Agent Phone',
        // minWidth: 140,
        // flex: 0.8,
        // editable: false,
        valueGetter: (params: GridValueGetterParams<any, any>) => params.row.agent?.phone || null,
        // renderCell: renderGridPhone,
      },
      {
        ...orgNameCol,
        field: 'agencyName',
        headerName: 'Agency',
      },
      {
        ...currencyCol,
        field: 'replacementCost',
        headerName: 'Replacement Cost',
        // minWidth: 140,
        // flex: 0.8,
        // headerAlign: 'center',
        // align: 'right',
        valueGetter: (params: GridValueGetterParams<any, any>) =>
          params.row.ratingPropertyData?.replacementCost ?? null,
        // valueFormatter: formatGridCurrency,
      },
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

      {
        field: 'transactions',
        headerName: 'Transactions',
        minWidth: 140,
        flex: 1,
        // valueGetter: (params: GridValueGetterParams) => params.row.agent.userId || null,
        renderCell: (params) =>
          renderChips(params, {}, (t: string) => ({
            onClick: () =>
              window.open(
                `${process.env.REACT_APP_EPAY_HOSTING_BASE_URL}/Transactions/Index/${t}`,
                '_blank'
              ),
          })),
      },
      nestedAgentUserIdCol,
      nestedAgencyOrgIdCol,
      userIdCol,
      {
        ...idCol,
        field: 'id',
        headerName: 'Policy ID',
        minWidth: 240,
      },
    ],
    [showJson]
  );

  return (
    <Box>
      <Typography variant='h5' gutterBottom>
        Policies
      </Typography>

      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={policyColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          // onRowDoubleClick={(params) => {
          //   navigate(
          //     createPath({
          //       path: ADMIN_ROUTES.SUBMISSION_VIEW,
          //       params: { submissionId: params.id.toString() },
          //     })
          //   );
          // }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                insuredFirstName: false,
                insuredLastName: false,
                addressLine2: false,
                postal: false,
                updated: false,
                agentId: false,
                agencyId: false,
                replacementCost: false,
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
            pagination: { pageSize: 10 },
          }}
        />
      </Box>
    </Box>
  );
};
