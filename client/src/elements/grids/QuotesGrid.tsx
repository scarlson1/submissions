import { SendRounded } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

import { QUOTE_STATUS, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid } from 'components';
import { hasAdminClaimsValidator } from 'components/RequireAuthReactFire';
import { useAuth } from 'context';
import { useAsyncToast, useGridActions, useSendQuoteNotification, useWidth } from 'hooks';
import { quoteCols, statusCol } from 'modules/muiGrid/gridColumnDefs';

// TODO: need to use custom merge function for additionalColumns to prevent duplication "field" values

export type QuotesGridProps = ServerDataGridCollectionProps;

export const QuotesGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: QuotesGridProps) => {
  const { claims } = useAuth();
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

  // TODO: create getActions() helper func to get actions depending on permissions (instead of disabling)

  const quoteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 140,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: true }),
          floodFactorAction(params, { showInMenu: true }),
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Send Notifications'>
                <SendRounded />
              </Tooltip>
            }
            onClick={handleSendNotifications(params)}
            label='Send Notifications'
            disabled={!authCheckResult.hasRequiredClaims}
            showInMenu={isSmall}
          />,
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
      handleSendNotifications,
      additionalColumns,
      renderActions,
      isSmall,
      authCheckResult,
      claims,
      googleMapsAction,
      floodFactorAction,
    ]
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='QUOTES'
        columns={quoteColumns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              annualPremium: false,
              'namedInsured.firstName': false,
              'namedInsured.lastName': false,
              'namedInsured.email': false,
              'namedInsured.phone': false,
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'address.countyName': false,
              'address.countyFIPS': false,
              'metadata.updated': false,
              'agent.phone': false,
              'agent.userId': false,
              'ratingPropertyData.replacementCost': false,
              'ratingPropertyData.CBRSDesignation': false,
              'ratingPropertyData.basement': false,
              'ratingPropertyData.distToCoastFeet': false,
              'ratingPropertyData.floodZone': false,
              'ratingPropertyData.numStories': false,
              'ratingPropertyData.propertyCode': false,
              'ratingPropertyData.sqFootage': false,
              'ratingPropertyData.yearBuilt': false,
              'agency.address': false,
            },
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
