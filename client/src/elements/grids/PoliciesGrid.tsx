import { DescriptionRounded, PaymentsRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
} from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { Claim, PaymentStatus, type Policy } from '@idemand/common';
import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { useGeneratePDF, useGridShowJson } from 'hooks';
import type { PolicyWithStatus } from 'modules/db';
import {
  POLICY_COLUMN_VISIBILITY,
  policyCols,
  statusCol,
} from 'modules/muiGrid/gridColumnDefs';
import { defaultPolicyIdCol } from 'modules/muiGrid/gridColumnDefs/policyCols';
import { createPath, ROUTES } from 'router';

export type PoliciesGridProps = ServerDataGridCollectionProps<
  PolicyWithStatus,
  Policy
> & {
  idCol?: GridColDef<Policy>;
};

export const PoliciesGrid = ({
  renderActions = () => [],
  additionalColumns,
  idCol = defaultPolicyIdCol,
  ...props
}: PoliciesGridProps) => {
  const navigate = useNavigate();
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.iDemandAdmin]: true },
  });

  const renderShowJson = useGridShowJson(
    'policies',
    { showInMenu: true },
    { requiredClaims: { [Claim.enum.iDemandAdmin]: true } },
    null,
    null,
    // handle policy version collection
    (params) =>
      props?.pathSegments?.length
        ? `/${props.pathSegments.join('/')}/${params.id.toString()}`
        : params.id.toString(),
  );

  const { downloadPDF: downloadPolicy, loading } =
    useGeneratePDF('generateDecPDF');
  const viewPolicyDoc = useCallback(
    (params: GridRowParams) => () => {
      downloadPolicy(params.id.toString());
    },
    [downloadPolicy],
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
            disabled={loading}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='invoices'>
                <PaymentsRounded />
              </Tooltip>
            }
            onClick={() =>
              navigate(
                createPath({
                  path: ROUTES.POLICY_RECEIVABLES,
                  params: { policyId: params.id.toString() },
                }),
              )
            }
            label='View Payments/Invoices'
            disabled={loading}
          />,
          ...renderShowJson(params),
        ],
      },
      idCol,
      // {
      //   ...statusCol, // TODO: calc status with converter ??
      //   valueOptions: ['active', 'inactive'], // TODO: other types ??
      //   // valueOptions: [
      //   //   POLICY_STATUS.PAID,
      //   //   POLICY_STATUS.AWAITING_PAYMENT,
      //   //   POLICY_STATUS.PAYMENT_PROCESSING,
      //   //   POLICY_STATUS.CANCELLED,
      //   // ],
      //   editable: false, // iDAdminResult.hasRequiredClaims,
      //   filterable: false,
      //   sortable: false,
      //   valueGetter: (params) => calcPolicyStatus(params.row),
      // },
      {
        ...statusCol,
        field: 'paymentStatus',
        headerName: 'Payment Status',
        valueOptions: PaymentStatus.options,
        editable: iDAdminResult.hasRequiredClaims,
        filterable: true,
        sortable: true,
        valueGetter: (params) => params.row.paymentStatus || null,
      },
      ...policyCols,
      ...(additionalColumns || []),
    ],
    [
      viewPolicyDoc,
      renderActions,
      renderShowJson,
      additionalColumns,
      iDAdminResult,
    ],
  );

  return (
    <Box>
      <ServerDataGrid
        colName='policies'
        columns={policyColumns}
        // converter={policyConverter}
        density='compact'
        autoHeight
        onRowDoubleClick={(params) =>
          navigate(
            createPath({
              path: ROUTES.POLICY,
              params: { policyId: params.id.toString() },
            }),
          )
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
