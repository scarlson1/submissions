import { Button } from '@mui/material';
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  useGridApiContext,
  useGridRootProps,
} from '@mui/x-data-grid';
import { QueryFieldFilterConstraint, collection } from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';
import { SaveAltRounded } from '@mui/icons-material';

import { useGridCsvExport } from 'hooks';

export const GridToolbar = ({
  colname,
  constraints,
}: {
  colname: string;
  constraints?: QueryFieldFilterConstraint[];
}) => {
  const { slotProps } = useGridRootProps();
  const apiRef = useGridApiContext();
  const firestore = useFirestore();
  const collectionRef = collection(firestore, colname);
  const { exportDataAsCsv } = useGridCsvExport(apiRef, collectionRef, constraints);
  const csvOptions = slotProps?.toolbar?.csvOptions;

  const handleExport = useCallback(
    () => exportDataAsCsv(csvOptions),
    [exportDataAsCsv, csvOptions]
  );

  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <Button
        onClick={handleExport}
        startIcon={<SaveAltRounded />}
        size='small'
        color='primary'
        aria-label={apiRef.current.getLocaleText('toolbarExportLabel')}
      >
        {apiRef.current.getLocaleText('toolbarExport')}
      </Button>
    </GridToolbarContainer>
  );
};
