import React, { useCallback, useMemo } from 'react';
import { Box, Chip, ChipProps, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowParams,
  GridToolbar,
  GridValueFormatterParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { orderBy, limit, doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
import { createSearchParams, useNavigate } from 'react-router-dom';
import {
  CloseRounded,
  FiberNewRounded,
  FindInPageRounded,
  HourglassBottomRounded,
  MapRounded,
  PendingRounded,
  RequestQuoteRounded,
  ThumbDownRounded,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { submissionsCollection, SUBMISSION_STATUS, Submission } from 'common';
import { BasicDataGrid, GridCellCopy, renderGridEmail } from 'components';
import {
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  numberFormat,
} from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { withIdConverter } from 'common/firestoreConverters';
import { useConfirmAndUpdate } from './Quotes';
import { useCollectionData } from 'hooks';

const useUpdateSubmission = () => {
  const update = useCallback(async (id: string, updateValues: Partial<Submission>) => {
    const ref = doc(submissionsCollection(getFirestore()), id).withConverter(
      withIdConverter<Submission>()
    );
    // TODO: fix nested dot notation typescript complaint https://stackoverflow.com/a/47058976/10887890
    // https://github.com/googleapis/nodejs-firestore/issues/1448
    await updateDoc(ref, { status: updateValues.status });

    const snap = await getDoc(ref);
    const updatedData = snap.data();
    if (!updatedData) throw new Error('Error updating data');

    return { ...updatedData };
  }, []);

  return update;
};

export interface SubmissionsProps {}

export const Submissions: React.FC<SubmissionsProps> = () => {
  const navigate = useNavigate();
  const { data, status } = useCollectionData('SUBMISSIONS', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);
  const updateSubmission = useUpdateSubmission();
  const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);

  const handleCreateQuote = useCallback(
    (subId: GridRowId) => () => {
      navigate({
        pathname: createPath({ path: ADMIN_ROUTES.QUOTE_NEW, params: { productId: 'flood' } }),
        search: createSearchParams({
          submissionId: `${subId}`,
        }).toString(),
      });
    },
    [navigate]
  );

  const openGoogleMaps = useCallback(
    (params: GridRowParams) => () => {
      let { latitude, longitude } = params.row;
      if (!(latitude && longitude)) return toast.error('Missing coordinates');
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`);
    },
    []
  );

  const submissionColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Create Quote' placement='top'>
                <RequestQuoteRounded />
              </Tooltip>
            }
            onClick={handleCreateQuote(params.id)}
            label='Create Quote'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Google Maps' placement='top'>
                <MapRounded />
              </Tooltip>
            }
            onClick={openGoogleMaps(params)}
            label='Google Maps'
          />,
        ],
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'singleSelect',
        valueOptions: [
          SUBMISSION_STATUS.QUOTED,
          SUBMISSION_STATUS.SUBMITTED,
          SUBMISSION_STATUS.NOT_ELIGIBLE,
          SUBMISSION_STATUS.PENDING_INFO,
          SUBMISSION_STATUS.CANCELLED,
          SUBMISSION_STATUS.DRAFT,
        ],
        editable: true,
        minWidth: 160,
        flex: 0.6,
        disableClickEventBubbling: true,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size='small'
            variant='outlined'
            {...getChipProps(params.value)}
          />
        ),
      },
      {
        field: 'displayName',
        headerName: 'Name',
        description: 'Provided contact name',
        minWidth: 160,
        flex: 0.8,
        editable: false,
        valueGetter: (params: GridValueGetterParams) =>
          `${params.row.firstName} ${params.row.lastName}`,
      },
      {
        field: 'firstName',
        headerName: 'First Name',
        minWidth: 120,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        minWidth: 120,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'email',
        headerName: 'Email',
        description: 'Provided contact email',
        minWidth: 200,
        flex: 1,
        editable: false,
        // valueGetter: (params) => `${params.row.email}`,
        renderCell: (params: GridRenderCellParams) => renderGridEmail(params),
      },
      {
        field: 'addressLine1',
        headerName: 'Address',
        description: 'Submission address to be used for insured location',
        minWidth: 200,
        flex: 1,
        editable: false,
      },
      {
        field: 'addressLine2',
        headerName: 'Unit/Suite',
        minWidth: 80,
        flex: 0.4,
        editable: false,
      },
      {
        field: 'city',
        headerName: 'City',
        minWidth: 150,
        flex: 1,
        editable: false,
      },
      {
        field: 'state',
        headerName: 'State',
        minWidth: 80,
        flex: 0.1,
        editable: false,
      },
      {
        field: 'postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'countyName',
        headerName: 'County',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        // valueGetter: (params) => params.row.countyName || null
      },
      {
        field: 'countyFIPS',
        headerName: 'FIPS',
        minWidth: 120,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'latitude',
        headerName: 'Latitude',
        minWidth: 100,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => {
          const { coordinates } = params.row;
          return coordinates ? coordinates?.latitude || null : null;
        },
      },
      {
        field: 'longitude',
        headerName: 'Longitude',
        minWidth: 100,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => {
          const { coordinates } = params.row;
          return coordinates ? coordinates?.longitude || null : null;
        },
      },
      {
        field: 'annualPremium',
        headerName: 'Annual Premium',
        description: 'Annual premium before taxes and fees',
        minWidth: 140,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitA',
        headerName: 'Limit A',
        description: 'Coverage A limit (building)',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitB',
        headerName: 'Limit B',
        description: 'Coverage B limit (Additional structures)',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitC',
        headerName: 'Limit C',
        description: 'Coverage C limit (contents)',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitD',
        headerName: 'Limit D',
        description: 'Coverage D limit (living expenses)',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'deductible',
        headerName: 'Deductible',
        description: 'Dollar based deductible submitted by user',
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
        description: 'Building replacement cost',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'exclusions',
        headerName: 'Exclusions',
        description: 'Exclusions selected by user',
        minWidth: 200,
        flex: 1,
        editable: false,
        // TODO: valueFormatter
      },
      {
        field: 'priorLossCount',
        headerName: 'Prior Losses',
        description: 'Prior loss count provided by user',
        minWidth: 100,
        flex: 0.4,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        // TODO: valueFormatter
      },
      {
        field: 'distToCoastFeet',
        headerName: 'Dist. to Coast',
        description: 'Converted to feet from the value provided by property data api',
        minWidth: 120,
        flex: 0.4,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: (params: GridValueFormatterParams<number>) =>
          params.value ? numberFormat(params.value) : null,
      },
      {
        field: 'basement',
        headerName: 'Basement',
        description: 'Basement value provided by property api',
        minWidth: 140,
        flex: 0.4,
      },
      {
        field: 'numStories',
        headerName: 'Num. Stories',
        description: 'Number of stories provided by property api',
        minWidth: 100,
        flex: 0.4,
        headerAlign: 'center',
        align: 'right',
      },
      {
        field: 'propertyCode',
        headerName: 'Property Code',
        description: 'Property code provided by property api',
        minWidth: 180,
        flex: 0.8,
      },
      {
        field: 'sqFootage',
        headerName: 'Sq. Footage',
        description: 'Square footage provided by property api',
        minWidth: 100,
        flex: 0.4,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: (params: GridValueFormatterParams<number>) =>
          params.value ? numberFormat(params.value) : null,
      },
      {
        field: 'yearBuilt',
        headerName: 'Year Built',
        description: 'Year built provided by property api',
        minWidth: 80,
        flex: 0.4,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'spatialKeyDocId',
        headerName: 'SK Doc ID',
        description: 'Document/database ID for the entire property data response',
        minWidth: 140,
        flex: 0.4,
      },
      {
        field: 'floodZone',
        headerName: 'FZ',
        description: 'Flood zone provided by property api',
        minWidth: 60,
        flex: 0.4,
      },
      {
        field: 'CBRSDesignation',
        headerName: 'CBRS Des.',
        description: 'Coastal Barrier Reef System Designation provided by property api',
        minWidth: 100,
        flex: 0.5,
      },
      {
        field: 'inlandAAL',
        headerName: 'inlandAAL',
        description: 'Inland Peril Average Annual Loss from Swiss Re',
        minWidth: 150,
        flex: 0.8,
        valueGetter: (params) => params.value || null,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'surgeAAL',
        headerName: 'surgeAAL',
        description: 'Surge Peril Average Annual Loss from Swiss Re',
        minWidth: 150,
        flex: 0.8,
        valueGetter: (params) => params.value || null,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'created',
        headerName: 'Created',
        type: 'dateTime',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        type: 'dateTime',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'userId',
        headerName: 'User ID',
        description:
          'user ID of the user that created submission (could have been anonymous if they were not signed in)',
        minWidth: 240,
        flex: 1,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'id',
        headerName: 'Submission ID',
        description: 'Document/database ID for the submission',
        minWidth: 220,
        flex: 1,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
    ],
    [handleCreateQuote, openGoogleMaps]
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
  }, []);

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
        All Submissions
      </Typography>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={submissionColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          onCellDoubleClick={(params, event) => {
            if (!params.isEditable) {
              navigate(
                createPath({
                  path: ADMIN_ROUTES.SUBMISSION_VIEW,
                  params: { submissionId: params.id.toString() },
                })
              );
            }
          }}
          processRowUpdate={confirmAndUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          experimentalFeatures={{ newEditingApi: true }}
          components={{ Toolbar: GridToolbar }}
          componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                firstName: false,
                lastName: false,
                addressLine2: false,
                postal: false,
                countyName: false,
                countyFIPS: false,
                latitude: false,
                longitude: false,
                updated: false,
                spatialKeyDocId: false,
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

function getChipProps(status: SUBMISSION_STATUS): Partial<ChipProps> {
  switch (status) {
    case SUBMISSION_STATUS.SUBMITTED:
      return { icon: <FiberNewRounded />, color: 'primary' };
    case SUBMISSION_STATUS.UNDER_REVIEW:
      return { icon: <FindInPageRounded />, color: 'warning' };
    case SUBMISSION_STATUS.DRAFT:
      return { icon: <PendingRounded />, color: 'info' };
    case SUBMISSION_STATUS.NOT_ELIGIBLE:
      return { icon: <ThumbDownRounded />, color: 'default' };
    case SUBMISSION_STATUS.PENDING_INFO:
      return { icon: <HourglassBottomRounded />, color: 'warning' };
    case SUBMISSION_STATUS.QUOTED:
      return { icon: <RequestQuoteRounded />, color: 'success' };
    case SUBMISSION_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    default:
      return { color: 'default' };
  }
}
