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
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { DataObjectRounded } from '@mui/icons-material';
import { QueryConstraint } from 'firebase/firestore';

import { ADMIN_ROUTES, createPath } from 'router';
import {
  SubmissionQuoteData,
  address1Col,
  address2Col,
  nestedAgentUserIdCol,
  agentNameCol,
  cityCol,
  createdCol,
  currencyCol,
  deductibleCol,
  emailCol,
  firstNameCol,
  idCol,
  lastNameCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  orgNameCol,
  phoneCol,
  postalCol,
  ratingDataBasementCol,
  ratingDataCBRSCol,
  ratingDataDistToCoastFeetCol,
  ratingDataFloodZoneCol,
  ratingDataNumStoriesCol,
  ratingDataPropertyCodeCol,
  ratingDataReplacementCostCol,
  ratingDataSqFootageCol,
  ratingDataYearBuiltCol,
  stateCol,
  statusCol,
  subproducerCommissionCol,
  updatedCol,
  userIdCol,
} from 'common';
import { BasicDataGrid, GridCellCopy } from 'components';
import { useCollectionData, useJsonDialog } from 'hooks';

export interface QuoteGridProps extends Partial<DataGridProps> {
  // rows: WithId<SubmissionQuoteData>[];
  queryConstraints?: QueryConstraint[];
  // actions?: React.ReactElement<GridActionsCellItemProps>[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
  columnOverrides?: GridColDef<any, any, any>[] | GridActionsColDef[];
}

export const QuoteGrid: React.FC<QuoteGridProps> = ({
  // rows = [],
  queryConstraints = [],
  // actions = [],
  renderActions = () => [],
  columnOverrides = [],
  ...props
}) => {
  const navigate = useNavigate();
  const dialog = useJsonDialog();
  // const sendNotifications = useSendQuoteNotification();

  const { data, status } = useCollectionData<SubmissionQuoteData>(
    'SUBMISSIONS_QUOTES',
    queryConstraints,
    { suspense: false, initialData: [] }
  );

  const showJson = useCallback(
    (params: GridRowParams) => () => {
      let d = data.find((q) => q.id === params.id);
      if (!d) return;
      dialog(d, `Quote Data ${params.id}`);
    },
    [data, dialog]
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
          ...renderActions(params),
          // ...actions,
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
        ...address1Col,
        valueGetter: (params) => params.row.insuredAddress.addressLine1,
      },
      {
        ...address2Col,
        valueGetter: (params) => params.row.insuredAddress.addressLine2,
      },
      {
        ...cityCol,
        valueGetter: (params) => params.row.insuredAddress.city,
      },
      {
        ...stateCol,
        valueGetter: (params) => params.row.insuredAddress.state,
      },
      {
        ...postalCol,
        valueGetter: (params) => params.row.insuredAddress.postal,
      },
      {
        ...currencyCol,
        field: 'quoteTotal',
        headerName: 'Quote Total',
        // minWidth: 120,
        // flex: 0.8,
        // editable: false,
        // headerAlign: 'center',
        // align: 'right',
        // valueFormatter: (params) => formatGridCurrency(params, '$0,0.00'),
        // renderCell: (params) => (
        //   <Typography variant='body2' fontWeight='medium'>
        //     {params.formattedValue}
        //   </Typography>
        // ),
      },
      statusCol,
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
        ...lastNameCol,
        field: 'insuredLastName',
      },
      {
        ...firstNameCol,
        field: 'insuredFirstName',
      },
      {
        ...emailCol,
        field: 'insuredEmail',
        headerName: 'Insured Email',
      },
      {
        ...phoneCol,
        field: 'insuredPhone',
        headerName: 'Insured Phone',
      },
      {
        ...currencyCol,
        field: 'termPremium',
        headerName: 'Term Premium',
      },
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
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
      {
        ...emailCol,
        field: 'agentEmail',
        headerName: 'Agent Email',
      },
      {
        ...phoneCol,
        field: 'agentPhone',
        headerName: 'Agent Phone',
      },
      {
        ...orgNameCol,
        field: 'agencyName',
        headerName: 'Agency',
      },
      createdCol,
      updatedCol,
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
    [showJson, columnOverrides, renderActions]
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
          // pagination: { pageSize: 10 },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
