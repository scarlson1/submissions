import React from 'react';
import { useNavigate } from 'react-router-dom';
import { limit, orderBy } from 'firebase/firestore';
import { Box, Button, Chip, Typography } from '@mui/material';
import { BusinessRounded, CheckRounded, CloseRounded, PersonRounded } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';

import { ADMIN_ROUTES, createPath } from 'router';
import { BasicDataGrid } from 'components';
import {
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  isCurrentDateBetween,
} from 'modules/utils/helpers';
import { useCollectionData } from 'hooks';

// export const licensesLoader = async ({ params }: LoaderFunctionArgs) => {
//   try {
//     // TODO: pass query params for order, limit, etc. ??
//     return getDocs(
//       query(licensesCollection(getFirestore()), orderBy('metadata.created', 'desc'), limit(100))
//     ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
//   } catch (err) {
//     throw new Response(`Error fetching licenses`);
//   }
// };

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
    minWidth: 160,
    flex: 0.6,
    editable: false,
    renderCell: (params) => {
      const isIndividual = params.value === 'individual';

      return (
        <Chip
          color={isIndividual ? 'primary' : 'success'}
          size='small'
          label={params.value}
          icon={isIndividual ? <PersonRounded /> : <BusinessRounded />}
        />
      );
    },
  },
  {
    field: 'licensee',
    headerName: 'Licensee',
    minWidth: 160,
    flex: 1,
    editable: false,
    renderCell: (params) => (
      <Typography variant='body2' fontWeight='medium'>
        {params.value}
      </Typography>
    ),
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
    field: 'active',
    headerName: 'Active',
    type: 'boolean',
    description:
      'Current date is after effective date (if exists) and before expiration (if exists)',
    minWidth: 80,
    flex: 0.5,
    headerAlign: 'center',
    align: 'center',
    editable: false,
    valueGetter: (params) =>
      isCurrentDateBetween(params.row.effectiveDate?.toDate(), params.row.expirationDate?.toDate()),
    renderCell: (params) => {
      const isActive = !!params.value;

      if (isActive) return <CheckRounded color='success' fontSize='small' />;
      return <CloseRounded color='disabled' fontSize='small' />;
    },
  },
  {
    field: 'effectiveDate',
    headerName: 'Effective Date',
    type: 'date',
    minWidth: 160,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.effectiveDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'expirationDate',
    headerName: 'Expiration Date',
    type: 'date',
    minWidth: 160,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.expirationDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'surplusLinesProducerOfRecord',
    headerName: 'SL Producer of Record',
    description: 'TODO: tooltip description',
    minWidth: 180,
    flex: 1,
    editable: false,
    type: 'boolean',
  },
  {
    field: 'SLAssociationMembershipRequired',
    headerName: 'Asc. Mem. Required',
    description: 'TODO: tooltip description',
    minWidth: 160,
    flex: 0.8,
    editable: false,
    type: 'boolean',
  },
  {
    field: 'metadata.created',
    headerName: 'Created',
    type: 'dateTime',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.metadata.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'metadata.updated',
    headerName: 'Updated',
    type: 'dateTime',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.metadata.updated || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
];

export const Licenses: React.FC = () => {
  const navigate = useNavigate();
  // const data = useLoaderData() as LicenseWithId[];
  const { data, status } = useCollectionData('LICENSES', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);

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
          loading={status === 'loading'}
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
