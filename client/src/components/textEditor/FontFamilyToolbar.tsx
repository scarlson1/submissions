import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { alpha, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

export interface FontFamilyToolbarProps {
  editor?: Editor;
}

const FONTS = [
  'Baskerville',
  'Comic Sans MS',
  'Courier',
  'Georgia',
  'Helvetica',
  'Inter',
  'Lucida',
  'Monaco',
  'Monospace',
  'Open Sans',
  'Roboto',
  'Sans-serif',
  'Serif',
  'Source Sans Pro',
  'Times New Roman',
  'Tahoma',
  'Verdana',
];

export const FontFamilyToolbar: React.FC<FontFamilyToolbarProps> = ({ editor }) => {
  const handleChange = useCallback(
    (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
      let newVal = event.target.value as string;
      if (newVal) return editor?.chain().focus().setFontFamily(newVal).run();
      return editor?.chain().focus().unsetFontFamily().run();
    },
    [editor]
  );

  if (!editor) return null;

  const fontFamily = editor.getAttributes('textStyle').fontFamily;

  return (
    <Select
      id='font-family-select'
      value={fontFamily || 'default'}
      onChange={handleChange}
      size='small'
      renderValue={(value: any) => (
        <Typography
          variant='subtitle2'
          color='text.secondary'
          sx={{ fontFamily: fontFamily || 'Roboto' }}
        >
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
      MenuProps={{
        PaperProps: {
          style: {
            maxHeight: 300,
          },
        },
      }}
    >
      <MenuItem value={'default'}>Default</MenuItem>
      {FONTS.map((font) => (
        <MenuItem
          value={font}
          selected={fontFamily === font}
          style={{ fontFamily: font }}
          key={font}
        >
          {`${font}`}
        </MenuItem>
      ))}
    </Select>
  );
};
