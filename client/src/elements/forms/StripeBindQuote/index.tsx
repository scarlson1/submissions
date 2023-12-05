import { Box } from '@mui/material';

import { useSafeParams } from 'hooks';
import { BindQuoteWizard } from './BindQuoteWizard';

const StripeBindQuote = () => {
  const { quoteId } = useSafeParams(['quoteId']);

  return (
    <Box>
      <BindQuoteWizard quoteId={quoteId} />
    </Box>
  );
};

export default StripeBindQuote;
