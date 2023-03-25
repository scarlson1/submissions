import React from 'react';
import { Editor } from '@tiptap/react';
import { Box, Divider, Paper } from '@mui/material';

import { HistoryToolbar } from './HistoryToolbar';
import { TextFormatToolbar } from './TextFormatToolbar';
import { SectionFormatToolbar } from './SectionFormatToolbar';
import { SectionBreaksToolbar } from './SectionBreaksToolbar';
import { TypographyToolbar } from './TypographyToolbar';
import { FontFamilyToolbar } from './FontFamilyToolbar';
import { FontSizeToolbar } from './FontSizeToolbar';
import { TextAlignToolbar } from './TextAlignToolbar';
import { TextColorToolbar } from './TextColorToolbar';

export interface EditorToolbarProps {
  editor?: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <ToolbarPaper>
        <HistoryToolbar editor={editor} />
      </ToolbarPaper>
      <ToolbarPaper>
        <TextFormatToolbar editor={editor} />
      </ToolbarPaper>
      <TypographyToolbar editor={editor} />
      <FontFamilyToolbar editor={editor} />
      <FontSizeToolbar editor={editor} />
      <ToolbarPaper>
        <TextColorToolbar editor={editor} />
      </ToolbarPaper>

      {/* <Button size='small' onClick={() => editor.chain().focus().unsetColor().run()}>
        unset color
      </Button> */}
      {/* <input
        type='color'
        onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color}
        style={{ marginLeft: '4px', marginRight: '4px' }}
      /> */}
      <ToolbarPaper>
        <TextAlignToolbar editor={editor} />
      </ToolbarPaper>
      <ToolbarPaper>
        <SectionFormatToolbar editor={editor} />
        <Divider flexItem orientation='vertical' sx={{ mx: 0.5, my: 1 }} />
        <SectionBreaksToolbar editor={editor} />
      </ToolbarPaper>
      {/* <Button size='small' onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        clear marks
      </Button>
      <Button size='small' onClick={() => editor.chain().focus().clearNodes().run()}>
        clear nodes
      </Button> */}
      {/* <Button
        size='small'
        onClick={() => editor.chain().focus().setFontSize('20')}
        // className={editor.isActive('paragraph') ? 'is-active' : ''}
      >
        Size 20
      </Button> */}
    </Box>
  );
};

export function ToolbarPaper({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        flexWrap: 'wrap',
        borderRadius: 0.5,
        mx: { xs: 0.5, sm: 0.75, md: 1 },
        my: { xs: 0.25, md: 0.5 },
      }}
    >
      {children}
    </Paper>
  );
}
