import { cloneElement, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  GridCsvExportOptions,
  GridExportDisplayOptions,
  GridPrintExportOptions,
  useGridApiContext,
} from '@mui/x-data-grid';
import { IconButtonProps } from '@mui/material';

import { GridToolbarExportIconButton } from './GridToolbarExportIconButton';

export interface GridToolbarExportMobileProps extends IconButtonProps {
  csvOptions?: GridCsvExportOptions & GridExportDisplayOptions;
  printOptions?: GridPrintExportOptions & GridExportDisplayOptions;
  [key: string]: any;
}

const GridToolbarExportMobile = forwardRef<HTMLButtonElement, GridToolbarExportMobileProps>(
  function GridToolbarExport(props, ref) {
    const { csvOptions = {}, printOptions = {}, excelOptions, ...other } = props;

    const apiRef = useGridApiContext();

    const preProcessedButtons = apiRef.current
      .unstable_applyPipeProcessors('exportMenu', [], { excelOptions, csvOptions, printOptions })
      .sort((a, b) => (a.componentName > b.componentName ? 1 : -1));

    if (preProcessedButtons.length === 0) {
      return null;
    }

    return (
      <GridToolbarExportIconButton {...other} ref={ref}>
        {preProcessedButtons.map((button, index) => cloneElement(button.component, { key: index }))}
      </GridToolbarExportIconButton>
    );
  }
);

GridToolbarExportMobile.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  csvOptions: PropTypes.object,
  printOptions: PropTypes.object,
} as any;

export { GridToolbarExportMobile };
