import React from 'react';
import { useNavigate } from 'react-router-dom';
import { limit, orderBy } from 'firebase/firestore';
import { Box, Button, Chip, Typography } from '@mui/material';
import { BusinessRounded, PersonRounded } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';

import { ADMIN_ROUTES, createPath } from 'router';
import { BasicDataGrid } from 'components';
import { useCollectionData } from 'hooks';
import {
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  updatedCol,
} from 'common';

const licensesColumns: GridColDef[] = [
  {
    ...idCol,
    headerName: 'Doc ID',
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
  booleanCalcActiveCol,
  effectiveDateCol,
  expirationDateCol,
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
  createdCol,
  updatedCol,
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
            pagination: { paginationModel: { pageSize: 10 } },
            // pagination: { pageSize: 10 },
          }}
        />
      </Box>
    </Box>
  );
};
