import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  FormatAlignCenterRounded,
  FormatAlignJustifyRounded,
  FormatAlignLeftRounded,
  FormatAlignRightRounded,
} from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface TextAlignToolbarProps {
  editor?: Editor;
}

export const TextAlignToolbar: React.FC<TextAlignToolbarProps> = ({ editor }) => {
  const isLeftAlign = editor?.isActive({ textAlign: 'left' });
  const isRightAlign = editor?.isActive({ textAlign: 'right' });
  const isCenterAlign = editor?.isActive({ textAlign: 'center' });
  const isJustifyAlign = editor?.isActive({ textAlign: 'justify' });

  const handleSectionFormat = useCallback(
    (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
      console.log('NEW ALIGNMENT: ', newAlignment);
      editor?.chain().focus().setTextAlign(newAlignment).run();
    },
    [editor]
  );

  const sectionFormats = useMemo(() => {
    if (isLeftAlign) return 'left';
    if (isRightAlign) return 'right';
    if (isCenterAlign) return 'center';
    if (isJustifyAlign) return 'justify';
    return 'left';
  }, [isLeftAlign, isRightAlign, isCenterAlign, isJustifyAlign]);

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
      <ToggleButton
        size='small'
        value='left'
        color='primary'
        aria-label='align left'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatAlignLeftRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='center'
        color='primary'
        aria-label='align center'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatAlignCenterRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='right'
        color='primary'
        aria-label='align right'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatAlignRightRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='justify'
        color='primary'
        aria-label='align justify'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatAlignJustifyRounded fontSize='small' />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
