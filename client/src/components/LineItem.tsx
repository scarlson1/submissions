import { Box, Divider, Typography, TypographyProps } from '@mui/material';
import { dollarFormat2 } from 'modules/utils/helpers';

export interface LineItemProps {
  label: string;
  value: number;
  labelTypographyProps?: TypographyProps;
  valueTypographyProps?: TypographyProps;
  withDivider?: boolean;
  formatVal?: (val: string | number) => string | number | null;
}

export const LineItem = ({
  label,
  value,
  labelTypographyProps,
  valueTypographyProps,
  withDivider = true,
  formatVal = dollarFormat2,
}: LineItemProps) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          py: 1,
          px: 3,
        }}
      >
        <Typography
          variant='body2'
          color='text.secondary'
          {...labelTypographyProps}
          sx={{ flex: '1 0 auto', lineHeight: 1.6, ...labelTypographyProps?.sx }}
        >
          {label}
        </Typography>
        <Typography
          variant='subtitle2'
          {...valueTypographyProps}
          sx={{ flex: '0 0 auto', lineHeight: 1.6, ...valueTypographyProps?.sx }}
        >
          {formatVal ? formatVal(value) : value}
        </Typography>
      </Box>
      {withDivider && <Divider />}
    </>
  );
};
