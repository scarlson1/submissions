import { useCallback, useMemo } from 'react';

import {
  CodeRounded,
  FormatListBulletedRounded,
  FormatListNumberedRounded,
  FormatQuoteRounded,
} from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Editor } from '@tiptap/react';

import { toggleButtonGroupStyle } from './common';

export interface SectionFormatToolbarProps {
  editor?: Editor;
}

export const SectionFormatToolbar = ({ editor }: SectionFormatToolbarProps) => {
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
        // @ts-expect-error
        editor?.chain().focus().toggleBlockquote().run();
      }
      if (newFormats.includes('codeBlock') !== codeBlockActive) {
        // @ts-expect-error
        editor?.chain().focus().toggleCodeBlock().run();
      }
    },
    [
      editor,
      orderedListActive,
      bulletListActive,
      blockquoteActive,
      codeBlockActive,
    ],
  );

  const sectionFormats = useMemo(() => {
    let activeSectionFormats: string[] = [];
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
        // TooltipProps={{ title: 'bullet list' }}
        size='small'
        value='bulletList'
        color='primary'
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        aria-label='bulleted list'
        sx={{
          border: 'none !important',
        }}
      >
        <Tooltip title='bullet list' placement='top'>
          <FormatListBulletedRounded fontSize='small' />
        </Tooltip>
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
        // TooltipProps={{ title: 'ordered list' }}
      >
        <Tooltip title='ordered list' placement='top'>
          <FormatListNumberedRounded fontSize='small' />
        </Tooltip>
      </ToggleButton>
      <ToggleButton
        size='small'
        value='codeBlock'
        color='primary'
        // @ts-expect-error
        disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
        aria-label='code block'
        sx={{
          border: 'none !important',
        }}
        // TooltipProps={{ title: 'code block' }}
      >
        <Tooltip title='code block' placement='top'>
          <CodeRounded fontSize='small' />
        </Tooltip>
      </ToggleButton>
      <ToggleButton
        size='small'
        value='blockquote'
        color='primary'
        // @ts-expect-error
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        aria-label='block quote'
        sx={{
          border: 'none !important',
        }}
        // TooltipProps={{ title: 'block quote' }}
      >
        <Tooltip title='block quote' placement='top'>
          <FormatQuoteRounded fontSize='small' />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

// <TooltipToggleButton
//   TooltipProps={{ title: 'bullet list' }}
//   size='small'
//   value='bulletList'
//   color='primary'
//   disabled={!editor.can().chain().focus().toggleBulletList().run()}
//   aria-label='bulleted list'
//   sx={{
//     border: 'none !important',
//   }}
// >
//   <FormatListBulletedRounded fontSize='small' />
// </TooltipToggleButton>
// <TooltipToggleButton
//   size='small'
//   value='orderedList'
//   color='primary'
//   disabled={!editor.can().chain().focus().toggleOrderedList().run()}
//   aria-label='ordered list'
//   sx={{
//     border: 'none !important',
//   }}
//   TooltipProps={{ title: 'ordered list' }}
// >
//   <FormatListNumberedRounded fontSize='small' />
// </TooltipToggleButton>
// <TooltipToggleButton
//   size='small'
//   value='codeBlock'
//   color='primary'
//   disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
//   aria-label='code block'
//   sx={{
//     border: 'none !important',
//   }}
//   TooltipProps={{ title: 'code block' }}
// >
//   <CodeRounded fontSize='small' />
// </TooltipToggleButton>
// <TooltipToggleButton
//   size='small'
//   value='blockquote'
//   color='primary'
//   disabled={!editor.can().chain().focus().toggleBlockquote().run()}
//   aria-label='block quote'
//   sx={{
//     border: 'none !important',
//   }}
//   TooltipProps={{ title: 'block quote' }}
// >
//   <FormatQuoteRounded fontSize='small' />
// </TooltipToggleButton>
