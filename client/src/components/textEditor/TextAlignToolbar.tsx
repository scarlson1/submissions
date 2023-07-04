import { useCallback, useMemo } from 'react';

import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import {
  FormatAlignCenterRounded,
  FormatAlignJustifyRounded,
  FormatAlignLeftRounded,
  FormatAlignRightRounded,
} from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

interface Alignment {
  value: string;
  icon: React.ReactNode;
}

const ALIGNMENTS: Alignment[] = [
  {
    value: 'left',
    icon: <FormatAlignLeftRounded fontSize='small' />,
  },
  {
    value: 'center',
    icon: <FormatAlignCenterRounded fontSize='small' />,
  },
  {
    value: 'right',
    icon: <FormatAlignRightRounded fontSize='small' />,
  },
  {
    value: 'justify',
    icon: <FormatAlignJustifyRounded fontSize='small' />,
  },
];

export interface TextAlignToolbarProps {
  editor?: Editor;
}

export const TextAlignToolbar = ({ editor }: TextAlignToolbarProps) => {
  const isLeftAlign = editor?.isActive({ textAlign: 'left' });
  const isRightAlign = editor?.isActive({ textAlign: 'right' });
  const isCenterAlign = editor?.isActive({ textAlign: 'center' });
  const isJustifyAlign = editor?.isActive({ textAlign: 'justify' });

  const sectionFormats = useMemo(() => {
    if (isLeftAlign) return 'left';
    if (isRightAlign) return 'right';
    if (isCenterAlign) return 'center';
    if (isJustifyAlign) return 'justify';
    return 'left';
  }, [isLeftAlign, isRightAlign, isCenterAlign, isJustifyAlign]);

  const handleSectionFormat = useCallback(
    (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
      console.log('NEW ALIGNMENT: ', newAlignment);
      editor?.chain().focus().setTextAlign(newAlignment).run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <ToggleButtonGroup
      value={sectionFormats}
      onChange={handleSectionFormat}
      exclusive
      size='small'
      color='primary'
      aria-label='text formatting'
      sx={toggleButtonGroupStyle}
    >
      {ALIGNMENTS.map(({ value, icon }) => (
        <Tooltip title={`align ${value}`} key={value} placement='top'>
          <ToggleButton
            size='small'
            value={value}
            color='primary'
            aria-label={`align ${value}`}
            sx={{
              border: 'none !important',
            }}
          >
            {icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};

// <Tooltip title='align left'>
//   <ToggleButton
//     size='small'
//     value='left'
//     color='primary'
//     aria-label='align left'
//     sx={{
//       border: 'none !important',
//     }}
//   >
//     <FormatAlignLeftRounded fontSize='small' />
//   </ToggleButton>
// </Tooltip>
// <ToggleButton
//   size='small'
//   value='center'
//   color='primary'
//   aria-label='align center'
//   sx={{
//     border: 'none !important',
//   }}
// >
//   <FormatAlignCenterRounded fontSize='small' />
// </ToggleButton>
// <ToggleButton
//   size='small'
//   value='right'
//   color='primary'
//   aria-label='align right'
//   sx={{
//     border: 'none !important',
//   }}
// >
//   <FormatAlignRightRounded fontSize='small' />
// </ToggleButton>
// <ToggleButton
//   size='small'
//   value='justify'
//   color='primary'
//   aria-label='align justify'
//   sx={{
//     border: 'none !important',
//   }}
// >
//   <FormatAlignJustifyRounded fontSize='small' />
// </ToggleButton>
