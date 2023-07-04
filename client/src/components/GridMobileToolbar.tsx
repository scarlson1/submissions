import { forwardRef } from 'react';
import { GridToolbarContainer, GridToolbarProps, useGridRootProps } from '@mui/x-data-grid';

import { GridToolbarColumnsIconButton } from './GridToolbarColumnsIconButton';
import { GridToolbarFilterIconButton } from './GridToolbarFilterIconButton';
import { GridToolbarDensityIconButton } from './GridToolbarDensityIconButton';
import { GridToolbarExportMobile } from './GridToolbarExportMobile';

export const GridMobileToolbar = forwardRef<HTMLDivElement, GridToolbarProps>(
  function GridMobileToolbar(props, ref) {
    const {
      className,
      csvOptions,
      printOptions,
      excelOptions,
      showQuickFilter = false,
      // quickFilterProps = {},
      ...other
    } = props;
    const rootProps = useGridRootProps();

    if (
      rootProps.disableColumnFilter &&
      rootProps.disableColumnSelector &&
      rootProps.disableDensitySelector &&
      !showQuickFilter
    ) {
      return null;
    }

    return (
      <GridToolbarContainer ref={ref} {...other}>
        <GridToolbarColumnsIconButton />
        <GridToolbarFilterIconButton />
        <GridToolbarDensityIconButton />
        <GridToolbarExportMobile
          csvOptions={csvOptions}
          printOptions={printOptions}
          excelOptions={excelOptions}
        />
      </GridToolbarContainer>
    );
  }
);
