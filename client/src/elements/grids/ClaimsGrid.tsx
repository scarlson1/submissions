import { Box } from '@mui/material';
import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { useMemo } from 'react';

import { Collection, PolicyClaim } from '@idemand/common';
import { ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useClaims, useWidth } from 'hooks';
import { CLAIM_COLUMN_VISIBILITY, claimCols } from 'modules/muiGrid';
import { verify } from 'modules/utils';

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

  const props: Omit<ServerDataGridProps<PolicyClaim>, 'columns'> = useMemo(() => {
    let queryProps: Omit<ServerDataGridProps<PolicyClaim>, 'columns'>;
    let constraints: ServerDataGridProps<PolicyClaim>['constraints'] = [
      ...propConstraints,
    ];

    if (policyId) {
      queryProps = {
        colName: 'policies',
        pathSegments: [policyId, Collection.Enum.claims],
        isCollectionGroup: false,
      };
    } else {
      queryProps = {
        colName: 'claims',
        isCollectionGroup: true,
      };

      if (claims?.iDemandAdmin) {
        // no additional constraint — admin sees all
      } else if (claims?.orgAdmin) {
        constraints.push(where('agency.orgId', '==', orgId));
      } else if (claims?.agent) {
        constraints.push(where('agent.userId', '==', user?.uid));
      } else {
        constraints.push(where('submittedBy.userId', '==', user?.uid));
      }
    }

    return { ...queryProps, constraints };
  }, [policyId, propConstraints, claims, user, orgId]);

  return (
    <Box>
      <ServerDataGrid
        {...props}
        columns={columns}
        autoHeight
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
