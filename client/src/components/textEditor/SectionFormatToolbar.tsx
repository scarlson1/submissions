import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  CodeRounded,
  FormatListBulletedRounded,
  FormatListNumberedRounded,
  FormatQuoteRounded,
} from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface SectionFormatToolbarProps {
  editor?: Editor;
}

export const SectionFormatToolbar: React.FC<SectionFormatToolbarProps> = ({ editor }) => {
  const orderedListActive = editor?.isActive('orderedList');
  const bulletListActive = editor?.isActive('bulletList');
  const blockquoteActive = editor?.isActive('blockquote');
  const codeBlockActive = editor?.isActive('codeBlock');

  const handleSectionFormat = useCallback(
    (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
      if (newFormats.includes('orderedList') !== orderedListActive) {
        editor?.chain().focus().toggleOrderedList().run();
      }
      if (newFormats.includes('bulletList') !== bulletListActive) {
        editor?.chain().focus().toggleBulletList().run();
      }
      if (newFormats.includes('blockquote') !== blockquoteActive) {
        editor?.chain().focus().toggleBlockquote().run();
      }
      if (newFormats.includes('codeBlock') !== codeBlockActive) {
        editor?.chain().focus().toggleCodeBlock().run();
      }
    },
    [editor, orderedListActive, bulletListActive, blockquoteActive, codeBlockActive]
  );

  const sectionFormats = useMemo(() => {
    let activeSectionFormats = [];
    if (orderedListActive) activeSectionFormats.push('orderedList');
    if (bulletListActive) activeSectionFormats.push('bulletList');
    if (blockquoteActive) activeSectionFormats.push('blockquote');
    if (codeBlockActive) activeSectionFormats.push('codeBlock');
    return activeSectionFormats;
  }, [orderedListActive, bulletListActive, blockquoteActive, codeBlockActive]);

  if (!editor) return null;

  return (
    <ToggleButtonGroup
      value={sectionFormats}
      onChange={handleSectionFormat}
      size='small'
      color='primary'
      aria-label='text formatting'
      sx={toggleButtonGroupStyle}
    >
      <ToggleButton
        size='small'
        value='bulletList'
        color='primary'
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        aria-label='bulleted list'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatListBulletedRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='orderedList'
        color='primary'
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        aria-label='ordered list'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatListNumberedRounded fontSize='small' />
      </ToggleButton>
      {/* <Divider flexItem orientation='vertical' sx={{ mx: 0.5, my: 1 }} /> */}
      <ToggleButton
        size='small'
        value='codeBlock'
        color='primary'
        disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
        aria-label='code block'
        sx={{
          border: 'none !important',
        }}
      >
        <CodeRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='blockquote'
        color='primary'
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        aria-label='block quote'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatQuoteRounded fontSize='small' />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
