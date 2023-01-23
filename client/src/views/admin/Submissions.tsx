import React from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { getDocs, query, orderBy, limit } from 'firebase/firestore';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import { submissionsCollection } from 'common/firestoreCollections';
import { Submission } from 'common/types';
import { BasicDataGrid, renderGridEmail } from 'components';
import { formatGridCurrency, formatGridFirestoreTimestamp } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';

export const submissionsLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    return getDocs(
      query(submissionsCollection, orderBy('metadata.created', 'desc'), limit(100))
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`); // , {status: }
  }
};

export interface SubmissionWithId extends Submission {
  id: string;
}

export const submissionColumns: GridColDef[] = [
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 120,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'displayName',
    headerName: 'Name',
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
    minWidth: 160,
    flex: 1,
    editable: false,
    // valueGetter: (params) => `${params.row.email}`,
    renderCell: (params) => renderGridEmail(params),
  },
  {
    field: 'addressLine1',
    headerName: 'Address',
    minWidth: 200,
    flex: 1,
    editable: false,
  },
  {
    field: 'addressLine2',
    headerName: 'Unit/Suite',
    minWidth: 100,
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
    field: 'limitA',
    headerName: 'Limit A',
    minWidth: 120,
    flex: 0.8,
    editable: false,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'limitB',
    headerName: 'Limit B',
    minWidth: 120,
    flex: 0.8,
    editable: false,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'limitC',
    headerName: 'Limit C',
    minWidth: 120,
    flex: 0.8,
    editable: false,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'limitD',
    headerName: 'Limit D',
    minWidth: 120,
    flex: 0.8,
    editable: false,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'deductible',
    headerName: 'Deductible',
    minWidth: 100,
    flex: 0.5,
    editable: false,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'replacementCost',
    headerName: 'Replacement Cost',
    minWidth: 140,
    flex: 0.8,
    valueFormatter: formatGridCurrency,
  },
  {
    field: 'exclusions',
    headerName: 'Exclusions',
    minWidth: 200,
    flex: 1,
    editable: false,
    // TODO: valueFormatter
  },
  {
    field: 'priorLossCount',
    headerName: 'Prior Losses',
    minWidth: 100,
    flex: 0.4,
    editable: false,
    // TODO: valueFormatter
  },
  {
    field: 'distToCoastFeet',
    headerName: 'Dist. to Coast',
    minWidth: 120,
    flex: 0.4,
  },
  {
    field: 'basement',
    headerName: 'Basement',
    minWidth: 100,
    flex: 0.4,
  },
  {
    field: 'numStories',
    headerName: 'Num. Stories',
    minWidth: 100,
    flex: 0.4,
  },
  {
    field: 'propertyCode',
    headerName: 'Property Code',
    minWidth: 180,
    flex: 0.8,
  },
  {
    field: 'sqFootage',
    headerName: 'Sq. Footage',
    minWidth: 100,
    flex: 0.4,
  },
  {
    field: 'yearBuilt',
    headerName: 'Year Built',
    minWidth: 80,
    flex: 0.4,
  },
  {
    field: 'spatialKeyDocId',
    headerName: 'SK Doc ID',
    minWidth: 140,
    flex: 0.4,
  },
  {
    field: 'floodZone',
    headerName: 'FZ',
    minWidth: 60,
    flex: 0.4,
  },
  {
    field: 'CBRSDesignation',
    headerName: 'CBRS Des.',
    minWidth: 100,
    flex: 0.5,
  },
  {
    field: 'created',
    headerName: 'Created',
    minWidth: 180,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.metadata?.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'updated',
    headerName: 'Updated',
    minWidth: 180,
    flex: 1,
    editable: false,
    valueGetter: (params) => params.row.metadata?.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'userId',
    headerName: 'User ID',
    minWidth: 220,
    flex: 1,
    editable: false,
  },
  { field: 'id', headerName: 'Submission ID', minWidth: 220, flex: 1 },
];

export interface SubmissionsProps {}

export const Submissions: React.FC<SubmissionsProps> = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as SubmissionWithId[];

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ pl: 3 }}>
        Submissions
      </Typography>
      <BasicDataGrid
        rows={data || []}
        columns={submissionColumns}
        density='compact'
        onRowClick={(params) => {
          navigate(
            createPath({
              path: ADMIN_ROUTES.SUBMISSION_VIEW,
              params: { submissionId: params.id.toString() },
            })
          );
          // navigate(`/submissions/${params.id}`);
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              // id: false,
              updated: false,
              spatialKeyDocId: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: {
            pageSize: 10,
          },
          // filter: {
          //   filterModel: {
          //     items: [{ columnField: 'status', operatorValue: 'equals', value: 'pending' }],
          //   },
          // },
        }}
      />
      {/* {data && data.length > 0 ? (
        <Box sx={{ py: 8 }}>
          {data.map((sub) => (
            <div key={sub.id}>
              <Typography
                variant='subtitle2'
                color='primary.700'
              >{`Submission: ${sub.id}`}</Typography>
              <Typography variant='body2' color='text.secondary' component='div'>
                <pre>{JSON.stringify(sub, null, 2)}</pre>
              </Typography>
            </div>
          ))}
        </Box>
      ) : (
        <Typography>No Submissions</Typography>
      )} */}
    </Box>
  );
};
