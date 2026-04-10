import { useCallback } from 'react';

import { RedoRounded, UndoRounded } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Editor } from '@tiptap/react';

import { toggleButtonGroupStyle } from './common';

export interface HistoryToolbarProps {
  editor?: Editor;
}

export const HistoryToolbar = ({ editor }: HistoryToolbarProps) => {
  const handleUndo = useCallback(() => {
    // @ts-expect-error
    editor?.chain().focus().undo().run();
  }, [editor]);
  const handleRedo = useCallback(() => {
    // @ts-expect-error
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
        // @ts-expect-error
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
        // @ts-expect-error
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
