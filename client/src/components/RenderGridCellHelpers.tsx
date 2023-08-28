import { CopyAllRounded } from '@mui/icons-material';
import {
  Box,
  Chip,
  ChipProps,
  IconButton,
  Link,
  Paper,
  Popper,
  Stack,
  Tooltip,
  Typography,
  TypographyProps,
} from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';
import { MouseEvent, memo, useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  dollarFormat,
  dollarFormat2,
  formatPhoneNumber,
  percentFormat,
} from 'modules/utils/helpers';
import { useKeyPress, useCopyToClipboard } from 'hooks';

export const renderGridPhone = ({ value }: GridRenderCellParams<any, any, any>) => {
  if (value == null) return '';

  return (
    <Link href={`tel:${value}`} underline='hover'>
      {formatPhoneNumber(value)}
    </Link>
  );
};

export const renderGridEmail = ({ value }: GridRenderCellParams<any, any, any>) => {
  if (!value) return null; // ''

  return (
    <Box
      sx={{ overflow: 'auto', whiteSpace: 'nowrap', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      <Link href={`mailto:${value}`} underline='hover' onClick={(e) => e.stopPropagation()}>
        {value}
      </Link>
    </Box>
  );
};

export const renderChips = (
  params: GridRenderCellParams<any, any, any>,
  chipProps: ChipProps = {},
  propsGetterFunc: (
    props: any,
    params: GridRenderCellParams<any, any, any>
  ) => Partial<ChipProps> | void = () => {}
) => {
  if (!params.value || params.value.length < 1) return null;

  return (
    <Stack
      spacing={1}
      direction='row'
      sx={{ overflow: 'auto', whiteSpace: 'nowrap', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {params.value.map((i: string) => (
        <Chip key={i} label={i} size='small' {...chipProps} {...propsGetterFunc(i, params)} />
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

  if (value === undefined || value === null) return null;

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

// TODO: use for formatted address
const GridCellExpand = memo(function GridCellExpand({ width, value }: GridCellExpandProps) {
  const wrapper = useRef<HTMLDivElement | null>(null);
  const cellDiv = useRef(null);
  const cellValue = useRef(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showFullCell, setShowFullCell] = useState(false);
  const [showPopper, setShowPopper] = useState(false);

  const handleMouseEnter = () => {
    const isCurrentlyOverflown = isOverflown(cellValue.current!);
    setShowPopper(isCurrentlyOverflown);
    setAnchorEl(cellDiv.current);
    setShowFullCell(true);
  };

  const handleMouseLeave = () => {
    setShowFullCell(false);
  };

  useKeyPress('Escape', () => setShowFullCell(false));

  // useEffect(() => {
  //   if (!showFullCell) {
  //     return undefined;
  //   }

  //   function handleKeyDown(nativeEvent: KeyboardEvent) {
  //     if (nativeEvent.key === 'Escape' || nativeEvent.key === 'Esc') {
  //       setShowFullCell(false);
  //     }
  //   }

  //   document.addEventListener('keydown', handleKeyDown);

  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [setShowFullCell, showFullCell]);

  if (!value) return null;

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

export function renderCellExpand({ value, colDef }: GridRenderCellParams<any>) {
  return <GridCellExpand value={value || ''} width={colDef.computedWidth} />;
}

export function renderFormattedValue({
  value,
  formattedValue,
}: GridRenderCellParams<any, any, any>) {
  if (!formattedValue && formattedValue !== 0) return null;
  return (
    <Tooltip title={`${value}`} placement='left'>
      <Typography variant='body2'>{formattedValue}</Typography>
    </Tooltip>
  );
}

export function renderNumber(
  { value }: GridRenderCellParams<any, any, any>,
  typographyProps?: TypographyProps
) {
  if (!value && value !== 0) return null;

  return (
    <Typography variant='body2' {...typographyProps}>
      {value}
    </Typography>
  );
}

export function renderCurrency(
  { value }: GridRenderCellParams<any, any, any>,
  withDecimals: boolean = true,
  typographyProps?: TypographyProps
) {
  if (!value && value !== 0) return null;

  const maskFn = withDecimals ? dollarFormat2 : dollarFormat;
  return (
    <Typography variant='body2' {...typographyProps}>
      {maskFn(value)}
    </Typography>
  );
}

export function renderPercent(
  { value }: GridRenderCellParams<any, any, any>,
  round?: number,
  typographyProps?: TypographyProps
) {
  if (!value && value !== 0) return null;

  const actual = typeof value === 'number' ? `${value * 100}%` : 'NaN';

  return (
    <Tooltip title={actual} placement='right'>
      <Typography variant='body2' {...typographyProps}>
        {percentFormat(value, round)}
      </Typography>
    </Tooltip>
  );
}

export function renderChip(
  { value }: GridRenderCellParams<any, any, any>,
  chipProps: ChipProps = {},
  propsGetterFunc: (props: any) => Partial<ChipProps> | void = () => {}
) {
  if (!value) return null;
  return <Chip label={value} size='small' {...chipProps} {...propsGetterFunc({ value })} />;
}

export function renderSplitSnakeCase(
  { value }: GridRenderCellParams<any, any, any>,
  props?: TypographyProps
) {
  if (!value || typeof value !== 'string') return null;

  return (
    <Typography variant='body2' {...(props || {})}>
      {value.split('_').join(' ')}
    </Typography>
  );
}

export const renderJoinArray = (
  { value }: GridRenderCellParams<any, any, any>,
  typographyProps?: Partial<TypographyProps>
) => {
  if (!value || !Array.isArray(value)) return null;

  return (
    <Box>
      {value.map((v) => (
        <Typography variant='body2' {...(typographyProps || {})}>
          {v}
        </Typography>
      ))}
    </Box>
  );
};
