import {
  GridCellModes,
  GridCellParams,
  GridCsvExportOptions,
  GridRowId,
  GridTreeNodeWithRender,
  gridFilterModelSelector,
  gridFocusCellSelector,
  gridRowSelectionStateSelector,
  gridSortModelSelector,
  gridTabIndexCellSelector,
} from '@mui/x-data-grid';
import { MissingRowIdError } from '@mui/x-data-grid/hooks/features/rows/useGridParamsApi';
import { GridApiCommunity, getColumnsToExport } from '@mui/x-data-grid/internals';
import {
  CollectionReference,
  DocumentData,
  QueryFieldFilterConstraint,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { get } from 'lodash';
import { MutableRefObject, useCallback } from 'react';
import invariant from 'tiny-invariant';

import {
  buildCSV,
  getFirestoreFilters,
  getFirestoreSortOps,
  getOrderByIfNecessary,
} from 'modules/muiGrid';
import { saveDownload } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';

const useGridParamsApiServerValues = (apiRef: MutableRefObject<GridApiCommunity>) => {
  const getCellValue = useCallback(
    (id: GridRowId, field: string, rowModel: any) => {
      const colDef = apiRef.current.getColumn(field);

      if (!colDef || !colDef.valueGetter) {
        if (!rowModel) {
          throw new MissingRowIdError(`No row with id ${id} found`);
        }
        return get(rowModel, field) || null;
      }

      return colDef.valueGetter({
        row: rowModel,
        value: get(rowModel, field),
        field,
        colDef,
        cellMode: GridCellModes.View,
        id,
        api: apiRef.current,
        hasFocus: false,
        tabIndex: -1,
        rowNode: null as unknown as GridTreeNodeWithRender,
      });
    },
    [apiRef]
  );

  const getCellParams = useCallback(
    // <GridParamsApi['getCellParams']>
    (id: GridRowId, field: string, serverRows: any[]): GridCellParams => {
      const colDef = apiRef.current.getColumn(field);
      // const value = apiRef.current.getCellValue(id, field);
      // const row = apiRef.current.getRow(id);
      const rowNode = null; // apiRef.current.getRowNode(id);
      const row = serverRows.find((row) => row.id === id);
      const value = getCellValue(id, field, row);

      if (!row)
        // || !rowNode
        throw new MissingRowIdError(`No row with id #${id} found`);

      const cellFocus = gridFocusCellSelector(apiRef);
      const cellTabIndex = gridTabIndexCellSelector(apiRef);

      const params: GridCellParams<any, any, any, any> = {
        id,
        field,
        row,
        rowNode,
        colDef,
        cellMode: apiRef.current.getCellMode(id, field),
        hasFocus: cellFocus !== null && cellFocus.field === field && cellFocus.id === id,
        tabIndex: cellTabIndex && cellTabIndex.field === field && cellTabIndex.id === id ? 0 : -1,
        value,
        formattedValue: value,
        isEditable: false,
      };
      if (colDef && colDef.valueFormatter) {
        params.formattedValue = colDef.valueFormatter({
          id,
          field: params.field,
          value: params.value,
          api: apiRef.current,
        });
      }
      params.isEditable = false; // colDef && apiRef.current.isCellEditable(params);

      return params;
    },
    [apiRef, getCellValue]
  );

  return getCellParams;
};

// export selected, if selected, otherwise export all
const getSortModel = (apiRef: MutableRefObject<GridApiCommunity>) => gridSortModelSelector(apiRef);
const getFilterModel = (apiRef: MutableRefObject<GridApiCommunity>) =>
  gridFilterModelSelector(apiRef);

const getExportQueryConstraints = (
  apiRef: MutableRefObject<GridApiCommunity>,
  constraints: QueryFieldFilterConstraint[] = []
) => {
  // TODO: reuse functions in filter and sort ?? (not inside grid context --> need pro license ??)
  const filters = getFirestoreFilters(getFilterModel(apiRef));
  const sortOps = getFirestoreSortOps(getSortModel(apiRef));
  const orderByConstraint = getOrderByIfNecessary(constraints);

  return [...filters, ...constraints, ...orderByConstraint, ...sortOps];
};

// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/export/useGridCsvExport.tsx

export const useGridCsvExport = <T extends DocumentData = DocumentData>(
  apiRef: MutableRefObject<GridApiCommunity>,
  collectionRef: CollectionReference<T>,
  constraints: QueryFieldFilterConstraint[] = []
  // props: Pick<DataGridProcessedProps, 'unstable_ignoreValueFormatterDuringExport'>
) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const getCellParams = useGridParamsApiServerValues(apiRef);

  const getExportData = useCallback(
    async (options: GridCsvExportOptions = {}) => {
      try {
        // TODO: process constraints passed as prop
        // const orderByConstraint = getOrderByIfNecessary(constraints);
        console.log('constraints:', constraints);
        let qConstraints = getExportQueryConstraints(apiRef, constraints);
        const selected = gridRowSelectionStateSelector(apiRef.current.state);

        let docIds: GridRowId[] = [];
        if (options.getRowsToExport) {
          docIds = options.getRowsToExport({ apiRef });
        } else if (selected.length) {
          docIds = selected;
        }
        // BUG: inequality filter property and first sort order must be the same: __key__ and metadata.created
        // if (docIds.length) qConstraints.push(where(documentId(), 'in', docIds));
        // 'in' query cannot have another orderBy query after it
        // https://github.com/googleapis/nodejs-firestore/issues/1472#issuecomment-819007435
        if (docIds.length) {
          qConstraints = qConstraints.filter((c) => c.type !== 'orderBy');
          qConstraints.push(where(documentId(), 'in', docIds));
        }

        let q = query(collectionRef, ...qConstraints);
        let querySnap = await getDocs(q);
        if (querySnap.empty) throw new Error('no records found');

        return querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
      } catch (err: any) {
        console.log('Export error: ', err);
        let errMsg = 'an error occurred';
        if (err?.message) errMsg += ` ${err.message}`;
        toast.error(errMsg);
        throw err;
      }
    },
    [apiRef, collectionRef, constraints, toast]
  );

  const getDataAsCsv = useCallback(
    async (options: GridCsvExportOptions = {}) => {
      const exportData = await getExportData(options);
      if (!exportData) {
        console.log('export data undefined');
        return;
      }
      const exportedColumns = getColumnsToExport({
        apiRef,
        options,
      });

      // const getRowsToExport = options.getRowsToExport ?? defaultGetRowsToExport;
      // const exportedRowIds = getRowsToExport({ apiRef });

      // need to pass custom getCellParams function to get rows with server response values
      return buildCSV({
        columns: exportedColumns,
        // rowIds: exportedRowIds,
        rowData: exportData,
        delimiterCharacter: options.delimiter || ',',
        includeHeaders: options.includeHeaders ?? true,
        // includeColumnGroupsHeaders: options.includeColumnGroupsHeaders ?? true,
        ignoreValueFormatter: false,
        apiRef,
        getCellParams,
      });
    },
    [apiRef, getCellParams, getExportData]
  );

  const exportDataAsCsv = useCallback(
    async (options: GridCsvExportOptions = {}) => {
      const csv = await getDataAsCsv(options);
      invariant(csv);

      const blob = new Blob([options?.utf8WithBom ? new Uint8Array([0xef, 0xbb, 0xbf]) : '', csv], {
        type: 'text/csv',
      });

      saveDownload([blob], `${options?.fileName || 'iDemand_export'}.csv`);
      // exportAs(blob, 'csv', options?.fileName);
    },
    [getDataAsCsv]
  );

  return { getDataAsCsv, exportDataAsCsv };
  // return useMemo(() => ({
  //   getDataAsCsv
  // }), [getDataAsCsv ]);
};
