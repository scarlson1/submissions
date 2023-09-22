import { DescriptionRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { CLAIMS, COLLECTIONS, Policy, POLICY_STATUS, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useGridShowJson } from 'hooks';
import { POLICY_COLUMN_VISIBILITY, policyCols, statusCol } from 'modules/muiGrid/gridColumnDefs';
import { createPath, ROUTES } from 'router';

export type PoliciesGridProps = ServerDataGridCollectionProps;

export const PoliciesGrid = ({ renderActions = () => [], ...props }: PoliciesGridProps) => {
  const navigate = useNavigate();
  const { status: claimsCheckStatus, data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });
  const renderShowJson = useGridShowJson(
    COLLECTIONS.POLICIES,
    { showInMenu: true },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }
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
              <Tooltip placement='top' title='view policy'>
                <DescriptionRounded />
              </Tooltip>
            }
            onClick={viewPolicyDoc(params)}
            label='View Policy'
            disabled={!(params.row.documents && params.row.documents[0]?.downloadUrl)}
          />,
          ...renderShowJson(params),
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
    [viewPolicyDoc, renderActions, renderShowJson, claimsCheckStatus, iDAdminResult]
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
        slotProps={{
          toolbar: { csvOptions: { allColumns: false } },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: POLICY_COLUMN_VISIBILITY,
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
