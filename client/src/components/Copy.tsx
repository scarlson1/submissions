import { useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { Box, BoxProps, IconButton, Typography, TypographyProps } from '@mui/material';
import { CopyAllRounded } from '@mui/icons-material';

import { useCopyToClipboard } from 'hooks/useCopyToClipboard';

export interface CopyProps extends BoxProps {
  children: React.ReactNode;
  value?: string | number | null;
  withButton?: boolean;
  textProps?: TypographyProps;
}

export const Copy = ({
  children,
  value,
  withButton = true,
  textProps = {},
  ...props
}: CopyProps) => {
  const [, copy] = useCopyToClipboard();

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      copy(value);
      toast.success('Copied!');
    },
    [copy, value]
  );

  if (!value) return <>{children}</>;

  return (
    <Box
      {...props}
      sx={{ display: 'flex', alignItems: 'center', maxWidth: '100%', ...(props?.sx || {}) }}
    >
      <Box
        onClick={handleCopy}
        sx={{ minWidth: 0, flex: '1 1 auto', '&:hover': { cursor: 'pointer' } }}
      >
        <Typography
          variant='body2'
          color='text.secondary'
          {...textProps}
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...(textProps?.sx || {}),
          }}
        >
          {children}
        </Typography>
      </Box>
      {withButton ? (
        <IconButton size='small' onClick={(e) => handleCopy(e)} sx={{ flex: '0 0 auto' }}>
          <CopyAllRounded fontSize='inherit' />
        </IconButton>
      ) : null}
    </Box>
  );
};
