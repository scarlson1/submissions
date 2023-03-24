import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { RedoRounded, UndoRounded } from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface HistoryToolbarProps {
  editor?: Editor;
}

export const HistoryToolbar: React.FC<HistoryToolbarProps> = ({ editor }) => {
  const handleUndo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);
  const handleRedo = useCallback(() => {
    editor?.chain().focus().redo().run();
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
        value='undo'
        color='primary'
        aria-label='undo'
        sx={{
          border: 'none !important',
        }}
        onClick={handleUndo}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <UndoRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='redo'
        color='primary'
        aria-label='redo'
        sx={{
          border: 'none !important',
        }}
        onClick={handleRedo}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <RedoRounded fontSize='small' />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
