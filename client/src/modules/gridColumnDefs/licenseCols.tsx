import { GridColDef } from '@mui/x-data-grid';
import { BusinessRounded, PersonRounded } from '@mui/icons-material';

import {
  addressSummaryCol,
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  phoneCol,
  stateCol,
  updatedCol,
} from './gridColumns';
import { renderChip } from 'components/RenderGridCellHelpers';

export const licenseCols: GridColDef[] = [
  {
    ...idCol,
    headerName: 'Doc ID',
  },
  stateCol,
  {
    field: 'ownerType',
    headerName: 'Owner Type',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    renderCell: (params) =>
      renderChip(params, { size: 'small' }, (val: any) => ({
        color: val === 'individual' ? 'primary' : 'success',
        icon: val === 'individual' ? <PersonRounded /> : <BusinessRounded />,
      })),
  },
  {
    field: 'licensee',
    headerName: 'Licensee',
    minWidth: 200,
    flex: 1,
    editable: false,
    // renderCell: (params) => (
    //   <Typography variant='body2' fontWeight='medium'>
    //     {params.value}
    //   </Typography>
    // ),
  },
  {
    field: 'licenseType',
    headerName: 'License Type',
    minWidth: 120,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'licenseNumber',
    headerName: 'License Number',
    minWidth: 160,
    flex: 1,
    editable: false,
  },
  booleanCalcActiveCol,
  effectiveDateCol,
  expirationDateCol,
  addressSummaryCol,
  phoneCol,
  {
    field: 'surplusLinesProducerOfRecord',
    headerName: 'SL Producer of Record',
    description: 'TODO: tooltip description',
    minWidth: 180,
    flex: 1,
    editable: false,
    type: 'boolean',
  },
  {
    field: 'SLAssociationMembershipRequired',
    headerName: 'Asc. Mem. Required',
    description: 'TODO: tooltip description',
    minWidth: 160,
    flex: 0.8,
    editable: false,
    type: 'boolean',
  },
  createdCol,
  updatedCol,
];
