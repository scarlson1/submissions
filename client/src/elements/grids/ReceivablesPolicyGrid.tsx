import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { QueryFieldFilterConstraint, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';

import type { Receivable, WithId } from '@idemand/common';
import { ServerDataGrid } from 'components';
import { ReceivableDetailDrawer } from 'elements/ReceivableDetailDrawer';
import { useClaims } from 'hooks';
import {
  USER_RECEIVABLE_COLUMN_VISIBILITY,
  userReceivableCols,
} from 'modules/muiGrid/gridColumnDefs';
import { verify } from 'modules/utils';

interface ReceivablesPolicyGridProps {
  /** Scope to a single policy. Takes priority over orgId scoping. */
  policyId?: string;
}

export const ReceivablesPolicyGrid = ({ policyId }: ReceivablesPolicyGridProps) => {
  const { claims, user, orgId } = useClaims();
  const [selectedReceivable, setSelectedReceivable] =
    useState<WithId<Receivable> | null>(null);

  verify(user?.uid, 'must be signed in');

  const { colName, pathSegments, isCollectionGroup, constraints } =
    useMemo(() => {
      if (policyId) {
        return {
          colName: 'receivables' as const,
          pathSegments: undefined,
          isCollectionGroup: false,
          constraints: [where('policyId', '==', policyId)],
        };
      }

      const baseConstraints: QueryFieldFilterConstraint[] = [];
      if (!claims?.iDemandAdmin) {
        if (orgId) {
          baseConstraints.push(where('orgId', '==', orgId));
        } else {
          // Fallback: scope to user if no orgId available
          baseConstraints.push(where('policyId', '==', '__none__'));
        }
      }

      return {
        colName: 'receivables' as const,
        pathSegments: undefined,
        isCollectionGroup: false,
        constraints: baseConstraints,
      };
    }, [policyId, claims, orgId]);

  const columns = useMemo(() => {
    const actionCol: GridActionsColDef = {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 80,
      getActions: () => [],
    };
    return [actionCol, ...userReceivableCols];
  }, []);

  return (
    <>
      <ServerDataGrid
        colName={colName}
        pathSegments={pathSegments}
        isCollectionGroup={isCollectionGroup}
        constraints={constraints}
        columns={columns}
        density='compact'
        autoHeight
        onRowClick={(params) =>
          setSelectedReceivable(params.row as WithId<Receivable>)
        }
        slotProps={{
          toolbar: { csvOptions: { allColumns: false } },
        }}
        initialState={{
          columns: {
            columnVisibilityModel: USER_RECEIVABLE_COLUMN_VISIBILITY,
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
      />
      <ReceivableDetailDrawer
        open={!!selectedReceivable}
        receivable={selectedReceivable}
        onClose={() => setSelectedReceivable(null)}
      />
    </>
  );
};
