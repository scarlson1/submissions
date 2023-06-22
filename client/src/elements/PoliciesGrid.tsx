import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { DataObjectRounded, DescriptionRounded } from '@mui/icons-material';
import { GridActionsCellItem, GridColDef, GridRowParams, GridToolbar } from '@mui/x-data-grid';
import { useSigninCheck } from 'reactfire';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useShowJson } from 'hooks';
import {
  Policy,
  POLICY_STATUS,
  nestedAgencyOrgIdCol,
  nestedAgentUserIdCol,
  nestedAgentNameCol,
  createdCol,
  currencyCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  namedInsuredDisplayNameCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  statusCol,
  updatedCol,
  userIdCol,
  agentEmailCol,
  agentPhoneCol,
  namedInsuredEmailCol,
  namedInsuredPhoneCol,
  agencyNameCol,
  locationsCount,
  locationAddresses,
  homeStateCol,
  productCol,
  agencyAddressCol,
  issuingCarrierCol,
  SLProducerOfRecordNameCol,
  SLProducerOfRecordLicenseNum,
  SLProducerOfRecordLicensePhone,
  SLProducerOfRecordLicenseState,
  SLProducerOfRecordLicenseAddress,
  COLLECTIONS,
} from 'common';
import { CUSTOM_CLAIMS } from 'modules/components';
import { ROUTES, createPath } from 'router';

export interface PoliciesGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  columnOverrides?: GridColDef<any, any, any>[];
}

export const PoliciesGrid: React.FC<PoliciesGridProps> = ({
  renderActions = () => [],
  ...props
}) => {
  const navigate = useNavigate();
  const showJson = useShowJson(COLLECTIONS.POLICIES);

  const { status: claimsCheckStatus, data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => {
      showJson(params.id.toString());
    },
    [showJson]
  );

  const viewPolicyDoc = useCallback(
    (params: GridRowParams) => () => {
      const docObj = params.row.documents?.[0];
      if (!docObj || !docObj.downloadUrl) toast.error('no document found');

      window.open(docObj.downloadUrl, '_blank');
    },
    []
  );

  const policyColumns: GridColDef<Policy>[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='view raw JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
            label='Details'
            disabled={!iDAdminResult.hasRequiredClaims}
          />,
          // TODO: add view policy doc action
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='view policy'>
                <DescriptionRounded />
              </Tooltip>
            }
            onClick={viewPolicyDoc(params)}
            label='View Policy'
            disabled={!(params.row.documents && params.row.documents[0]?.downloadUrl)}
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
        editable: claimsCheckStatus === 'success' && iDAdminResult.hasRequiredClaims,
      },
      productCol,
      locationAddresses,
      namedInsuredDisplayNameCol,
      namedInsuredFirstNameCol,
      namedInsuredLastNameCol,
      namedInsuredEmailCol,
      namedInsuredPhoneCol,
      {
        ...currencyCol,
        field: 'price',
        headerName: 'Price',
      },
      locationsCount,
      effectiveDateCol,
      expirationDateCol,
      homeStateCol,
      nestedAgentNameCol,
      agentEmailCol,
      agentPhoneCol,
      agencyNameCol,
      agencyAddressCol,
      issuingCarrierCol,
      nestedAgentUserIdCol,
      nestedAgencyOrgIdCol,
      userIdCol,
      {
        ...idCol,
        headerName: 'Policy ID',
      },
      SLProducerOfRecordNameCol,
      SLProducerOfRecordLicenseNum,
      SLProducerOfRecordLicenseState,
      SLProducerOfRecordLicensePhone,
      SLProducerOfRecordLicenseAddress,
      createdCol,
      updatedCol,
    ],
    [handleShowJson, viewPolicyDoc, renderActions, claimsCheckStatus, iDAdminResult]
  );

  return (
    <Box>
      <ServerDataGrid
        collName='SUBMISSIONS'
        columns={policyColumns}
        density='compact'
        autoHeight
        onRowDoubleClick={(params) =>
          navigate(createPath({ path: ROUTES.POLICY, params: { policyId: params.id.toString() } }))
        }
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: { csvOptions: { allColumns: true } },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              product: false,
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
              'agent.email': false,
              'agent.phone': false,
              'agent.userId': false,
              'agency.address': false,
              annualPremium: false,
              agentId: false,
              'SLProducerOfRecord.licenseState': false,
              'SLProducerOfRecord.phone': false,
              'SLProducerOfRecord.address': false,
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
