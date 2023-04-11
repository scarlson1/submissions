import React, { useMemo } from 'react';
import { SendRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';

import {
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
import { QueryConstraint, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';

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
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip title='Cancel' placement='top'>
          //       <CancelRounded />
          //     </Tooltip>
          //   }
          //   onClick={() => handleCancel(params)}
          //   label='Cancel'
          //   disabled={params.row.status !== INVITE_STATUS.PENDING}
          // />,
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
