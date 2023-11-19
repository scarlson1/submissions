import { SendRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import {
  GridActionsCellItem,
  GridActionsCellItemProps,
  GridColDef,
  GridRowParams,
} from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

import { QUOTE_STATUS, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { hasAdminClaimsValidator } from 'components/RequireAuthReactFire';
import {
  useAsyncToast,
  useClaims,
  useGridActions,
  useSendQuoteNotification,
  useWidth,
} from 'hooks';
import { QUOTE_COLUMN_VISIBILITY, quoteCols, statusCol } from 'modules/muiGrid';

// TODO: need to use custom merge function for additionalColumns to prevent duplication "field" values

export type QuotesGridProps = ServerDataGridCollectionProps;

export const QuotesGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: QuotesGridProps) => {
  const { claims } = useClaims();
  const { isSmall } = useWidth();
  const sendNotifications = useSendQuoteNotification();
  const toast = useAsyncToast({ position: 'top-right' });
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);

  const { data: authCheckResult } = useSigninCheck({
    validateCustomClaims: hasAdminClaimsValidator,
  });

  const handleSendNotifications = useCallback(
    (params: GridRowParams) => () => {
      sendNotifications(params.id as string);
    },
    [sendNotifications]
  );

  // pass in renderActions ??
  const getAdminActions = useCallback(
    (params: GridRowParams, adminActionProps?: Partial<GridActionsCellItemProps>) => {
      if (!authCheckResult.hasRequiredClaims) return [];
      return [
        // @ts-ignore // TODO: type props
        <GridActionsCellItem
          icon={
            <Tooltip placement='top' title='Send Notifications'>
              <SendRounded />
            </Tooltip>
          }
          onClick={handleSendNotifications(params)}
          label='Send Notifications'
          disabled={params.row?.status !== QUOTE_STATUS.AWAITING_USER}
          {...adminActionProps}
        />,
      ];
    },
    [authCheckResult, handleSendNotifications]
  );

  const quoteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 80 : 140,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: true }),
          floodFactorAction(params, { showInMenu: true }),
          ...getAdminActions(params, { showInMenu: isSmall }),
        ],
      },
      {
        ...statusCol,
        valueOptions: [
          QUOTE_STATUS.BOUND,
          QUOTE_STATUS.CANCELLED,
          QUOTE_STATUS.EXPIRED,
          QUOTE_STATUS.AWAITING_USER,
        ],
        editable: Boolean(claims?.iDemandAdmin),
        filterable: true,
      },
      ...quoteCols,
      ...additionalColumns,
    ],
    [
      renderActions,
      getAdminActions,
      googleMapsAction,
      floodFactorAction,
      additionalColumns,
      isSmall,
      claims,
    ]
  );

  return (
    <Box sx={{ height: { xs: 500, sm: 560, md: 600 }, width: '100%' }}>
      <ServerDataGrid
        colName='quotes'
        columns={quoteColumns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: QUOTE_COLUMN_VISIBILITY,
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
          ...initialState,
        }}
        {...props}
      />
    </Box>
  );
};
