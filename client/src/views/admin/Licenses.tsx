import React from 'react';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { licensesCollection, LicenseWithId } from 'common';
import { Box, Button, Typography } from '@mui/material';
import { ADMIN_ROUTES, createPath } from 'router';
import { BasicDataGrid } from 'components';
import { GridColDef } from '@mui/x-data-grid';
import {
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
} from 'modules/utils/helpers';

export const licensesLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc. ??
    return getDocs(query(licensesCollection, orderBy('metadata.created', 'desc'), limit(100))).then(
      (querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }))
    );
  } catch (err) {
    throw new Response(`Error fetching licenses`);
  }
};

const licensesColumns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'Doc ID',
    minWidth: 160,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'state',
    headerName: 'State',
    minWidth: 64,
    flex: 0.5,
    editable: false,
  },
  {
    field: 'ownerType',
    headerName: 'Owner Type',
    minWidth: 100,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'licensee',
    headerName: 'Licensee',
    minWidth: 160,
    flex: 1,
    editable: false,
  },
  {
    field: 'licenseType',
    headerName: 'License Type',
    minWidth: 120,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'licenseNumber',
    headerName: 'License Number',
    minWidth: 160,
    flex: 1,
    editable: false,
  },
  {
    field: 'effectiveDate',
    headerName: 'Effective Date',
    minWidth: 160,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.effectiveDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'expirationDate',
    headerName: 'Expiration Date',
    minWidth: 160,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.expirationDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'surplusLinesProducerOfRecord',
    headerName: 'SL Producer of Record',
    minWidth: 180,
    flex: 1,
    editable: false,
    type: 'boolean',
  },
  {
    field: 'SLAssociationMembershipRequired',
    headerName: 'Asc. Mem. Required',
    minWidth: 160,
    flex: 0.8,
    editable: false,
    type: 'boolean',
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
];

export const Licenses: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as LicenseWithId[];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Surplus Lines License
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSE_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={licensesColumns}
          density='compact'
          autoHeight
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            // pagination: { paginationModel: { pageSize: 5 } },
            pagination: { pageSize: 10 },
          }}
        />
      </Box>
    </Box>
  );
};
