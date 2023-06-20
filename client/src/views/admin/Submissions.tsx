import React, { useCallback } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridRowId, GridRowParams } from '@mui/x-data-grid';
import { doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { RequestQuoteRounded } from '@mui/icons-material';

import { submissionsCollection, Submission } from 'common';
import { ADMIN_ROUTES, createPath } from 'router';
import { withIdConverter } from 'common/firestoreConverters';
import { useConfirmAndUpdate } from './Quotes';
import { SubmissionsGrid } from 'elements';

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

export const Submissions = () => {
  const navigate = useNavigate();
  const updateSubmission = useUpdateSubmission();
  const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);

  const handleCreateQuote = useCallback(
    (subId: GridRowId) => () => {
      navigate({
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: subId.toString() },
        }),
      });
    },
    [navigate]
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
  }, []);

  const renderAdminActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip title='Create Quote' placement='top'>
            <RequestQuoteRounded />
          </Tooltip>
        }
        onClick={handleCreateQuote(params.id)}
        label='Create Quote'
      />,
    ],
    [handleCreateQuote]
  );

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
        Submissions
      </Typography>
      <SubmissionsGrid
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
        renderActions={renderAdminActions}
      />
    </Box>
  );
};

// <Box sx={{ height: 500, width: '100%' }}>
//   <ServerDataGrid
//     collName='SUBMISSIONS'
//     columns={submissionColumns}
//     density='compact'
//     autoHeight
//     onCellDoubleClick={(params, event) => {
//       if (!params.isEditable) {
//         navigate(
//           createPath({
//             path: ADMIN_ROUTES.SUBMISSION_VIEW,
//             params: { submissionId: params.id.toString() },
//           })
//         );
//       }
//     }}
//     processRowUpdate={confirmAndUpdate}
//     onProcessRowUpdateError={handleProcessRowUpdateError}
//     slots={{
//       toolbar: GridToolbar,
//     }}
//     slotProps={{
//       toolbar: { csvOptions: { allColumns: true } },
//     }}
//     initialState={{
//       columns: {
//         columnVisibilityModel: {
//           firstName: false,
//           lastName: false,
//           'address.addressLine2': false,
//           'address.postal': false,
//           'address.countyName': false,
//           'address.countyFIPS': false,
//           latitude: false,
//           longitude: false,
//           updated: false,
//           spatialKeyDocId: false,
//         },
//       },
//       sorting: {
//         sortModel: [{ field: 'metadata.created', sort: 'desc' }],
//       },
//       pagination: { paginationModel: { page: 0, pageSize: 10 } },
//     }}
//   />
// </Box>

