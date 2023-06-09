import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import { doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useFirestore, useFunctions } from 'reactfire';
import { useNavigate } from 'react-router-dom';
import {
  DataObjectRounded,
  FloodRounded,
  MapRounded,
  RequestQuoteRounded,
} from '@mui/icons-material';

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
  ratingDataCBRSCol,
  inlandAALCol,
  surgeAALCol,
  annualPremiumCol,
  displayNameCol,
  firstNameCol,
  lastNameCol,
  statusCol,
  ratingDataFloodZoneCol,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  addrFIPSCol,
  addrCountyCol,
  addrLine1Col,
  ratingDataReplacementCostCol,
  ratingDataPropertyCodeCol,
  ratingDataYearBuiltCol,
  ratingDataSqFootageCol,
  ratingDataNumStoriesCol,
  ratingDataBasementCol,
  ratingDataDistToCoastFeetCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  copyBaseProps,
} from 'common';
import { ServerDataGrid } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { withIdConverter } from 'common/firestoreConverters';
import { useConfirmAndUpdate } from './Quotes';
import { useAsyncToast, useJsonDialog } from 'hooks';
import { getRiskFactorId } from 'modules/api';

function firstStreetFormat(str: string) {
  return str.toLowerCase().replaceAll(' ', '-');
}

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
  const firestore = useFirestore();
  // const { data, status } = useCollectionData('SUBMISSIONS', [
  //   orderBy('metadata.created', 'desc'),
  //   limit(100),
  // ]);
  const dialog = useJsonDialog();
  const updateSubmission = useUpdateSubmission();
  const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);
  const functions = useFunctions();
  const toast = useAsyncToast();

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

  const openGoogleMaps = useCallback(
    (params: GridRowParams<Submission>) => () => {
      const latitude = params.row.coordinates?.latitude;
      const longitude = params.row.coordinates?.longitude;
      if (!(latitude && longitude)) return toast.error('Missing coordinates');
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`);
    },
    [toast]
  );

  const openFloodFactor = useCallback(
    (params: GridRowParams<Submission>) => async () => {
      const address = params.row.address;
      if (!address) return toast.error('Missing address');
      const { addressLine1, city, state, postal } = address;

      let fsid;

      try {
        toast.loading('fetching location ID...');

        const { data } = await getRiskFactorId(functions, {
          addressLine1,
          city,
          state,
        });
        console.log('GET ID RES: ', data);
        fsid = data?.fsid;
      } catch (err) {
        console.log('ERROR: ', err);
      }

      if (fsid) {
        let floodStreetUrl = `https://riskfactor.com/property/${firstStreetFormat(
          addressLine1
        )}-${firstStreetFormat(city)}-${firstStreetFormat(state)}-${firstStreetFormat(
          postal
        )}/${fsid}_fsid/flood`;
        toast.success(`opening in new tab (FSID: ${fsid})`);

        window.open(floodStreetUrl, '_blank');
      } else {
        toast.error('Unable to get location ID');
      }
    },
    [functions, toast]
  );

  const openSubmissionDataDialog = useCallback(
    (params: GridRowParams<Submission>) => async () => {
      try {
        const subSnap = await getDoc(doc(submissionsCollection(firestore), params.id.toString()));

        const subData = subSnap.data();
        if (!subData)
          return toast.error(`Submission data not found for ID ${params.id.toString()}`);

        dialog(subData, `Submission Data ${params.id.toString()}`);
      } catch (err) {
        console.log('Error fetching submission doc');
      }
    },
    [firestore, dialog, toast]
  );

  const submissionColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 160,
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
          <GridActionsCellItem
            icon={
              <Tooltip title='Flood Factor' placement='top'>
                <FloodRounded />
              </Tooltip>
            }
            onClick={openFloodFactor(params)}
            label='Google Maps'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Show JSON' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={openSubmissionDataDialog(params)}
            label='Show JSON'
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
      {
        ...addrLine1Col,
        description: 'Submission address to be used for insured location',
      },
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      addrCountyCol,
      addrFIPSCol,
      annualPremiumCol,
      deductibleCol,
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      tivCol,
      {
        ...displayNameCol,
        sortable: false,
        valueGetter: (params) => {
          if (params.value) return params.value;
          if (params.row.firstName || params.row.lastName)
            return `${params.row.firstName} ${params.row.lastName}`.trim();
          if (params.row.contact?.firstName || params.row.contact?.lastName)
            return `${params.row.contact?.firstName} ${params.row.contact?.lastName}`.trim();
          return null;
        },
      },
      {
        ...firstNameCol,
        valueGetter: (params) => params.row.contact?.firstName || null,
      },
      {
        ...lastNameCol,
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        ...emailCol,
        valueGetter: (params) => params.row.contact?.email || null,
        description: 'Provided contact email',
      },
      // replacementCostCol,
      ratingDataReplacementCostCol,
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
      // distToCoastFeetCol,
      ratingDataDistToCoastFeetCol,
      // basementCol,
      ratingDataBasementCol,
      // numStoriesCol,
      ratingDataNumStoriesCol,
      // propertyCodeCol,
      ratingDataPropertyCodeCol,
      // sqFootageCol,
      ratingDataSqFootageCol,
      // yearBuiltCol,
      ratingDataYearBuiltCol,
      // floodZoneCol,
      ratingDataFloodZoneCol,
      // CBRSCol,
      ratingDataCBRSCol,
      inlandAALCol,
      surgeAALCol,
      coordinatesCol,
      latitudeCol,
      longitudeCol,
      createdCol,
      updatedCol,
      {
        field: 'propertyDataDocId',
        headerName: 'Property Data Doc ID',
        description: 'Document ID for the property data response',
        valueGetter: (params) => params.row.propertyDataDocId || null,
        ...copyBaseProps,
      },
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
    [handleCreateQuote, openGoogleMaps, openFloodFactor, openSubmissionDataDialog]
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
        <ServerDataGrid
          collName='SUBMISSIONS'
          columns={submissionColumns}
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
          // experimentalFeatures={{ newEditingApi: true }} // v5
          // components={{ Toolbar: GridToolbar }}
          // componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: { csvOptions: { allColumns: true } },
          }}
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
              sortModel: [{ field: 'metadata.created', sort: 'desc' }],
            },
            pagination: { paginationModel: { page: 0, pageSize: 10 } },
          }}
        />
        {/* <BasicDataGrid
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
        /> */}
      </Box>
    </Box>
  );
};

// import React, { useCallback, useMemo } from 'react';
// import { Box, Tooltip, Typography } from '@mui/material';
// import {
//   GridActionsCellItem,
//   GridColDef,
//   GridRowId,
//   GridRowParams,
//   GridToolbar,
// } from '@mui/x-data-grid';
// import { orderBy, limit, doc, updateDoc, getDoc, getFirestore } from 'firebase/firestore';
// import { useFunctions } from 'reactfire';
// import { useNavigate } from 'react-router-dom';
// import { FloodRounded, MapRounded, RequestQuoteRounded } from '@mui/icons-material';

// import {
//   submissionsCollection,
//   SUBMISSION_STATUS,
//   Submission,
//   coordinatesCol,
//   latitudeCol,
//   longitudeCol,
//   deductibleCol,
//   emailCol,
//   createdCol,
//   updatedCol,
//   userIdCol,
//   idCol,
//   priorLossCountCol,
//   distToCoastFeetCol,
//   basementCol,
//   numStoriesCol,
//   propertyCodeCol,
//   sqFootageCol,
//   yearBuiltCol,
//   floodZoneCol,
//   CBRSCol,
//   inlandAALCol,
//   surgeAALCol,
//   replacementCostCol,
//   annualPremiumCol,
//   displayNameCol,
//   firstNameCol,
//   lastNameCol,
//   statusCol,
// } from 'common';
// import { BasicDataGrid } from 'components';
// import { ADMIN_ROUTES, createPath } from 'router';
// import { withIdConverter } from 'common/firestoreConverters';
// import { useConfirmAndUpdate } from './Quotes';
// import { useAsyncToast, useCollectionData } from 'hooks';
// import { getRiskFactorId } from 'modules/api';
// import { getRiskFactorIdv2 } from 'modules/api/getRiskFactorId';

// // https://riskfactor.com/api/autocomplete/208%20aiken%20hunt%20 --> returns { fsid, lat, lng, display, score }

// // can use fsid to get data from urls below

// // https://riskfactor.com/property/2012-mcpherson-ln-nashville-tn-37221/471459653_fsid/overview

// // https://riskfactor.com/property/2012-mcpherson-ln-nashville-tn-37221/471459653_fsid/flood

// function firstStreetFormat(str: string) {
//   return str.toLowerCase().replaceAll(' ', '-');
// }

// const useUpdateSubmission = () => {
//   const update = useCallback(async (id: string, updateValues: Partial<Submission>) => {
//     const ref = doc(submissionsCollection(getFirestore()), id).withConverter(
//       withIdConverter<Submission>()
//     );
//     // TODO: fix nested dot notation typescript complaint https://stackoverflow.com/a/47058976/10887890
//     // https://github.com/googleapis/nodejs-firestore/issues/1448
//     await updateDoc(ref, { status: updateValues.status });

//     const snap = await getDoc(ref);
//     const updatedData = snap.data();
//     if (!updatedData) throw new Error('Error updating data');

//     return { ...updatedData };
//   }, []);

//   return update;
// };

// export interface SubmissionsProps {}

// export const Submissions: React.FC<SubmissionsProps> = () => {
//   const navigate = useNavigate();
//   const { data, status } = useCollectionData('SUBMISSIONS', [
//     orderBy('metadata.created', 'desc'),
//     limit(100),
//   ]);
//   const updateSubmission = useUpdateSubmission();
//   const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);
//   const functions = useFunctions();
//   const toast = useAsyncToast();

//   const handleCreateQuote = useCallback(
//     (subId: GridRowId) => () => {
//       navigate({
//         pathname: createPath({
//           path: ADMIN_ROUTES.QUOTE_NEW,
//           params: { productId: 'flood', submissionId: `${subId}` },
//         }),
//         // search: createSearchParams({
//         //   submissionId: `${subId}`,
//         // }).toString(),
//       });
//     },
//     [navigate]
//   );

//   const openGoogleMaps = useCallback(
//     (params: GridRowParams) => () => {
//       let { latitude, longitude } = params.row;
//       if (!(latitude && longitude)) return toast.error('Missing coordinates');
//       window.open(`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`);
//     },
//     [toast]
//   );

//   const openFloodFactor = useCallback(
//     (params: GridRowParams) => async () => {
//       let { addressLine1, city, state, postal } = params.row;
//       if (!addressLine1) return;

//       let fsid;

//       try {
//         const { data: data2 } = await getRiskFactorIdv2(functions, {
//           addressLine1,
//           city,
//           state,
//         });
//         console.log('V2 RES: ', data2);
//       } catch (err) {
//         console.log('ERROR CALLING V2: ', err);
//       }

//       try {
//         toast.loading('fetching location ID...');

//         const { data } = await getRiskFactorId(functions, {
//           addressLine1,
//           city,
//           state,
//         });
//         console.log('GET ID RES: ', data);
//         fsid = data?.fsid;
//       } catch (err) {
//         console.log('ERROR: ', err);
//       }

//       if (fsid) {
//         let floodStreetUrl = `https://riskfactor.com/property/${firstStreetFormat(
//           addressLine1
//         )}-${firstStreetFormat(city)}-${firstStreetFormat(state)}-${firstStreetFormat(
//           postal
//         )}/${fsid}_fsid/flood`;
//         toast.success(`opening in new tab (FSID: ${fsid})`);

