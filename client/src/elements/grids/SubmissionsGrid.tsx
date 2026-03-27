import { Box } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

import { CLAIMS, SUBMISSION_STATUS, ServerDataGridCollectionProps, Submission } from 'common';
import { ServerDataGrid } from 'components';
import { useAsyncToast, useGridActions, useGridShowJson, useWidth } from 'hooks';
import { SUBMISSION_COLUMN_VISIBILITY, statusCol, submissionCols } from 'modules/muiGrid';

export type SubmissionsGridProps = ServerDataGridCollectionProps<Submission, Submission>;

export const SubmissionsGrid = ({
  renderActions = () => [],
  additionalColumns,
  ...props
}: SubmissionsGridProps) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  // const showJson = useShowJson<Submission>(Collection.Enum.submissions);
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);
  const renderShowJson = useGridShowJson(
    'submissions',
    { showInMenu: true },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }
  );

  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });

  const submissionColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 80 : 160,
        getActions: (params: GridRowParams<Submission>) => [
          ...renderActions(params),
          ...renderShowJson(params),
          googleMapsAction(params, { showInMenu: isSmall }),
          floodFactorAction(params, { showInMenu: isSmall }),
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
        editable: iDAdminResult?.hasRequiredClaims,
        filterable: true,
      },
      ...submissionCols,
      ...(additionalColumns || []),
    ],
    [
      googleMapsAction,
      floodFactorAction,
      renderActions,
      renderShowJson,
      additionalColumns,
      iDAdminResult,
      isSmall,
    ]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='submissions'
        columns={submissionColumns}
        density='compact'
        autoHeight
        // TODO: verify "view submission" route exists for all user claim types
        // onCellDoubleClick={}
        initialState={{
          columns: {
            columnVisibilityModel: SUBMISSION_COLUMN_VISIBILITY,
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
};
