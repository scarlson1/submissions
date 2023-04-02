import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
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
        // TooltipProps={{ title: 'undo' }}
      >
        <Tooltip title='undo' placement='top'>
          <UndoRounded fontSize='small' />
        </Tooltip>
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
        // TooltipProps={{ title: 'redo' }}
      >
        <Tooltip title='redo' placement='top'>
          <RedoRounded fontSize='small' />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

// <TooltipToggleButton
//         size='small'
//         value='undo'
//         color='primary'
//         aria-label='undo'
//         sx={{
//           border: 'none !important',
//         }}
//         onClick={handleUndo}
//         disabled={!editor.can().chain().focus().undo().run()}
//         TooltipProps={{ title: 'undo' }}
//       >
//         <UndoRounded fontSize='small' />
//       </TooltipToggleButton>
//       <TooltipToggleButton
//         size='small'
//         value='redo'
//         color='primary'
//         aria-label='redo'
//         sx={{
//           border: 'none !important',
//         }}
//         onClick={handleRedo}
//         disabled={!editor.can().chain().focus().redo().run()}
//         TooltipProps={{ title: 'redo' }}
//       >
//         <RedoRounded fontSize='small' />
//       </TooltipToggleButton>
