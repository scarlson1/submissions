import type { WithId } from '@idemand/common';
import {
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridCellParams,
  GridCsvExportOptions,
  GridRowId,
} from '@mui/x-data-grid';
import {
  buildWarning,
  GridApiCommunity,
  GridStateColDef,
  serializeCellValue,
} from '@mui/x-data-grid/internals';
import { MutableRefObject } from 'react';

// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/export/serializers/csvSerializer.ts

function sanitizeCellValue(value: any, delimiterCharacter: string) {
  if (typeof value === 'string') {
    // Make sure value containing delimiter or line break won't be split into multiple rows
    if (
      [delimiterCharacter, '\n', '\r', '"'].some((delimiter) =>
        value.includes(delimiter),
      )
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  return value;
}

type CSVRowOptions = {
  delimiterCharacter: string;
  sanitizeCellValue?: (value: any, delimiterCharacter: string) => any;
};
class CSVRow {
  options: CSVRowOptions;

  rowString = '';

  isEmpty = true;

  constructor(options: CSVRowOptions) {
    this.options = options;
  }

  addValue(value: string) {
    if (!this.isEmpty) {
      this.rowString += this.options.delimiterCharacter;
    }
    if (value === null || value === undefined) {
      this.rowString += '';
    } else if (typeof this.options.sanitizeCellValue === 'function') {
      this.rowString += this.options.sanitizeCellValue(
        value,
        this.options.delimiterCharacter,
      );
    } else {
      this.rowString += value;
    }
    this.isEmpty = false;
  }

  getRowString() {
    return this.rowString;
  }
}

const objectFormattedValueWarning = buildWarning([
  'MUI: When the value of a field is an object or a `renderCell` is provided, the CSV export might not display the value correctly.',
  'You can provide a `valueFormatter` with a string representation to be used.',
]);

const serializeRow = ({
  id,
  columns,
  getCellParams,
  delimiterCharacter,
  ignoreValueFormatter,
  serverRows,
}: {
  id: GridRowId;
  columns: GridStateColDef[];
  getCellParams: (id: GridRowId, field: string, rows: any[]) => GridCellParams;
  delimiterCharacter: string;
  ignoreValueFormatter: boolean;
  serverRows: any[];
}) => {
  const row = new CSVRow({ delimiterCharacter });

  columns.forEach((column) => {
    const cellParams = getCellParams(id, column.field, serverRows); // TODO: need to replace b/c not using value from grid (server response)
    if (import.meta.env.NODE_ENV !== 'production') {
      if (String(cellParams.formattedValue) === '[object Object]') {
        objectFormattedValueWarning();
      }
    }
    row.addValue(
      serializeCellValue(cellParams, {
        csvOptions: {
          delimiter: delimiterCharacter,
          shouldAppendQuotes: false,
          escapeFormulas: true,
        },
        ignoreValueFormatter,
      }),
    );
  });

  return row.getRowString();
};

interface BuildCSVOptions<T> {
  columns: GridStateColDef[];
  // rowIds: GridRowId[];
  rowData: WithId<T>[];
  delimiterCharacter: NonNullable<GridCsvExportOptions['delimiter']>;
  includeHeaders: NonNullable<GridCsvExportOptions['includeHeaders']>;
  // includeColumnGroupsHeaders: NonNullable<GridCsvExportOptions['includeColumnGroupsHeaders']>;
  ignoreValueFormatter: boolean;
  apiRef: MutableRefObject<GridApiCommunity>;
  getCellParams: (
    id: GridRowId,
    field: string,
    serverRows: any[],
  ) => GridCellParams;
}

export function buildCSV<T>(options: BuildCSVOptions<T>): string {
  const {
    columns,
    // rowIds,
    rowData,
    delimiterCharacter,
    includeHeaders,
    // includeColumnGroupsHeaders,
    ignoreValueFormatter,
    // apiRef,
    getCellParams,
  } = options;

  const CSVBody = rowData // rowIds
    .reduce<string>(
      (acc, row) =>
        `${acc}${serializeRow({
          id: row.id,
          columns,
          getCellParams, // : apiRef.current.getCellParams,
          delimiterCharacter,
          ignoreValueFormatter,
          serverRows: rowData,
        })}\r\n`,
      '',
    )
    .trim();

  if (!includeHeaders) {
    return CSVBody;
  }

  const filteredColumns = columns.filter(
    (column) => column.field !== GRID_CHECKBOX_SELECTION_COL_DEF.field,
  );

  const headerRows: CSVRow[] = [];

  // if (includeColumnGroupsHeaders) {
  //   const columnGroupLookup = apiRef.current.unstable_getAllGroupDetails();

  //   let maxColumnGroupsDepth = 0;
  //   const columnGroupPathsLookup = filteredColumns.reduce<
  //     Record<GridStateColDef['field'], GridColumnGroup['groupId'][]>
  //   >((acc, column) => {
  //     const columnGroupPath = apiRef.current.unstable_getColumnGroupPath(column.field);
  //     acc[column.field] = columnGroupPath;
  //     maxColumnGroupsDepth = Math.max(maxColumnGroupsDepth, columnGroupPath.length);
  //     return acc;
  //   }, {});

  //   for (let i = 0; i < maxColumnGroupsDepth; i += 1) {
  //     const headerGroupRow = new CSVRow({ delimiterCharacter, sanitizeCellValue });
  //     headerRows.push(headerGroupRow);
  //     filteredColumns.forEach((column) => {
  //       const columnGroupId = (columnGroupPathsLookup[column.field] || [])[i];
  //       const columnGroup = columnGroupLookup[columnGroupId];
  //       headerGroupRow.addValue(columnGroup ? columnGroup.headerName || columnGroup.groupId : '');
  //     });
  //   }
  // }

  const mainHeaderRow = new CSVRow({ delimiterCharacter, sanitizeCellValue });
  filteredColumns.forEach((column) => {
    mainHeaderRow.addValue(column.headerName || column.field);
  });
  headerRows.push(mainHeaderRow);

  const CSVHead = `${headerRows.map((row) => row.getRowString()).join('\r\n')}\r\n`;

  return `${CSVHead}${CSVBody}`.trim();
}
