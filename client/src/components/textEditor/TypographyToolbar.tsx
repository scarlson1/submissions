import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { alpha, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

export interface TypographyToolbarProps {
  editor?: Editor;
}

export const TypographyToolbar: React.FC<TypographyToolbarProps> = ({ editor }) => {
  const paragraphActive = editor?.isActive('paragraph');
  const heading1Active = editor?.isActive('heading', { level: 1 });
  const heading2Active = editor?.isActive('heading', { level: 2 });
  const heading3Active = editor?.isActive('heading', { level: 3 });

  const typographyType = useMemo(() => {
    if (paragraphActive) return 'paragraph';
    if (heading1Active) return 'heading1';
    if (heading2Active) return 'heading2';
    if (heading3Active) return 'heading3';
    return '';
  }, [paragraphActive, heading1Active, heading2Active, heading3Active]);

  const handleTypographyChange = useCallback(
    (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
      let newVal = event.target.value;
      if (newVal === 'paragraph') return editor?.chain().focus().setParagraph().run();
      if (newVal === 'heading1') return editor?.chain().focus().toggleHeading({ level: 1 }).run();
      if (newVal === 'heading2') return editor?.chain().focus().toggleHeading({ level: 2 }).run();
      if (newVal === 'heading3') return editor?.chain().focus().toggleHeading({ level: 3 }).run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <Select
      id='typography-select'
      value={typographyType}
      onChange={handleTypographyChange}
      size='small'
      renderValue={(value: any) => (
        <Typography variant='subtitle2' color='text.secondary'>
          {value || ''}
        </Typography>
      )}
      sx={{
        minWidth: 140,
        maxWidth: 180,
        maxHeight: 36,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderRadius: 0.5,
        m: 1,
        '& .MuiOutlinedInput-notchedOutline': {
          border: (theme) => `1px solid ${theme.palette.divider}`,
        },
        '& .MuiInputBase-input': {
          borderRadius: 0.5,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: (theme) => theme.palette.divider,
          bgcolor: (theme) => alpha(theme.palette.grey[900], 0.04),
        },
      }}
    >
      <MenuItem value={'paragraph'}>Paragraph</MenuItem>
      <MenuItem value={'heading1'}>Heading 1</MenuItem>
      <MenuItem value={'heading2'}>Heading 2</MenuItem>
      <MenuItem value={'heading3'}>Heading 3</MenuItem>
    </Select>
  );
};
