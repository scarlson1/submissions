import { Box } from '@mui/material';
import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { PolicyClaim } from '@idemand/common';
import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useClaims, useWidth } from 'hooks';
import { getClaimsQueryProps } from 'modules/db/query';
import { CLAIM_COLUMN_VISIBILITY, claimCols } from 'modules/muiGrid';
import { verify } from 'modules/utils';
import { createPath, ROUTES } from 'router';

interface ClaimsGridProps extends ServerDataGridCollectionProps {
  policyId?: string;
}

export const ClaimsGrid = ({
  renderActions,
  additionalColumns,
  initialState,
  policyId,
  constraints: propConstraints = [],
  ...rest
}: ClaimsGridProps) => {
  const { user, claims, orgId } = useClaims();
  const { isSmall } = useWidth();
  const navigate = useNavigate();

  const handleRowClick = useCallback(
    (params: GridRowParams<PolicyClaim & { id: string }>) => {
      if (!params.row.policyId || !params.id) return;
      navigate(
        createPath({
          path: ROUTES.CLAIM_VIEW,
          params: {
            policyId: params.row.policyId,
            claimId: params.id.toString(),
          },
        }),
      );
    },
    [navigate],
  );

  verify(user?.uid, 'must be signed in');

  const columns = useMemo(() => {
    let cols = [...claimCols, ...(additionalColumns || [])];
    if (renderActions) {
      const actionCol: GridActionsColDef = {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 120,
        getActions: (params: GridRowParams) => [...renderActions(params)],
      };
      cols.unshift(actionCol);
    }
    return cols;
  }, [additionalColumns, renderActions, isSmall]);

  const props = useMemo<Omit<ServerDataGridProps<PolicyClaim>, 'columns'>>(
    () => getClaimsQueryProps(user, claims, policyId, propConstraints),
    [policyId, propConstraints, claims, user, orgId],
  );

  return (
    <Box>
      <ServerDataGrid
        {...props}
        columns={columns}
        autoHeight
        onRowClick={handleRowClick}
        sx={{ cursor: 'pointer' }}
        initialState={{
          columns: {
            columnVisibilityModel: CLAIM_COLUMN_VISIBILITY,
          },
          sorting: {
            sortModel: [{ field: 'occurrenceDate', sort: 'desc' }],
          },
          ...initialState,
        }}
        {...rest}
      />
    </Box>
  );
};
