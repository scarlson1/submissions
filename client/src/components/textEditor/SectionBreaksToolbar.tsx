import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { HorizontalRuleRounded, InsertPageBreakRounded } from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface SectionBreaksToolbarProps {
  editor?: Editor;
}

export const SectionBreaksToolbar: React.FC<SectionBreaksToolbarProps> = ({ editor }) => {
  const handleDivider = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);
  const handleBreak = useCallback(() => {
    editor?.chain().focus().setHardBreak().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <ToggleButtonGroup
      size='small'
      color='primary'
      aria-label='text formatting'
      sx={toggleButtonGroupStyle}
    >
      <ToggleButton
        size='small'
        value='divider'
        color='primary'
        aria-label='divider'
        sx={{
          border: 'none !important',
        }}
        onClick={handleDivider}
      >
        <HorizontalRuleRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='hardBreak'
        color='primary'
        aria-label='hardBreak'
        sx={{
          border: 'none !important',
        }}
        onClick={handleBreak}
      >
        <InsertPageBreakRounded fontSize='small' />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
