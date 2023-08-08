import { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGridProps, GridColDef, GridRowParams, useGridApiRef } from '@mui/x-data-grid';

import { BasicDataGrid } from 'components';
import { PolicyLocation } from 'common';
import { useAsyncToast, useGridActions, useWidth } from 'hooks';
import { locationCols } from 'modules/muiGrid/gridColumnDefs';

// TODO: handle > 100 locations
// TODO: limit viewable columns depending on permissions

interface LocationsGridProps extends Omit<DataGridProps, 'rows' | 'columns' | 'initialState'> {
  locations: PolicyLocation[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
  initialState?: Omit<DataGridProps['initialState'], 'pagination'>;
}

export const LocationsGrid = ({
  locations,
  renderActions = () => [],
  ...props
}: LocationsGridProps) => {
  const apiRef = useGridApiRef();
  // const { currentRows, paginationModel, handlePaginationModelChange } =
  //   useControlledGridPagination(locations);
  // const { sortModel, handleSortModelChange } = useControlledGridSort(apiRef, props?.initialState);
  // TODO: use useReducer to handle sorting and filtering
  // ref: https://github.com/TarikHuber/material-ui-filter/blob/master/src/store/selectors.js
  // const [{ rows, sortedRows }, dispatch] = useReducer(controlledGridReducer, {
  //   rows: locations,
  //   modRows: locations,
  // });

  const toast = useAsyncToast({ position: 'top-right' });
  const { isSmall } = useWidth();
  const { googleMapsAction, floodFactorAction } = useGridActions(toast.error);

  const locationColumns = useMemo(
    () => [
      // TODO: add request edit button, etc.
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 100,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          googleMapsAction(params, { showInMenu: isSmall }),
          floodFactorAction(params, { showInMenu: isSmall }),
        ],
      },
      ...locationCols,
    ],
    [renderActions, googleMapsAction, floodFactorAction, isSmall]
  );

  return (
    <Box>
      <BasicDataGrid
        apiRef={apiRef}
        rows={locations || []}
        columns={locationColumns}
        // rowCount={locations.length || 0}
        pageSizeOptions={[5, 10, 25, 100]}
        // paginationMode='server'
        // paginationModel={paginationModel}
        // onPaginationModelChange={handlePaginationModelChange}
        // sortingMode='server'
        // sortModel={sortModel}
        // onSortModelChange={handleSortModelChange}
        // sortingOrder={['desc', 'asc', null]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              product: false,
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'address.countyName': false,
              'address.countyFIPS': false,
              coordinates: false,
              latitude: false,
              longitude: false,
              annualPremium: false,
              'ratingPropertyData.CBRSDesignation': false,
              'ratingPropertyData.basement': false,
              'ratingPropertyData.distToCoastFeet': false,
              'ratingPropertyData.floodZone': false,
              'ratingPropertyData.numStories': false,
              'ratingPropertyData.propertyCode': false,
              'ratingPropertyData.sqFootage': false,
              'ratingPropertyData.yearBuilt': false,
              'ratingPropertyData.replacementCost': false,
              'ratingPropertyData.ratingDocId': false,
              ratingDocId: false,
              externalId: false,
              'metadata.created': false,
              'metadata.updated': false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 5 } },
        }}
        {...props}
      />
    </Box>
  );
};

// export const getPageCount = (rowCount: number, pageSize: number): number => {
//   if (pageSize > 0 && rowCount > 0) {
//     return Math.ceil(rowCount / pageSize);
//   }

//   return 0;
// };
// export const getValidPage = (page: number, pageCount = 0): number => {
//   if (pageCount === 0) {
//     return page;
//   }

//   return Math.max(Math.min(page, pageCount - 1), 0);
// };

// const getCurrentRows = (rows: any[], page: number, pageSize: number) => {
//   const startIndex = page * pageSize;
//   return rows.slice(startIndex, startIndex + pageSize);
// };

// const useControlledGridPagination = <T = any,>(rows: T[]) => {
//   const [paginationModel, setPaginationModel] = useState({
//     page: 0,
//     pageSize: 3,
//   });
//   const [currentRows, setCurrentRows] = useState<T[]>(getCurrentRows(rows, 0, 3));
//   const rowCount = useMemo(() => rows.length || 0, [rows]);

//   const handlePaginationModelChange = useCallback(
//     (newModel: GridPaginationModel, details: GridCallbackDetails<any>) => {
//       let model = paginationModel;
//       const pageCount = getPageCount(rowCount, newModel?.pageSize ?? model.pageSize);

//       if (newModel && (model.page !== newModel?.page || model.pageSize !== newModel?.pageSize)) {
//         model = newModel;
//       }

//       const validPage = getValidPage(model.page, pageCount);
//       if (validPage !== model.page) {
//         model = { ...model, page: validPage };
//       }

//       let newRows = getCurrentRows(rows, model.page, model.pageSize);

//       setPaginationModel(model);
//       setCurrentRows(newRows);
//     },
//     [rowCount, rows, paginationModel]
//   );

//   return { paginationModel, currentRows, handlePaginationModelChange };
// };

// const useControlledGridSort = (
//   apiRef: MutableRefObject<GridApiCommunity>,
//   initialState?: GridInitialState | undefined
// ) => {
//   const [sortModel, setSortModel] = useState<GridSortModel>(initialState?.sorting?.sortModel || []);

//   const handleSortModelChange = useCallback(
//     (sortModel: GridSortModel) => setSortModel(sortModel),
//     []
//   );
//   // https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/sorting/useGridSorting.ts
//   // const applySorting = useCallback<GridSortApi['applySorting']>(() => {
//   //   apiRef.current.setState((state) => {
//   //     if (props.sortingMode === 'server') {
//   //       logger.debug('Skipping sorting rows as sortingMode = server');
//   //       return {
//   //         ...state,
//   //         sorting: {
//   //           ...state.sorting,
//   //           sortedRows: getTreeNodeDescendants(
//   //             gridRowTreeSelector(apiRef),
//   //             GRID_ROOT_GROUP_ID,
//   //             false
//   //           ),
//   //         },
//   //       };
//   //     }

//   //     const sortModel = gridSortModelSelector(state, apiRef.current.instanceId);
//   //     const sortRowList = buildAggregatedSortingApplier(sortModel, apiRef);
//   //     const sortedRows = apiRef.current.applyStrategyProcessor('sorting', {
//   //       sortRowList,
//   //     });

//   //     return {
//   //       ...state,
//   //       sorting: { ...state.sorting, sortedRows },
//   //     };
//   //   });

//   //   apiRef.current.publishEvent('sortedRowsSet');
//   //   apiRef.current.forceUpdate();
//   // }, [apiRef]);

//   return { sortModel, handleSortModelChange };
// };

// type GridActionTypes = 'ADD_FILTER' | 'REMOVE_FILTER' | 'SOMETHING ELSE';

// type GridReducerActions = Record<'type', GridActionTypes>;

/* // = { type: 'ADD_FILTER' } | { type: 'REMOVE_FILTER' } */

// export function controlledGridReducer(state: any = {}, action: GridReducerActions) {
//   switch (action.type) {
//     case 'ADD_FILTER':
//       return state;
//     default:
//       return state;
//   }
// }
