import { Link } from '@mui/material';
import { GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';

import { renderGridEmail, renderGridPhone } from 'components';
import { GridCellCopy } from 'components';
import { formatGridFirestoreTimestamp } from 'modules/utils';
import { ADMIN_ROUTES, createPath } from 'router';

export const idCol = {
  field: 'id',
  headerName: 'ID',
  flex: 1,
  minWidth: 200,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const emailCol = {
  field: 'email',
  headerName: 'Email',
  flex: 1,
  minWidth: 180,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridEmail(params),
};

export const phoneCol = {
  field: 'phone',
  headerName: 'Phone',
  minWidth: 160,
  flex: 1,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridPhone(params),
};

export const firstNameCol = {
  field: 'firstName',
  headerName: 'First Name',
  flex: 0.8,
  minWidth: 120,
  editable: false,
};

export const lastNameCol = {
  field: 'lastName',
  headerName: 'Last Name',
  flex: 0.8,
  minWidth: 120,
  editable: false,
};

export const displayNameCol = {
  field: 'displayName',
  headerName: 'Name',
  flex: 1,
  minWidth: 180,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => {
    if (params.value) return params.value;
    if (params.row.firstName || params.row.lastName)
      return `${params.row.firstName} ${params.row.lastName}`.trim();
    return null;
  },
};

export const createdCol = {
  field: 'metadata.created',
  headerName: 'Created',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.created || null,
  valueFormatter: formatGridFirestoreTimestamp,
};

export const updatedCol = {
  field: 'metadata.updated',
  headerName: 'Updated',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.updated || null,
  valueFormatter: formatGridFirestoreTimestamp,
};

export const orgIdCol = {
  field: 'orgId',
  headerName: 'Org ID',
  flex: 1,
  minWidth: 200,
  editable: false,
  // renderCell: (params: GridValueGetterParams<any, any>) => {
  //   if (!params.value) return null;
  //   return (
  //     <Link
  //       component={RouterLink} // TODO: non admin route
  //       to={createPath({ path: ADMIN_ROUTES.ORGANIZATION, params: { orgId: params.value } })}
  //       // to={`/orgs/${params.value}`}
  //       // to={createPath({
  //       //   path: ADMIN_ROUTES.SUBMISSION_VIEW,
  //       //   params: { submissionId: params.value },
  //       // })}
  //     >
  //       <GridCellCopy value={params.value} />
  //     </Link>
  //   );
  // },
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    return <GridCellCopy value={params.value} />;
  },
};
