// import { Box } from '@mui/material';
import {
  GridFilterOperator,
  GridFilterItem,
  GridColDef,
  getGridStringOperators,
  getGridSingleSelectOperators,
  GridCellParams,
  GridFilterInputSingleSelect,
  GridFilterInputMultipleSingleSelect,
} from '@mui/x-data-grid';
import { WhereFilterOp } from 'firebase/firestore';

// TODO: date operators: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/colDef/gridDateOperators.ts

// field exists and is not null of false: where("capital", "!=", false)

const whereFilterOps: WhereFilterOp[] = [
  '<',
  '<=',
  '==',
  '>',
  '>=',
  '!=',
  'array-contains',
  'array-contains-any',
  'in',
  'not-in',
];

export const firestoreGeneralFilter = getGridStringOperators().filter((operator) =>
  whereFilterOps.includes(operator as unknown as WhereFilterOp)
);

export const firestoreStringOperators = getGridStringOperators().filter(
  (operator) => operator.value === '==' || operator.value === '!='
);

export const firestoreNumericOperators = getGridStringOperators().filter(
  (operator) =>
    operator.value === '==' ||
    operator.value === '!=' ||
    operator.value === '>=' ||
    operator.value === '<=' ||
    operator.value === '>' ||
    operator.value === '<'
);

// getSingleSelectOperators: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/colDef/gridSingleSelectOperators.ts

export const firestoreMultiSelectOperators = getGridSingleSelectOperators(); // TODO: custom array-contains operator

export function isObject<TObject = Record<PropertyKey, any>>(value: unknown): value is TObject {
  return typeof value === 'object' && value !== null;
}

const parseObjectValue = (value: unknown) => {
  if (value == null || !isObject<{ value: unknown }>(value)) {
    return value;
  }
  return value.value;
};

export const getGridFirebaseSelectOperators = (): GridFilterOperator[] => [
  {
    label: 'is',
    value: '==',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) === parseObjectValue(filterItem.value);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
  {
    label: 'not',
    value: '!=',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) !== parseObjectValue(filterItem.value);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
  {
    label: 'contains',
    value: 'array-contains',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }): boolean => filterItemValues.includes(parseObjectValue(value));
    },
    InputComponent: GridFilterInputSingleSelect,
  },
  {
    label: 'is any of',
    value: 'array-contains-any',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }): boolean => filterItemValues.includes(parseObjectValue(value));
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
  {
    label: 'in',
    value: 'in',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }) => filterItemValues.some((requiredVal) => parseObjectValue(value));
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
  {
    label: 'not in',
    value: 'not-in',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }) => !filterItemValues.some((requiredVal) => parseObjectValue(value));
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
];

// GRID FILTER INPUT SINGLE SELECT: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/panel/filterPanel/GridFilterInputSingleSelect.tsx

// const ratingColumnType: GridColTypeDef = {
//   extendType: 'number',
//   filterOperators: getGridNumericOperators().filter(
//     (operator) => operator.value === '>' || operator.value === '<',
//   ),
// };

// function SelectInputValue(props: GridFilterInputValueProps) {
//   const { item, applyValue, focusElementRef } = props;

//   const ratingRef: React.Ref<any> = React.useRef(null);
//   React.useImperativeHandle(focusElementRef, () => ({
//     focus: () => {
//       ratingRef.current.querySelector(`input[value="${Number(item.value) || ''}"]`).focus();
//     },
//   }));

//   const handleFilterChange: RatingProps['onChange'] = (event, newValue) => {
//     applyValue({ ...item, value: newValue });
//   };

//   return (
//     <Box
//       sx={{
//         display: 'inline-flex',
//         flexDirection: 'row',
//         alignItems: 'center',
//         height: 48,
//         pl: '20px',
//       }}
//     >
//       <Rating
//         name='custom-rating-filter-operator'
//         placeholder='Filter value'
//         value={Number(item.value)}
//         onChange={handleFilterChange}
//         precision={0.5}
//         ref={ratingRef}
//       />
//     </Box>
//   );
// }

export const arrayContainsOperator: GridFilterOperator = {
  label: 'contains',
  value: 'array-contains',
  getApplyFilterFn: (filterItem: GridFilterItem, column: GridColDef) => {
    if (
      !filterItem.field ||
      !filterItem.value ||
      !filterItem.operator ||
      !filterItem.value.length
    ) {
      return null;
    }

    return (params: GridCellParams): boolean => {
      if (!Array.isArray(params.value)) return false;

      return params.value.includes(filterItem.value);
      // return Number(params.value) >= Number(filterItem.value);
    };
  },
  // InputComponent: RatingInputValue, // TODO: select component
  // InputComponentProps: { type: 'number' },
};

// 'array-contains' 'array-contains-any' 'in' 'not-in'

// export const firestoreDateOperators = getGridDateOperators().filter((operator) => operator.value === '')

// remove operator from starnard ops: https://mui.com/x/react-data-grid/filtering/customization/#remove-an-operator

// create custom operators: https://mui.com/x/react-data-grid/filtering/customization/#create-a-custom-operator

// custom column type example:
// const ratingColumnType: GridColTypeDef = {
//   extendType: 'number',
//   filterOperators: getGridNumericOperators().filter(
//     (operator) => operator.value === '>' || operator.value === '<'
//   ),
// };

// EXAMPLE: WRAP BUILT IN OPERATORS:
// https://mui.com/x/react-data-grid/filtering/customization/#wrap-built-in-operators

// const columns = React.useMemo(() => {
//   /**
//    * Function that takes an operator and wrap it to skip filtering for selected rows.
//    */
//   const wrapOperator = (operator: GridFilterOperator) => {
//     const getApplyFilterFn: GridFilterOperator['getApplyFilterFn'] = (filterItem, column) => {
//       const innerFilterFn = operator.getApplyFilterFn(filterItem, column);
//       if (!innerFilterFn) {
//         return innerFilterFn;
//       }

//       return (params: GridCellParams) => {
//         if (rowSelectionModelLookupRef.current[params.id]) {
//           return true;
//         }

//         return innerFilterFn(params);
//       };
//     };

//     return {
//       ...operator,
//       getApplyFilterFn,
//     };
//   };

//   return data.columns.map((col) => {
//     const filterOperators =
//       col.filterOperators ??
//       defaultColumnTypes[col.type ?? DEFAULT_GRID_COL_TYPE_KEY].filterOperators!;

//     return {
//       ...col,
//       filterOperators: filterOperators.map((operator) => wrapOperator(operator)),
//     };
//   });
// }, [data.columns]);

// CREATE CUSTOM OPERATOR:
// https://mui.com/x/react-data-grid/filtering/customization/#create-a-custom-operator

// const operator: GridFilterOperator = {
//   label: '==',
//   value: '==',
//   getApplyFilterFn: (filterItem: GridFilterItem, column: GridColDef) => {
//     if (!filterItem.field || !filterItem.value || !filterItem.operator) {
//       return null;
//     }

//     return (params: GridCellParams): boolean => {
//       return Number(params.value) >= Number(filterItem.value);
//     };
//   },
//   InputComponent: RatingInputValue,
//   InputComponentProps: { type: 'number' },
// };
