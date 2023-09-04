import { DataObjectRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

import { COLLECTIONS, CLAIMS, SUBMISSION_STATUS, Submission } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useAsyncToast, useGridActions, useShowJson, useWidth } from 'hooks';
import { statusCol, submissionCols } from 'modules/muiGrid/gridColumnDefs';

export interface SubmissionsGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'colName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
}

export const SubmissionsGrid = ({
  renderActions = () => [],
  additionalColumns,
  ...props
}: SubmissionsGridProps) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  const showJson = useShowJson<Submission>(COLLECTIONS.SUBMISSIONS);
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);

  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

  const submissionColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 80 : 160,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: isSmall }),
          floodFactorAction(params, { showInMenu: isSmall }),
          <GridActionsCellItem
            icon={
              <Tooltip title='show JSON' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
            label='Show JSON'
            disabled={!iDAdminResult.hasRequiredClaims}
            showInMenu // showInMenu={isSmall}
          />,
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
      handleShowJson,
      renderActions,
      additionalColumns,
      iDAdminResult,
      isSmall,
    ]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='SUBMISSIONS'
        columns={submissionColumns}
        density='compact'
        autoHeight
        // TODO: make "view submission" route exists for all user claim types
        // onCellDoubleClick={}
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'address.countyName': false,
              'address.countyFIPS': false,
              'limits.limitA': false,
              'limits.limitB': false,
              'limits.limitC': false,
              'limits.limitD': false,
              latitude: false,
              longitude: false,
              'AALs.inland': false,
              'AALs.surge': false,
              'AALs.tsunami': false,
              'metadata.updated': false,
              'ratingPropertyData.replacementCost': false,
              'ratingPropertyData.propertyCode': false,
              'ratingPropertyData.yearBuilt': false,
              'ratingPropertyData.sqFootage': false,
              'ratingPropertyData.numStories': false,
              'ratingPropertyData.basement': false,
              'ratingPropertyData.distToCoastFeet': false,
              'ratingPropertyData.CBRSDesignation': false,
              'ratingPropertyData.floodZone': false,
              'ratingPropertyData.priorLossCount': false,
              propertyDataDocId: false,
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
};
