import { Box } from '@mui/material';

import { ReceivablesGrid } from 'elements/grids';
import { adminReceivableCols } from 'modules/muiGrid/gridColumnDefs';

export const Receivables = () => {
  return (
    <Box>
      <ReceivablesGrid additionalColumns={adminReceivableCols} />
    </Box>
  );
};
