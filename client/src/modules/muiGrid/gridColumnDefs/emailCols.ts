import { GridColDef, type GridValueGetterParams } from '@mui/x-data-grid';

import { renderChips } from 'components';
import {
  getGridFirestoreDateOperators,
  getGridFirestoreStringOperators,
} from 'modules/muiGrid/operators';
import {
  createdCol,
  emailCol,
  emailTypeCol,
  idCol,
  resendEmailIdCol,
  sendgridEventCol,
} from './gridColumns';

export const emailCols: GridColDef[] = [
  idCol,
  // emailCol,
  { ...emailCol, field: 'from' },
  { ...emailCol, field: 'to' },
  {
    ...sendgridEventCol,
    field: 'status',
    valueGetter: (params) => params.row.status || null,
  },
  emailTypeCol,
  resendEmailIdCol,
  {
    field: 'subject',
    headerName: 'Subject',
    type: 'string',
    minWidth: 160,
    flex: 1,
    editable: false,
    filterOperators: getGridFirestoreStringOperators(),
  },
  {
    field: 'tags',
    headerName: 'Tags',
    minWidth: 180,
    flex: 1,
    editable: false,
    filterable: false,
    sortable: false,
    disableExport: true,
    valueGetter: (params) => {
      Object.entries(params.row.tags).map((k, v) => `${k}: ${v}`) || null;
    },
    // valueFormatter: ({ value }) => {
    //   if (Array.isArray(value) && value.length)
    //     return value
    //       .map(
    //         (ai: AdditionalInsured) =>
    //           `${ai.name}${ai.email ? ` (${ai.email})` : ''}`,
    //       )
    //       .join('  |  ');
    //   return value;
    // },
    renderCell: (params) =>
      renderChips(params, {
        variant: 'outlined',
        // color: 'success',
      }),
  },
  // ipCol,
  createdCol,
  {
    field: 'created_at',
    headerName: 'Created',
    type: 'date',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    filterOperators: getGridFirestoreDateOperators(),
    valueGetter: (params: GridValueGetterParams<any, any>) =>
      params.row.created_at || null,
    // valueParser: (
    //   value: any,
    //   params?: GridCellParams<any, any, any, GridTreeNode> | undefined,
    // ) => {
    //   // console.log('VAL SETTER: ', value, params);
    //   if (!value) return null;
    //   console.log('is date: ', isDate(value));
    //   if (isDate(value)) return Timestamp.fromDate(new Date(value));
    //   return value;
    // },
    // valueFormatter: formatGridFirestoreTimestamp,
    // valueFormatter: formatGridFirestoreTimestampAsDate,
    // renderCell: (params: GridRenderCellParams<any, any, any>) => {
    //   if (!(params.value && params.value.seconds)) return null;
    //   return (
    //     <Typography variant='body2' color='text.secondary'>
    //       {formatFirestoreTimestamp(params.value)}
    //     </Typography>
    //   );
    // },
  },
];
