import { SaveAltRounded } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { useGridApiContext, useGridRootProps } from '@mui/x-data-grid';
import { collection } from 'firebase/firestore';
import { useCallback, useMemo } from 'react';
import { useFirestore } from 'reactfire';
import invariant from 'tiny-invariant';

import { useGridCsvExport, useWidth } from 'hooks';

export const GridToolbarExportButton = () => {
  const { isMobile } = useWidth();
  const rootProps = useGridRootProps();
  const apiRef = useGridApiContext();
  const firestore = useFirestore();
  const colname = rootProps.slotProps?.toolbar?.colname;
  const constraints = rootProps.slotProps?.toolbar?.constraints;
  invariant(colname && constraints, 'grid toolbar missing colname or constraints prop');
  const collectionRef = collection(firestore, colname);
  const { exportDataAsCsv } = useGridCsvExport(apiRef, collectionRef, constraints);

  const csvOptions = useMemo(() => rootProps.slotProps?.toolbar?.csvOptions, [rootProps]);

  const handleExport = useCallback(
    () => exportDataAsCsv(csvOptions),
    [exportDataAsCsv, csvOptions]
  );

  if (isMobile) {
    return (
      <IconButton
        size='small'
        color='primary'
        aria-label={apiRef.current.getLocaleText('toolbarExportLabel')}
        {...rootProps.slotProps?.baseIconButton}
        onClick={handleExport}
      >
        <SaveAltRounded fontSize='inherit' />
      </IconButton>
    );
  }

  return (
    <Button
      size='small'
      color='primary'
      aria-label={apiRef.current.getLocaleText('toolbarExportLabel')}
      startIcon={<SaveAltRounded />}
      {...rootProps.slotProps?.baseButton}
      onClick={handleExport}
    >
      {apiRef.current.getLocaleText('toolbarExport')}
    </Button>
  );
};
