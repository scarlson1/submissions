import { Box, SxProps, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export const Item = ({
  label,
  value,
  containerSx,
}: {
  label: string;
  value: ReactNode; // string;
  containerSx?: SxProps;
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        ...containerSx,
      }}
    >
      <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
        {label}
      </Typography>
      <Typography
        color='text.secondary'
        lineHeight={1.8}
        fontSize={13}
        fontWeight='fontWeightMedium'
        sx={{ ml: 3 }}
        align='right'
        component='div'
      >
        {value}
      </Typography>
    </Box>
  );
};
