import { Box, Typography, TypographyProps } from '@mui/material';
import { useMemo } from 'react';

import { Address } from 'common';

interface FormattedAddressProps extends TypographyProps {
  address: Partial<Address>;
  line2OverrideProps?: TypographyProps;
}
// TODO:  memo component ??
export function FormattedAddress({
  address,
  line2OverrideProps,
  ...typographyProps
}: FormattedAddressProps) {
  const { addr1, addr2 } = useMemo(() => {
    const addr1 = `${address?.addressLine1 || ''} ${address?.addressLine2 || ''}`.trim();
    const addr2 = `${address?.city ? `${address?.city},` : ''} ${address?.state || ''} ${
      address?.postal
    }`;

    return { addr1, addr2 };
  }, [address]);

  return (
    <Box>
      <Typography {...typographyProps}>{addr1}</Typography>
      <Typography {...typographyProps} {...(line2OverrideProps || {})}>
        {addr2}
      </Typography>
    </Box>
  );
}
