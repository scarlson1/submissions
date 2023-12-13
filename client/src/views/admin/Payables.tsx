import { Box } from '@mui/material';

import { PayablesGrid } from 'elements/grids';
import { adminPayableCols } from 'modules/muiGrid/gridColumnDefs';

export const Payables = () => {
  return (
    <Box>
      <PayablesGrid additionalColumns={adminPayableCols} />
    </Box>
  );
};