//         window.open(floodStreetUrl, '_blank');
//       } else {
//         toast.error('Unable to get location ID');
//       }
//     },
//     [functions, toast]
//   );

//   const submissionColumns: GridColDef[] = useMemo(
//     () => [
//       {
//         field: 'actions',
//         headerName: 'Actions',
//         type: 'actions',
//         width: 120,
//         getActions: (params: GridRowParams) => [
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Create Quote' placement='top'>
//                 <RequestQuoteRounded />
//               </Tooltip>
//             }
//             onClick={handleCreateQuote(params.id)}
//             label='Create Quote'
//           />,
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Google Maps' placement='top'>
//                 <MapRounded />
//               </Tooltip>
//             }
//             onClick={openGoogleMaps(params)}
//             label='Google Maps'
//           />,
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Flood Factor' placement='top'>
//                 <FloodRounded />
//               </Tooltip>
//             }
//             onClick={openFloodFactor(params)}
//             label='Google Maps'
//           />,
//         ],
//       },
//       {
//         ...statusCol,
//         type: 'singleSelect',
//         valueOptions: [
//           SUBMISSION_STATUS.QUOTED,
//           SUBMISSION_STATUS.SUBMITTED,
//           SUBMISSION_STATUS.NOT_ELIGIBLE,
//           SUBMISSION_STATUS.PENDING_INFO,
//           SUBMISSION_STATUS.CANCELLED,
//           SUBMISSION_STATUS.DRAFT,
//         ],
//         editable: true,
//       },
//       displayNameCol,
//       firstNameCol,
//       lastNameCol,
//       {
//         ...emailCol,
//         description: 'Provided contact email',
//       },
//       {
//         field: 'addressLine1',
//         headerName: 'Address',
//         description: 'Submission address to be used for insured location',
//         minWidth: 200,
//         flex: 1,
//         editable: false,
//       },
//       {
//         field: 'addressLine2',
//         headerName: 'Unit/Suite',
//         minWidth: 80,
//         flex: 0.4,
//         editable: false,
//       },
//       {
//         field: 'city',
//         headerName: 'City',
//         minWidth: 150,
//         flex: 1,
//         editable: false,
//       },
//       {
//         field: 'state',
//         headerName: 'State',
//         minWidth: 80,
//         flex: 0.1,
//         editable: false,
//       },
//       {
//         field: 'postal',
//         headerName: 'Postal',
//         minWidth: 100,
//         flex: 0.6,
//         editable: false,
//       },
//       {
//         field: 'countyName',
//         headerName: 'County',
//         minWidth: 160,
//         flex: 0.6,
//         editable: false,
//         // valueGetter: (params) => params.row.countyName || null
//       },
//       {
//         field: 'countyFIPS',
//         headerName: 'FIPS',
//         minWidth: 120,
//         flex: 0.6,
//         editable: false,
//       },
//       coordinatesCol,
//       latitudeCol,
//       longitudeCol,
//       annualPremiumCol,
//       deductibleCol,
//       replacementCostCol,
//       {
//         field: 'exclusions',
//         headerName: 'Exclusions',
//         description: 'Exclusions selected by user',
//         minWidth: 200,
//         flex: 1,
//         editable: false,
//         // TODO: valueFormatter
//       },
//       priorLossCountCol,
//       distToCoastFeetCol,
//       basementCol,
//       numStoriesCol,
//       propertyCodeCol,
//       sqFootageCol,
//       yearBuiltCol,
//       floodZoneCol,
//       CBRSCol,
//       inlandAALCol,
//       surgeAALCol,
//       createdCol,
//       updatedCol,
//       {
//         ...userIdCol,
//         description:
//           'user ID of the user that created submission (could have been anonymous if they were not signed in)',
//       },

