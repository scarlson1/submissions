import { useMemo } from 'react';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import {
  AGENCY_SUBMISSION_STATUS,
  addrCityCol,
  addrLine1Col,
  addrLine2Col,
  addrPostalCol,
  addrStateCol,
  addressSummaryCol,
  createdCol,
  emailCol,
  fileLinkCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgNameCol,
  phoneCol,
  statusCol,
  updatedCol,
} from 'common';
import { Box } from '@mui/material';

export interface AgencyAppsGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
}

export function AgencyAppsGrid({
  renderActions, // = () => [],
  additionalColumns,
  ...props
}: AgencyAppsGridProps) {
  const agencyAppColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 100,
        getActions: (params: GridRowParams) => [...(renderActions ? renderActions(params) : [])],
      },
      { ...idCol, headerName: 'Doc ID' },
      orgNameCol,
      {
        ...statusCol,
        valueOptions: [
          AGENCY_SUBMISSION_STATUS.ACCECPTED,
          AGENCY_SUBMISSION_STATUS.REJECTED,
          AGENCY_SUBMISSION_STATUS.REVIEW_REQUIRED,
          AGENCY_SUBMISSION_STATUS.SUBMITTED,
        ],
        filterable: true,
      },
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 180,
        flex: 1,
        editable: false,
        filterable: false,
        valueGetter: (params) => `${params.row.contact.firstName} ${params.row.contact.lastName}`,
      },
      {
        ...firstNameCol,
        field: 'contact.firstName',
        headerName: 'Contact First Name',
        valueGetter: (params: GridValueGetterParams<any, any>) =>
          params.row.contact?.firstName || null,
      },
      {
        ...lastNameCol,
        field: 'contact.lastName',
        headerName: 'Contact Last Name',
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        ...emailCol,
        field: 'contact.email',
        headerName: 'Contact Email',
        valueGetter: (params) => params.row.contact?.email || null,
      },
      {
        ...phoneCol,
        field: 'contact.phone',
        headerName: 'Contact Phone',
        valueGetter: (params) => params.row.contact?.phone || null,
      },
      addressSummaryCol,
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      {
        ...fileLinkCol,
        field: 'EandO',
        headerName: 'E & O',
      },
      {
        field: 'FEIN',
        headerName: 'FEIN',
        minWidth: 120,
        flex: 1,
        editable: false,
      },
      createdCol,
      updatedCol,
      ...(additionalColumns || []),
    ],
    [additionalColumns, renderActions] // handleApprove, handleResendInvite, authCheck
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        collName='AGENCY_APPLICATIONS'
        columns={agencyAppColumns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              actions: Boolean(renderActions),
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'contact.firstName': false,
              'contact.lastName': false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
}
