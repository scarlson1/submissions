import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  DataArrayRounded,
  FormatBoldRounded,
  FormatItalicRounded,
  LinkOffRounded,
  LinkRounded,
  StrikethroughSRounded,
} from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface TextFormatToolbarProps {
  editor?: Editor;
}

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({ editor }) => {
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const boldActive = editor?.isActive('bold');
  const italicActive = editor?.isActive('italic');
  const strikeActive = editor?.isActive('strike');
  const codeActive = editor?.isActive('code');
  const linkActive = editor?.isActive('link');

  const handleFormat = useCallback(
    (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
      if (!editor) return;
      if (newFormats.includes('bold') !== boldActive) {
        editor.chain().focus().toggleBold().run();
      }
      if (newFormats.includes('italic') !== italicActive) {
        editor.chain().focus().toggleItalic().run();
      }
      if (newFormats.includes('strike') !== strikeActive) {
        editor.chain().focus().toggleStrike().run();
      }
      if (newFormats.includes('code') !== codeActive) {
        editor.chain().focus().toggleCode().run();
      }
      if (newFormats.includes('link') !== linkActive) {
        if (!!linkActive) return editor.chain().focus().unsetLink().run();
        setLink();
      }
    },
    [editor, boldActive, italicActive, strikeActive, codeActive, linkActive, setLink]
  );

  const formats = useMemo(() => {
    let activeFormats = [];
    if (boldActive) activeFormats.push('bold');
    if (italicActive) activeFormats.push('italic');
    if (strikeActive) activeFormats.push('strike');
    if (codeActive) activeFormats.push('code');
    if (linkActive) activeFormats.push('link');

    return activeFormats;
  }, [boldActive, italicActive, strikeActive, codeActive, linkActive]);

  if (!editor) {
    return null;
  }

  return (
    <ToggleButtonGroup
      value={formats}
      onChange={handleFormat}
      size='small'
      color='primary'
      aria-label='text formatting'
      sx={toggleButtonGroupStyle}
    >
      <ToggleButton
        size='small'
        value='bold'
        color='primary'
        disabled={!editor.can().chain().focus().toggleBold().run()}
        aria-label='bold'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatBoldRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='italic'
        color='primary'
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        aria-label='italic'
        sx={{
          border: 'none !important',
        }}
      >
        <FormatItalicRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='strike'
        color='primary'
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        aria-label='strike'
        sx={{
          border: 'none !important',
        }}
      >
        <StrikethroughSRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='code'
        color='primary'
        disabled={!editor.can().chain().focus().toggleCode().run()}
        aria-label='code'
        sx={{
          border: 'none !important',
        }}
      >
        <DataArrayRounded fontSize='small' />
      </ToggleButton>
      <ToggleButton
        size='small'
        value='link'
        color='primary'
        aria-label='link'
        sx={{
          border: 'none !important',
        }}
      >
        {!linkActive ? <LinkRounded fontSize='small' /> : <LinkOffRounded fontSize='small' />}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
