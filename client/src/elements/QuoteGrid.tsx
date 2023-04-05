import React, { useCallback, useMemo } from 'react';
import { Box, Chip, ChipProps, Link, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  DataGridProps,
  GridActionsCellItem,
  GridActionsCellItemProps,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  CloseRounded,
  DataObjectRounded,
  DoneRounded,
  HourglassBottomRounded,
  HourglassEmptyRounded,
} from '@mui/icons-material';

import { ADMIN_ROUTES, createPath } from 'router';
import { QUOTE_STATUS, SubmissionQuoteData, WithId } from 'common';
import { BasicDataGrid, renderGridEmail, renderGridPhone, GridCellCopy } from 'components';
import {
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  formatGridPercent,
} from 'modules/utils/helpers';
import { useJsonDialog } from 'hooks';

const getChipProps = (status: QUOTE_STATUS): Partial<ChipProps> => {
  switch (status) {
    case QUOTE_STATUS.AWAITING_USER:
      return { icon: <HourglassEmptyRounded />, color: 'primary' };
    case QUOTE_STATUS.BOUND:
      return { icon: <DoneRounded />, color: 'success' };
    case QUOTE_STATUS.EXPIRED:
      return { icon: <HourglassBottomRounded />, color: 'warning' };
    case QUOTE_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    default:
      return { color: 'default' };
  }
};

export interface QuoteGridProps extends Partial<DataGridProps> {
  rows: WithId<SubmissionQuoteData>[];
  actions?: React.ReactElement<GridActionsCellItemProps>[];
  columnOverrides?: GridColDef<any, any, any>[];
}

export const QuoteGrid: React.FC<QuoteGridProps> = ({
  rows = [],
  actions = [],
  columnOverrides = [],
  ...props
}) => {
  const navigate = useNavigate();
  // const { data, status } = useCollectionData('SUBMISSIONS_QUOTES', [
  //   orderBy('metadata.created', 'desc'),
  //   limit(100),
  // ]); // TODO: add constraints for filtering / sorting
  const dialog = useJsonDialog();
  // const sendNotifications = useSendQuoteNotification();

  const showJson = useCallback(
    (params: GridRowParams) => () => {
      let d = rows.find((q) => q.id === params.id);
      if (!d) return;
      dialog(d, `Quote Data ${params.id}`);
    },
    [rows, dialog]
  );

  // const handleSendNotifications = useCallback(
  //   (params: GridRowParams) => () => {
  //     sendNotifications(params.id as string);
  //   },
  //   [sendNotifications]
  // );

  const quoteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          ...actions,
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
        field: 'addressLine1',
        headerName: 'Address',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.addressLine1,
      },
      {
        field: 'addressLine2',
        headerName: 'Unit/Suite',
        minWidth: 80,
        flex: 0.4,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.addressLine2,
      },
      {
        field: 'city',
        headerName: 'City',
        minWidth: 150,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.city,
      },
      {
        field: 'state',
        headerName: 'State',
        minWidth: 72,
        flex: 0.1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.state,
      },
      {
        field: 'postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.postal,
      },
      {
        field: 'quoteTotal',
        headerName: 'Quote Total',
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
        field: 'status',
        headerName: 'Status',
        // type: 'singleSelect',
        // valueOptions: [
        //   QUOTE_STATUS.BOUND,
        //   QUOTE_STATUS.CANCELLED,
        //   QUOTE_STATUS.EXPIRED,
        //   QUOTE_STATUS.AWAITING_USER,
        // ],
        minWidth: 180,
        flex: 0.8,
        // editable: true,
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
        field: 'insuredName',
        headerName: 'Insured Name',
        minWidth: 160,
        flex: 0.8,
        editable: false,
        valueGetter: (params: GridValueGetterParams) =>
          `${params.row.insuredFirstName || ''} ${params.row.insuredLastName || ''}`.trim(),
      },
      {
        field: 'insuredLastName',
        headerName: 'Last Name',
        minWidth: 140,
        flex: 1,
        editable: false,
      },
      {
        field: 'insuredFirstName',
        headerName: 'First Name',
        minWidth: 140,
        flex: 1,
        editable: false,
      },
      {
        field: 'insuredEmail',
        headerName: 'Insured Email',
        minWidth: 220,
        flex: 1,
        editable: false,
        renderCell: renderGridEmail,
      },
      {
        field: 'insuredPhone',
        headerName: 'Insured Phone',
        minWidth: 140,
        flex: 1,
        editable: false,
        renderCell: renderGridPhone,
      },
      {
        field: 'termPremium',
        headerName: 'Term Premium',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
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
        field: 'subproducerCommission',
        headerName: 'Commission',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: (params) => formatGridPercent(params, 0),
      },
      {
        field: 'agentName',
        headerName: 'Agent Name',
        minWidth: 180,
        flex: 0.8,
        editable: false,
      },
      {
        field: 'agentEmail',
        headerName: 'Agent Email',
        minWidth: 220,
        flex: 0.8,
        editable: false,
        renderCell: renderGridEmail,
      },
      {
        field: 'agentPhone',
        headerName: 'Agent Email',
        minWidth: 140,
        flex: 0.8,
        editable: false,
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
        field: 'agentId',
        headerName: 'Agent ID',
        minWidth: 260,
        flex: 1,
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
        headerName: 'Quote ID',
        minWidth: 240,
        flex: 1,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
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
    [showJson, actions, columnOverrides]
  );

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <BasicDataGrid
        rows={rows || []}
        columns={quoteColumns}
        density='compact'
        autoHeight
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
