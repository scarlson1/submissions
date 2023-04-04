import React, { MouseEvent, useCallback } from 'react';
import {
  Box,
  Chip,
  ChipProps,
  Link,
  Stack,
  Typography,
  Paper,
  Popper,
  IconButton,
} from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';

import { formatPhoneNumber } from 'modules/utils/helpers';
import { useCopyToClipboard } from 'hooks/useCopyToClipboard';
import { CopyAllRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export const renderGridPhone = (params: GridRenderCellParams<any, any, any>) => {
  if (params.value == null) return '';

  return (
    <Link href={`tel:${params.value}`} underline='hover'>
      {formatPhoneNumber(params.value)}
    </Link>
  );
};
export const renderGridEmail = (params: GridRenderCellParams<any, any, any>) => {
  if (params.value == null) return '';

  return (
    <Box
      sx={{ overflow: 'auto', whiteSpace: 'nowrap', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      <Link href={`mailto:${params.value}`} underline='hover' onClick={(e) => e.stopPropagation()}>
        {params.value}
      </Link>
    </Box>
  );
};

export const renderChips = (
  params: GridRenderCellParams<any, any, any>,
  chipProps: ChipProps = {},
  propsGetterFunc: (props: any) => Partial<ChipProps> | void = () => {}
) => {
  if (!params.value || params.value.length < 1) return null;
  return (
    <Stack
      spacing={1}
      direction='row'
      sx={{ overflow: 'auto', whiteSpace: 'nowrap', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {params.value.map((i: string) => (
        <Chip key={i} label={i} size='small' {...chipProps} {...propsGetterFunc(i)} />
      ))}
    </Stack>
  );
};

export const GridCellCopy = ({ value }: { value?: string | number | null }) => {
  const [, copy] = useCopyToClipboard();

  const handleCopy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      copy(value);
      toast.success('Copied!');
    },
    [copy, value]
  );

  if (!value) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '100%' }}>
      <Typography
        variant='body2'
        component='div'
        sx={{
          mr: 1,
          flex: '0 1 auto',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}
      >
        {value}
      </Typography>
      <IconButton size='small' onClick={(e) => handleCopy(e)} sx={{ flex: '0 0 auto' }}>
        <CopyAllRounded fontSize='inherit' />
      </IconButton>
    </Box>
  );
};

interface GridCellExpandProps {
  value: string;
  width: number;
}

function isOverflown(element: Element): boolean {
  return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

const GridCellExpand = React.memo(function GridCellExpand(props: GridCellExpandProps) {
  const { width, value } = props;
  const wrapper = React.useRef<HTMLDivElement | null>(null);
  const cellDiv = React.useRef(null);
  const cellValue = React.useRef(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showFullCell, setShowFullCell] = React.useState(false);
  const [showPopper, setShowPopper] = React.useState(false);

  const handleMouseEnter = () => {
    const isCurrentlyOverflown = isOverflown(cellValue.current!);
    setShowPopper(isCurrentlyOverflown);
    setAnchorEl(cellDiv.current);
    setShowFullCell(true);
  };

  const handleMouseLeave = () => {
    setShowFullCell(false);
  };

  React.useEffect(() => {
    if (!showFullCell) {
      return undefined;
    }

    function handleKeyDown(nativeEvent: KeyboardEvent) {
      // IE11, Edge (prior to using Bink?) use 'Esc'
      if (nativeEvent.key === 'Escape' || nativeEvent.key === 'Esc') {
        setShowFullCell(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShowFullCell, showFullCell]);

  return (
    <Box
      ref={wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        alignItems: 'center',
        lineHeight: '24px',
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
      }}
    >
      <Box
        ref={cellDiv}
        sx={{
          height: '100%',
          width,
          display: 'block',
          position: 'absolute',
          top: 0,
        }}
      />
      <Box
        ref={cellValue}
        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {value}
      </Box>
      {showPopper && (
        <Popper
          open={showFullCell && anchorEl !== null}
          anchorEl={anchorEl}
          style={{ width, marginLeft: -17 }}
        >
          <Paper elevation={1} style={{ minHeight: wrapper.current!.offsetHeight - 3 }}>
            <Typography variant='body2' style={{ padding: 8 }}>
              {value}
            </Typography>
          </Paper>
        </Popper>
      )}
    </Box>
  );
});

export function renderCellExpand(params: GridRenderCellParams<string>) {
  return <GridCellExpand value={params.value || ''} width={params.colDef.computedWidth} />;
}
