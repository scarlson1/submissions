import React, { useMemo } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useLoaderData, useNavigate } from 'react-router-dom';

import { AgencyApplicationWithId, COLLECTIONS } from 'common';
import { Box, Typography } from '@mui/material';
import { BasicDataGrid, renderGridEmail, renderGridPhone, FileLink } from 'components';
import { GridCellParams, GridColDef } from '@mui/x-data-grid';
import { formatGridFirestoreTimestamp, getGridAddressComponent } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { db } from 'firebaseConfig';

export const agencyAppsLoader = async () => {
  try {
    const ref = collection(db, COLLECTIONS.AGENCY_APPLICATIONS);
    return getDocs(query(ref, orderBy('metadata.created', 'desc'), limit(100))).then((querySnap) =>
      querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }))
    );
    // return getDocs(
    //   query(agencyAppCollection, orderBy('metadata.created', 'desc'), limit(100))
    // ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`);
  }
};

export const AgencyApps: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as AgencyApplicationWithId[];

  const handleCellClick = (params: GridCellParams<any>) => {
    const ignoreFieldsContaining = ['email', 'phone', 'EandO'];

    if (ignoreFieldsContaining.some((partialField) => params.field.includes(partialField))) {
      if (params.value && params.value.length > 0) return;
    } else if (params.field === 'actions') {
      return;
    } else {
      navigate(
        createPath({
          path: ADMIN_ROUTES.AGENCY_APP,
          params: { submissionId: params.id.toString() },
        })
      );
    }
  };

  const agencyAppColumns: GridColDef[] = useMemo(
    () => [
      // {
      //   field: 'actions',
      //   headerName: 'Actions',
      //   type: 'actions',
      //   width: 100,
      //   getActions: (params: GridRowParams) => [
      //     <GridActionsCellItem
      //       icon={<VisibilityRounded />}
      //       onClick={showDetails(params.id)}
      //       label='View Counties'
      //     />,
      //     <GridActionsCellItem
      //       icon={<MapRounded />}
      //       onClick={showMap(params.id)}
      //       label='Show Map'
      //     />,
      //     <GridActionsCellItem
      //       icon={<BlockRounded />}
      //       onClick={deactivate(params.id)}
      //       label='Deactivate'
      //     />,
      //   ],
      // },
      {
        field: 'id',
        headerName: 'Doc ID',
        minWidth: 160,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'orgName',
        headerName: 'Company Name',
        minWidth: 200,
        flex: 1,
        editable: false,
      },
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => `${params.row.contact.firstName} ${params.row.contact.lastName}`,
      },
      {
        field: 'contact.firstName',
        headerName: 'Contact First Name',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.firstName || null,
      },
      {
        field: 'contact.lastName',
        headerName: 'Contact Last Name',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        field: 'contact.email',
        headerName: 'Contact Email',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.email || null,
        renderCell: (params) => renderGridEmail(params),
      },
      {
        field: 'contact.phone',
        headerName: 'Contact Phone',
        minWidth: 160,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.phone || null,
        renderCell: (params) => renderGridPhone(params),
      },
      {
        field: 'address.addressLine1',
        headerName: 'Address',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'addressLine1'),
      },
      {
        field: 'address.addressLine2',
        headerName: 'Suite/Unit',
        minWidth: 80,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'addressLine2'),
      },
      {
        field: 'address.city',
        headerName: 'City',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'city'),
      },
      {
        field: 'address.state',
        headerName: 'State',
        minWidth: 80,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'state'),
      },
      {
        field: 'address.postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'postal'),
      },
      {
        field: 'EandO',
        headerName: 'E & O',
        minWidth: 180,
        flex: 1,
        editable: false,
        renderCell: ({ value }) => (
          <FileLink
            filepath={value}
            url={value}
            fileType='.pdf'
            typographyProps={{ variant: 'body2', fontWeight: 'fontWeightMedium' }}
            linkProps={{ underline: 'hover' }}
          />
        ),
      },
      {
        field: 'FEIN',
        headerName: 'FEIN',
        minWidth: 120,
        flex: 1,
        editable: false,
      },
      {
        field: 'metadata.created',
        headerName: 'Created',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'metadata.updated',
        headerName: 'Updated',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.updated || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
    ],
    []
    // [showDetails, showMap, deactivate]
  );

  return (
    <Box>
      <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }} gutterBottom>
        Agency Submissions
      </Typography>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={agencyAppColumns}
          density='compact'
          autoHeight
          onCellDoubleClick={handleCellClick}
          // onRowDoubleClick={(params, e, details) => {
          //   if (e.)
          // navigate(
          //   createPath({
          //     path: ADMIN_ROUTES.AGENCY_APP,
          //     params: { submissionId: params.id.toString() },
          //   })
          // );
          // }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
                'address.addressLine2': false,
                'contact.firstName': false,
                'contact.lastName': false,
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
