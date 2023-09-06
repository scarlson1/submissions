import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { QueryFieldFilterConstraint } from 'firebase/firestore';

import { GridToolbarExportButton } from './GridToolbarExportButton';

export const GridToolbar = (props: {
  colname: string;
  constraints?: QueryFieldFilterConstraint[];
}) => {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExportButton />
    </GridToolbarContainer>
  );
};