//       {
//         ...idCol,
//         headerName: 'Submission ID',
//         description: 'Document/database ID for the submission',
//       },
//     ],
//     [handleCreateQuote, openGoogleMaps, openFloodFactor]
//   );

//   const handleProcessRowUpdateError = useCallback((err: Error) => {
//     console.log('ERROR: ', err);
//   }, []);

//   return (
//     <Box>
//       <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
//         All Submissions
//       </Typography>
//       <Box sx={{ height: 500, width: '100%' }}>
//         <BasicDataGrid
//           rows={data || []}
//           columns={submissionColumns}
//           loading={status === 'loading'}
//           density='compact'
//           autoHeight
//           onCellDoubleClick={(params, event) => {
//             if (!params.isEditable) {
//               navigate(
//                 createPath({
//                   path: ADMIN_ROUTES.SUBMISSION_VIEW,
//                   params: { submissionId: params.id.toString() },
//                 })
//               );
//             }
//           }}
//           processRowUpdate={confirmAndUpdate}
//           onProcessRowUpdateError={handleProcessRowUpdateError}
//           experimentalFeatures={{ newEditingApi: true }}
//           components={{ Toolbar: GridToolbar }}
//           componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
//           initialState={{
//             columns: {
//               columnVisibilityModel: {
//                 firstName: false,
//                 lastName: false,
//                 addressLine2: false,
//                 postal: false,
//                 countyName: false,
//                 countyFIPS: false,
//                 latitude: false,
//                 longitude: false,
//                 updated: false,
//                 spatialKeyDocId: false,
//               },
//             },
//             sorting: {
//               sortModel: [{ field: 'created', sort: 'desc' }],
//             },
//             pagination: { pageSize: 10 },
//           }}
//         />
//       </Box>
//     </Box>
//   );
// };
