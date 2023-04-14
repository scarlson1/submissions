import React, { useMemo } from 'react';
import { SendRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';

import {
  COLLECTIONS,
  User,
  createdCol,
  displayNameCol,
  emailCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgIdCol,
  phoneCol,
  updatedCol,
} from 'common';
import { BasicDataGrid } from 'components';
import { useCollectionData } from 'hooks';
import { QueryConstraint, collection, limit, query, where } from 'firebase/firestore';
import { useCollectionDataPopulateById } from 'hooks/useRx';
import { useFirestore } from 'reactfire';
import { renderChips } from 'components/RenderGridCellHelpers';

export interface UsersGridProps {
  queryConstraints?: QueryConstraint[];
}

export const UsersGrid: React.FC<UsersGridProps> = ({ queryConstraints = [] }) => {
  const { data, status } = useCollectionData<User>('USERS', [...queryConstraints, limit(100)], {
    suspense: false,
  });
  const userColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Message' placement='top'>
                <SendRounded />
              </Tooltip>
            }
            onClick={() => alert('button clicked')} // handleResendInvite(params)
            // LinkComponent={Link}
            // to={`mailto:${params.row.email}`}
            // disabled={!params.row.email}
            label='Message'
            // disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
        ],
      },
      displayNameCol,
      firstNameCol,
      lastNameCol,
      emailCol,
      phoneCol,
      createdCol,
      updatedCol,
      {
        ...idCol,
        headerName: 'User ID',
      },
      orgIdCol,
    ],
    []
  );

  return (
    <Box>
      <BasicDataGrid
        rows={data || []}
        columns={userColumns}
        loading={status === 'loading'}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              // id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { pageSize: 10 },
        }}
      />
    </Box>
  );
};

export interface AdminManageUsersGridProps {
  queryConstraints?: QueryConstraint[];
  orgId: string;
}

export const AdminManageUsersGrid: React.FC<AdminManageUsersGridProps> = ({
  queryConstraints = [],
  orgId,
}) => {
  // const { data, status } = useCollectionData<User>('USERS', [...queryConstraints, limit(100)], {
  //   suspense: false,
  // });

  const firestore = useFirestore();

  const q = query(collection(firestore, COLLECTIONS.USERS), where('orgId', '==', orgId));

  // TODO: get orgId dynamically from doc
  // could set pathSegments: [{ value: string, fromDoc?: boolean }]
  // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
  const { data: populateData, status: populateStatus } = useCollectionDataPopulateById(
    q,
    'userId',
    { root: COLLECTIONS.ORGANIZATIONS, pathSegments: [orgId, COLLECTIONS.USER_CLAIMS] },
    { suspense: true, idField: 'id', initialData: [] }
  );

  console.log('POPULATE RESULT: ', populateData);

  const userColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Message' placement='top'>
                <SendRounded />
              </Tooltip>
            }
            onClick={() => alert('button clicked')} // handleResendInvite(params)
            // LinkComponent={Link}
            // to={`mailto:${params.row.email}`}
            // disabled={!params.row.email}
            label='Message'
            // disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
        ],
      },
      displayNameCol,
      firstNameCol,
      lastNameCol,
      emailCol,
      phoneCol,
      {
        field: 'userClaims',
        headerName: 'Roles',
        flex: 1,
        minWidth: 240,
        editable: false,
        valueGetter: (params) => {
          if (!params.value) return [];
          let keys = Object.keys(params.value).filter((k) => k !== '_lastCommitted');
          return keys.map((k) => `${k}:${params.value[k]}`);
          // return keys;
        },
        renderCell: renderChips,
        // renderCell: (params: GridRenderCellParams<any, any, any>) => {
        //   if (params.value) return null;

        //   let claimKeys = Object.keys(params.value);

        //   // @ts-ignore
        //   return renderChips({ value: claimKeys });
        // },
      },
      createdCol,
      updatedCol,
      {
        ...idCol,
        headerName: 'User ID',
      },
      orgIdCol,
    ],
    []
  );

  return (
    <Box>
      <BasicDataGrid
        // @ts-ignore
        rows={populateData}
        columns={userColumns}
        getRowId={(row) => row.userId}
        loading={populateStatus === 'loading'}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              // id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { pageSize: 10 },
        }}
      />
    </Box>
  );
};
