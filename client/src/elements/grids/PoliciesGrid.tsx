import { DescriptionRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams, GridToolbar } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { CUSTOM_CLAIMS, Policy, POLICY_STATUS, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { policyCols, statusCol } from 'modules/muiGrid/gridColumnDefs';
import { createPath, ROUTES } from 'router';

export type PoliciesGridProps = ServerDataGridCollectionProps;

export const PoliciesGrid = ({ renderActions = () => [], ...props }: PoliciesGridProps) => {
  const navigate = useNavigate();

  const { status: claimsCheckStatus, data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });

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
        filterable: true,
      },
      ...policyCols,
    ],
    [viewPolicyDoc, renderActions, claimsCheckStatus, iDAdminResult]
  );

  return (
    <Box>
      <ServerDataGrid
        colName='POLICIES'
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
          toolbar: { csvOptions: { allColumns: false } },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              product: false,
              'namedInsured.firstName': false,
              'namedInsured.lastName': false,
              'namedInsured.email': false,
              'namedInsured.phone': false,
              'mailingAddress.addressLine1': false,
              'mailingAddress.addressLine2': false,
              'mailingAddress.city': false,
              'mailingAddress.state': false,
              'mailingAddress.postal': false,
              'mailingAddress.countyName': false,
              'mailingAddress.countyFIPS': false,
              'agent.email': false,
              'agent.phone': false,
              'agent.userId': false,
              'agency.address': false,
              annualPremium: false,
              'SLProducerOfRecord.licenseState': false,
              'SLProducerOfRecord.phone': false,
              'SLProducerOfRecord.address': false,
              'metadata.created': false,
              'metadata.updated': false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