//   // const submissionColumns: GridColDef[] = useMemo(
//   //   () => [
//   //     {
//   //       field: 'actions',
//   //       headerName: 'Actions',
//   //       type: 'actions',
//   //       width: 160,
//   //       getActions: (params: GridRowParams) => [
//   //         <GridActionsCellItem
//   //           icon={
//   //             <Tooltip title='Create Quote' placement='top'>
//   //               <RequestQuoteRounded />
//   //             </Tooltip>
//   //           }
//   //           onClick={handleCreateQuote(params.id)}
//   //           label='Create Quote'
//   //         />,
//   //         <GridActionsCellItem
//   //           icon={
//   //             <Tooltip title='Google Maps' placement='top'>
//   //               <MapRounded />
//   //             </Tooltip>
//   //           }
//   //           onClick={openMap(params)}
//   //           label='Google Maps'
//   //         />,
//   //         <GridActionsCellItem
//   //           icon={
//   //             <Tooltip title='Flood Factor' placement='top'>
//   //               <FloodRounded />
//   //             </Tooltip>
//   //           }
//   //           onClick={openFloodFactor(params)}
//   //           label='Google Maps'
//   //         />,
//   //         <GridActionsCellItem
//   //           icon={
//   //             <Tooltip title='Show JSON' placement='top'>
//   //               <DataObjectRounded />
//   //             </Tooltip>
//   //           }
//   //           onClick={openSubmissionDataDialog(params)}
//   //           label='Show JSON'
//   //         />,
//   //       ],
//   //     },
//   //     {
//   //       ...statusCol,
//   //       type: 'singleSelect',
//   //       valueOptions: [
//   //         SUBMISSION_STATUS.QUOTED,
//   //         SUBMISSION_STATUS.SUBMITTED,
//   //         SUBMISSION_STATUS.NOT_ELIGIBLE,
//   //         SUBMISSION_STATUS.PENDING_INFO,
//   //         SUBMISSION_STATUS.CANCELLED,
//   //         SUBMISSION_STATUS.DRAFT,
//   //       ],
//   //       editable: true,
//   //     },
//   //     {
//   //       ...addrLine1Col,
//   //       description: 'Submission address to be used for insured location',
//   //     },
//   //     addrLine2Col,
//   //     addrCityCol,
//   //     addrStateCol,
//   //     addrPostalCol,
//   //     addrCountyCol,
//   //     addrFIPSCol,
//   //     annualPremiumCol,
//   //     deductibleCol,
//   //     limitACol,
//   //     limitBCol,
//   //     limitCCol,
//   //     limitDCol,
//   //     tivCol,
//   //     {
//   //       ...displayNameCol,
//   //       sortable: false,
//   //       valueGetter: (params) => {
//   //         if (params.value) return params.value;
//   //         if (params.row.firstName || params.row.lastName)
//   //           return `${params.row.firstName} ${params.row.lastName}`.trim();
//   //         if (params.row.contact?.firstName || params.row.contact?.lastName)
//   //           return `${params.row.contact?.firstName} ${params.row.contact?.lastName}`.trim();
//   //         return null;
//   //       },
//   //     },
//   //     {
//   //       ...firstNameCol,
//   //       valueGetter: (params) => params.row.contact?.firstName || null,
//   //     },
//   //     {
//   //       ...lastNameCol,
//   //       valueGetter: (params) => params.row.contact?.lastName || null,
//   //     },
//   //     {
//   //       ...emailCol,
//   //       valueGetter: (params) => params.row.contact?.email || null,
//   //       description: 'Provided contact email',
//   //     },
//   //     // replacementCostCol,
//   //     ratingDataReplacementCostCol,
//   //     {
//   //       field: 'exclusions',
//   //       headerName: 'Exclusions',
//   //       description: 'Exclusions selected by user',
//   //       minWidth: 200,
//   //       flex: 1,
//   //       editable: false,
//   //     },
//   //     priorLossCountCol,
//   //     ratingDataDistToCoastFeetCol,
//   //     ratingDataBasementCol,
//   //     ratingDataNumStoriesCol,
//   //     ratingDataPropertyCodeCol,
//   //     ratingDataSqFootageCol,
//   //     ratingDataYearBuiltCol,
//   //     ratingDataFloodZoneCol,
//   //     ratingDataCBRSCol,
//   //     inlandAALCol,
//   //     surgeAALCol,
//   //     tsunamiAALCol,
//   //     coordinatesCol,
//   //     latitudeCol,
//   //     longitudeCol,
//   //     createdCol,
//   //     updatedCol,
//   //     {
//   //       field: 'propertyDataDocId',
//   //       headerName: 'Property Data Doc ID',
//   //       description: 'Document ID for the property data response',
//   //       valueGetter: (params) => params.row.propertyDataDocId || null,
//   //       ...copyBaseProps,
//   //     },
//   //     {
//   //       ...userIdCol,
//   //       description:
//   //         'user ID of the user that created submission (could have been anonymous if they were not signed in)',
//   //     },

//   //     {
//   //       ...idCol,
//   //       headerName: 'Submission ID',
//   //       description: 'Document/database ID for the submission',
//   //     },
//   //   ],
//   //   [handleCreateQuote, openMap, openFloodFactor, openSubmissionDataDialog]
//   // );
