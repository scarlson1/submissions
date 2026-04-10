import { Collection } from '@idemand/common';
import { POLICY_COLUMN_VISIBILITY } from 'modules/muiGrid';
import { versionCols, versionIdCol } from 'modules/muiGrid/gridColumnDefs';
import { PoliciesGrid, PoliciesGridProps } from './PoliciesGrid';

// TODO: show diff action button

const POLICY_VERSIONS_VISIBILITY = {
  ...POLICY_COLUMN_VISIBILITY,
  'metadata.versionCreated': true,
  id: true,
  actions: false,
};

interface PolicyVersionsGridProps extends PoliciesGridProps {
  policyId: string;
}

export const PolicyVersionsGrid = ({
  policyId,
  ...props
}: PolicyVersionsGridProps) => {
  return (
    <PoliciesGrid
      {...props}
      pathSegments={[policyId, Collection.Enum.versions]}
      idCol={versionIdCol}
      additionalColumns={versionCols}
      initialState={{
        columns: {
          columnVisibilityModel: POLICY_VERSIONS_VISIBILITY,
        },
        sorting: {
          sortModel: [{ field: 'metadata.versionCreated', sort: 'desc' }],
        },
        pagination: { paginationModel: { page: 0, pageSize: 10 } },
      }}
    />
  );
};
