import { useCallback, useMemo } from 'react';

import { Editor } from '@tiptap/react';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import {
  DataArrayRounded,
  FormatBoldRounded,
  FormatItalicRounded,
  LinkOffRounded,
  LinkRounded,
  FormatUnderlinedRounded,
  StrikethroughSRounded,
} from '@mui/icons-material';

import { toggleButtonGroupStyle } from './common';

export interface TextFormatToolbarProps {
  editor?: Editor;
}

export const TextFormatToolbar = ({ editor }: TextFormatToolbarProps) => {
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
  const underlineActive = editor?.isActive('underline');
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
      if (newFormats.includes('underline') !== underlineActive) {
        editor.chain().focus().toggleUnderline().run();
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
    [
      editor,
      boldActive,
      italicActive,
      underlineActive,
      strikeActive,
      codeActive,
      linkActive,
      setLink,
    ]
  );

  const formats = useMemo(() => {
    let activeFormats = [];
    if (boldActive) activeFormats.push('bold');
    if (italicActive) activeFormats.push('italic');
    if (underlineActive) activeFormats.push('underline');
    if (strikeActive) activeFormats.push('strike');
    if (codeActive) activeFormats.push('code');
    if (linkActive) activeFormats.push('link');

    return activeFormats;
  }, [boldActive, italicActive, underlineActive, strikeActive, codeActive, linkActive]);

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
        <Tooltip title='bold' placement='top'>
          <FormatBoldRounded fontSize='small' />
        </Tooltip>
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
        <Tooltip title='italic' placement='top'>
          <FormatItalicRounded fontSize='small' />
        </Tooltip>
      </ToggleButton>
      <ToggleButton
        size='small'
        value='underline'
        color='primary'
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        aria-label='underline'
        sx={{
          border: 'none !important',
        }}
      >
        <Tooltip title='underline' placement='top'>
          <FormatUnderlinedRounded fontSize='small' />
        </Tooltip>
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
        <Tooltip title='strike through' placement='top'>
          <StrikethroughSRounded fontSize='small' />
        </Tooltip>
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
        <Tooltip title='code' placement='top'>
          <DataArrayRounded fontSize='small' />
        </Tooltip>
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
        <Tooltip title={!linkActive ? 'Link' : 'Unlink'} placement='top'>
          {!linkActive ? <LinkRounded fontSize='small' /> : <LinkOffRounded fontSize='small' />}
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
