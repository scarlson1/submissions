import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { alpha, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

import { FONT_SIZES } from 'modules/utils/FontSize';

export interface FontSizeToolbarProps {
  editor?: Editor;
}

export const FontSizeToolbar: React.FC<FontSizeToolbarProps> = ({ editor }) => {
  const handleChange = useCallback(
    (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
      let newVal = event.target.value as string;
      if (newVal) return editor?.chain().focus().setFontSize(newVal).run();
      return editor?.chain().focus().unsetFontSize().run();
    },
    [editor]
  );

  if (!editor) return null;

  const fontSize = editor.getAttributes('textStyle').fontSize;

  return (
    <Select
      id='font-size-select'
      value={fontSize || ''}
      onChange={handleChange}
      size='small'
      renderValue={(value: any) => (
        <Typography variant='subtitle2' color='text.secondary'>
          {value || ''}
        </Typography>
      )}
      sx={{
        minWidth: 80,
        maxWidth: 100,
        maxHeight: 36,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderRadius: 0.5,
        m: 1,
        '& .MuiOutlinedInput-notchedOutline': {
          border: (theme) => `1px solid ${theme.palette.divider}`,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: (theme) => theme.palette.divider,
          bgcolor: (theme) => alpha(theme.palette.grey[900], 0.04),
        },
        '& .MuiInputBase-input': {
          borderRadius: 0.5,
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
      <MenuItem value={''}>Default</MenuItem>
      {FONT_SIZES.map((size) => (
        <MenuItem value={size} selected={fontSize === size} key={size}>
          {`${size}`}
        </MenuItem>
      ))}
    </Select>
  );
};
