import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import { orderBy, limit, doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapRounded, RequestQuoteRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import {
  submissionsCollection,
  SUBMISSION_STATUS,
  Submission,
  coordinatesCol,
  latitudeCol,
  longitudeCol,
  deductibleCol,
  emailCol,
  createdCol,
  updatedCol,
  userIdCol,
  idCol,
  priorLossCountCol,
  distToCoastFeetCol,
  basementCol,
  numStoriesCol,
  propertyCodeCol,
  sqFootageCol,
  yearBuiltCol,
  floodZoneCol,
  CBRSCol,
  inlandAALCol,
  surgeAALCol,
  replacementCostCol,
  annualPremiumCol,
  displayNameCol,
  firstNameCol,
  lastNameCol,
  statusCol,
} from 'common';
import { BasicDataGrid } from 'components';
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
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: `${subId}` },
        }),
        // search: createSearchParams({
        //   submissionId: `${subId}`,
        // }).toString(),
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
        ...statusCol,
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
      },
      displayNameCol,
      firstNameCol,
      lastNameCol,
      {
        ...emailCol,
        description: 'Provided contact email',
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
      coordinatesCol,
      latitudeCol,
      longitudeCol,
      annualPremiumCol,
      deductibleCol,
      replacementCostCol,
      {
        field: 'exclusions',
        headerName: 'Exclusions',
        description: 'Exclusions selected by user',
        minWidth: 200,
        flex: 1,
        editable: false,
        // TODO: valueFormatter
      },
      priorLossCountCol,
      distToCoastFeetCol,
      basementCol,
      numStoriesCol,
      propertyCodeCol,
      sqFootageCol,
      yearBuiltCol,
      floodZoneCol,
      CBRSCol,
      inlandAALCol,
      surgeAALCol,
      createdCol,
      updatedCol,
      {
        ...userIdCol,
        description:
          'user ID of the user that created submission (could have been anonymous if they were not signed in)',
      },

      {
        ...idCol,
        headerName: 'Submission ID',
        description: 'Document/database ID for the submission',
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
