import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { DataObjectRounded, DescriptionRounded } from '@mui/icons-material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import { QueryConstraint } from 'firebase/firestore';
import { useSigninCheck } from 'reactfire';
import { useNavigate } from 'react-router-dom';

import { BasicDataGrid } from 'components';
import { useCollectionData, useJsonDialog } from 'hooks';
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
} from 'common';
import { CUSTOM_CLAIMS } from 'modules/components';
import { toast } from 'react-hot-toast';

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
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='view raw JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={showJson(params)}
            label='Details'
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
    [showJson, viewPolicyDoc, claimsCheckStatus, iDAdminResult]
  );

  return (
    <Box>
      <BasicDataGrid
        rows={data}
        columns={policyColumns}
        loading={status === 'loading'}
        density='compact'
        autoHeight
        // TODO: relative navigation ?? issues when shown in org view
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
          // pagination: { pageSize: 10 },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
