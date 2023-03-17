import React, { useCallback, useMemo } from 'react';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Box, Chip, ChipProps, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  CachedRounded,
  CloseRounded,
  CreditScoreRounded,
  DataObjectRounded,
  HourglassTopRounded,
} from '@mui/icons-material';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';

import { BasicDataGrid, GridCellCopy, renderGridEmail, renderGridPhone } from 'components';
import { renderChips } from 'components/RenderGridCellHelpers';
import { WithId, Policy, policiesCollection, withIdConverter, POLICY_STATUS } from 'common';
import {
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
} from 'modules/utils';
import { useJsonDialog } from 'hooks';

// loader - use search or params to optionally prefilter by product ?
// TODO: can use useEffect + subscription to automatically update query when filter changes (like react query)

const getChipProps = (status: POLICY_STATUS): Partial<ChipProps> => {
  switch (status) {
    case POLICY_STATUS.PAID:
      return { icon: <CreditScoreRounded />, color: 'success' };
    case POLICY_STATUS.PAYMENT_PROCESSING:
      return { icon: <CachedRounded />, color: 'info' };
    case POLICY_STATUS.AWAITING_PAYMENT:
      return { icon: <HourglassTopRounded />, color: 'warning' };
    case POLICY_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    default:
      return { color: 'default' };
  }
};

export const policiesLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    console.log('FETCHING POLICIES');
    return getDocs(
      query(policiesCollection, orderBy('metadata.created', 'desc'), limit(100)).withConverter(
        withIdConverter<Policy>()
      )
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data() })));
  } catch (err) {
    console.log('ERROR: ', err);
    throw new Response(`Error fetching policies. See console for details`);
  }
};

export const Policies: React.FC = () => {
  const data = useLoaderData() as WithId<Policy>[];
  console.log('POLICIES: ', data);
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
        field: 'status',
        headerName: 'Status',
        type: 'singleSelect',
        valueOptions: [
          POLICY_STATUS.PAID,
          POLICY_STATUS.AWAITING_PAYMENT,
          POLICY_STATUS.PAYMENT_PROCESSING,
          POLICY_STATUS.CANCELLED,
        ],
        minWidth: 180,
        flex: 0.8,
        editable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value}
            size='small'
            variant='outlined'
            {...getChipProps(params.value)}
          />
        ),
        // preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        //   const hasError = params.props.value.length < 3;
        //   return { ...params.props, error: hasError };
        // },
      },
      {
        field: 'addressLine1',
        headerName: 'Address',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.address.addressLine1,
      },
      {
        field: 'addressLine2',
        headerName: 'Unit/Suite',
        minWidth: 80,
        flex: 0.4,
        editable: false,
        valueGetter: (params) => params.row.address.addressLine2,
      },
      {
        field: 'city',
        headerName: 'City',
        minWidth: 150,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.address.city,
      },
      {
        field: 'state',
        headerName: 'State',
        minWidth: 72,
        flex: 0.1,
        editable: false,
        valueGetter: (params) => params.row.address.state,
      },
      {
        field: 'postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.address.postal,
      },
      {
        field: 'price',
        headerName: 'Price',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: (params) => formatGridCurrency(params, '$0,0.00'),
        renderCell: (params) => (
          <Typography variant='body2' fontWeight='medium'>
            {params.formattedValue}
          </Typography>
        ),
      },
      {
        field: 'insuredName',
        headerName: 'Insured Name',
        minWidth: 160,
        flex: 0.8,
        editable: false,
        valueGetter: (params: GridValueGetterParams) =>
          `${params.row.namedInsured.firstName || ''} ${
            params.row.namedInsured.lastName || ''
          }`.trim(),
      },
      {
        field: 'insuredLastName',
        headerName: 'Last Name',
        minWidth: 140,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured.lastName,
      },
      {
        field: 'insuredFirstName',
        headerName: 'First Name',
        minWidth: 140,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured.firstName,
      },
      {
        field: 'insuredEmail',
        headerName: 'Insured Email',
        minWidth: 220,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured.email,
        renderCell: renderGridEmail,
      },
      {
        field: 'insuredPhone',
        headerName: 'Insured Phone',
        minWidth: 140,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.namedInsured.phone,
        renderCell: renderGridPhone,
      },
      {
        field: 'limitA',
        headerName: 'Limit A',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitA,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitB',
        headerName: 'Limit B',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitB,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitC',
        headerName: 'Limit C',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitC,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitD',
        headerName: 'Limit D',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitD,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'deductible',
        headerName: 'Deductible',
        minWidth: 100,
        flex: 0.5,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'effectiveDate',
        headerName: 'Eff. Date',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },
      {
        field: 'expirationDate',
        headerName: 'Exp. Date',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },
      {
        field: 'agentName',
        headerName: 'Agent Name',
        minWidth: 180,
        flex: 0.8,
        editable: false,
        valueGetter: (params) => params.row.agent.name || null,
      },
      {
        field: 'agentEmail',
        headerName: 'Agent Email',
        minWidth: 220,
        flex: 0.8,
        editable: false,
        valueGetter: (params) => params.row.agent.email || null,
        renderCell: renderGridEmail,
      },
      {
        field: 'agentPhone',
        headerName: 'Agent Phone',
        minWidth: 140,
        flex: 0.8,
        editable: false,
        valueGetter: (params) => params.row.agent.phone || null,
        renderCell: renderGridPhone,
      },
      {
        field: 'agencyName',
        headerName: 'Agency',
        minWidth: 180,
        flex: 0.8,
        editable: false,
      },
      {
        field: 'replacementCost',
        headerName: 'Replacement Cost',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.replacementCost ?? null,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'propertyCode',
        headerName: 'Property Code',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.propertyCode ?? null,
      },
      {
        field: 'yearBuilt',
        headerName: 'Year Built',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.yearBuilt ?? null,
      },
      {
        field: 'sqFootage',
        headerName: 'Sq. Footage',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.sqFootage ?? null,
      },
      {
        field: 'numStories',
        headerName: 'Num. Stories',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.numStories ?? null,
      },
      {
        field: 'basement',
        headerName: 'Basement',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.basement ?? null,
      },
      {
        field: 'distToCoastFeet',
        headerName: 'Dist. to Coast (ft.)',
        minWidth: 160,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.distToCoastFeet ?? null,
      },
      {
        field: 'CBRSDesignation',
        headerName: 'CBRS Des.',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.CBRSDesignation ?? null,
      },
      {
        field: 'floodZone',
        headerName: 'Flood Zone',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.ratingPropertyData?.floodZone ?? null,
      },
      {
        field: 'created',
        headerName: 'Created',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
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
      {
        field: 'agentId',
        headerName: 'Agent ID',
        minWidth: 260,
        flex: 1,
        valueGetter: (params: GridValueGetterParams) => params.row.agent.userId || null,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'agencyId',
        headerName: 'Agency ID',
        minWidth: 260,
        flex: 1,
        valueGetter: (params: GridValueGetterParams) => params.row.agency.orgId || null,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'userId',
        headerName: 'User ID',
        minWidth: 260,
        flex: 1,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'id',
        headerName: 'Policy ID',
        minWidth: 240,
        flex: 1,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
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
