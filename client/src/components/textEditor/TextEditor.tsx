import React, { useCallback } from 'react';
import { EditorContent, JSONContent } from '@tiptap/react';
import { Box, Button, Paper } from '@mui/material';
import { toast } from 'react-hot-toast';

import { useTextEditor } from 'hooks';
import { EditorToolbar } from './EditorToolbar';
import './TextEditor.css';

// get JSON/HTML to save to db & display in non-edit mode: https://tiptap.dev/guide/output
// TODO: set up converter to also store data as HTML ?? in case need to switch to different editor in the future

// sandbox: https://codesandbox.io/s/github/OscarDantas/tiptap-react/tree/main/?file=/src/components/Tiptap.tsx

export interface TextEditorProps {
  onSave?: (content: JSONContent) => void;
  placeholder?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({ onSave }) => {
  const editor = useTextEditor({});

  const handleSave = useCallback(() => {
    if (!onSave) return toast.error('Missing save function');
    const json = editor?.getJSON();
    if (!json) return toast.error('No content to save');

    return onSave(json);
  }, [editor, onSave]);

  return (
    <Box>
      <Box sx={{ py: 2, display: 'flex' }}>
        <Box sx={{ flex: '1 1 auto' }}>
          <EditorToolbar editor={editor} />
        </Box>
        {onSave && (
          <Box sx={{ flex: '0 0 auto', pl: 3 }}>
            <Button variant='contained' size='small' onClick={handleSave}>
              Save
            </Button>
          </Box>
        )}
      </Box>
      <Paper sx={{ p: { xs: 3, sm: 3, md: 5 } }}>
        <EditorContent editor={editor} />
      </Paper>
    </Box>
  );
};
