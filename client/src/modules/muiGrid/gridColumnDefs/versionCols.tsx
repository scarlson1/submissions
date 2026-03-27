import { Typography } from '@mui/material';
import { GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';
import { formatFirestoreTimestamp, formatGridFirestoreTimestampAsDate } from 'modules/utils';
import { getGridFirestoreDateOperators } from '../operators';
import { idCol } from './gridColumns';

export const versionIdCol = {
  ...idCol,
  headerName: 'Version',
  minWidth: 100,
};

export const versionCols = [
  {
    field: 'metadata.versionCreated',
    headerName: 'Version Created',
    type: 'date',
    minWidth: 160,
    flex: 0.8,
    editable: false,
    sortable: true,
    filterOperators: getGridFirestoreDateOperators(),
    valueGetter: (params: GridValueGetterParams) => params.row.metadata?.versionCreated || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
    renderCell: (params: GridRenderCellParams<any, any, any>) => {
      if (!(params.value && params.value.seconds)) return null;
      return (
        <Typography variant='body2' color='text.secondary'>
          {formatFirestoreTimestamp(params.value)}
        </Typography>
      );
    },
  },
];
