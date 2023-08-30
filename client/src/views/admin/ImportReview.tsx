import { Box } from '@mui/material';
import { useMemo } from 'react';

import { COLLECTIONS, ImportSummary } from 'common';
import { useDocData, useSafeParams } from 'hooks';
import { ServerDataGrid } from 'components';
import {
  policyStagingRecordCols,
  quoteStagingRecordCols,
  transactionStagingRecordCols,
} from 'modules/muiGrid/gridColumnDefs';

interface ImportReviewComponentProps {
  importId: string;
  importType: string;
}

export const ImportReviewComponent = ({ importId, importType }: ImportReviewComponentProps) => {
  // TODO: admin grid actions (approve selected, etc.)
  // action button top right of grid (custom toolbar) to approve/decline all (call cloud function and batch imports ??)

  const props = useMemo(() => {
    switch (importType) {
      case COLLECTIONS.POLICIES:
        return {
          columns: policyStagingRecordCols,
        };
      case COLLECTIONS.TRANSACTIONS:
        return {
          columns: transactionStagingRecordCols,
        };
      case COLLECTIONS.QUOTES:
        return {
          columns: quoteStagingRecordCols,
        };
      default:
        return {};
    }
  }, [importType]);

  if (!props.columns) throw new Error('importType not matched');

  return (
    <Box>
      <ServerDataGrid
        collName='DATA_IMPORTS'
        pathSegments={[importId, COLLECTIONS.STAGED_RECORDS]}
        {...props}
      />
    </Box>
  );
};

// fetch import review doc by id, so we know the import type
export const ImportReview = () => {
  const { importId } = useSafeParams(['importId']);
  const { data } = useDocData<ImportSummary>('DATA_IMPORTS', importId);

  return <ImportReviewComponent importId={importId} importType={data.importCollection} />;
};
