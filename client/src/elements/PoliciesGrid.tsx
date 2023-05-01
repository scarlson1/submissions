import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { DataObjectRounded } from '@mui/icons-material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { QueryConstraint } from 'firebase/firestore';

import { BasicDataGrid } from 'components';
import { useCollectionData, useJsonDialog } from 'hooks';
import {
  Policy,
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
import { renderChips } from 'components/RenderGridCellHelpers';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';
import { CUSTOM_CLAIMS } from 'modules/components';

export interface PoliciesGridProps extends Partial<DataGridProps> {
  queryConstraints: QueryConstraint[];
}

export const PoliciesGrid: React.FC<PoliciesGridProps> = ({ queryConstraints, ...props }) => {
  const navigate = useNavigate();
  const dialog = useJsonDialog();

  const { status: claimsCheckStatus, data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });

  const { data, status } = useCollectionData<Policy>('POLICIES', queryConstraints, {
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
        editable: claimsCheckStatus === 'success' && iDAdminResult.hasRequiredClaims, // true,
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
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.email || null,
        // renderCell: renderGridEmail,
      },
      {
        ...phoneCol,
        field: 'insuredPhone',
        headerName: 'Insured Phone',
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.phone || null,
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
    [showJson, claimsCheckStatus, iDAdminResult]
  );

  return (
    <Box>
      <BasicDataGrid
        // @ts-ignore
        rows={data}
        columns={policyColumns}
        loading={status === 'loading'}
        density='compact'
        autoHeight
        // TODO: relative navigation ?? issues when shown in org view
        onRowDoubleClick={(params) => navigate(params.id.toString())}
        components={{ Toolbar: GridToolbar }}
        componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
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
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { pageSize: 10 },
        }}
        {...props}
      />
    </Box>
  );
};
