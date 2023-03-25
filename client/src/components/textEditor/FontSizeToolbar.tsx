import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
// import { DEFAULT_FONT_SIZE } from 'modules/utils/FontSize';

const FONT_SIZES = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '13px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px',
  '30px',
  '36px',
  '40px',
  '48px',
  '60px',
  '74px',
  '96px',
];

export interface FontSizeToolbarProps {
  editor?: Editor;
}

export const FontSizeToolbar: React.FC<FontSizeToolbarProps> = ({ editor }) => {
  // const isActive: { [key: string]: boolean } = {};
  // FONT_SIZES.forEach(
  //   (size) => (isActive[size] = editor?.isActive('textStyle', { fontSize: size }) || false)
  // );

  // const getValue = useCallback((activeObj: { [key: string]: boolean }) => {
  //   let size = DEFAULT_FONT_SIZE || '16px';
  //   Object.keys(activeObj).forEach((f) => {
  //     if (!!activeObj[f]) size = f;
  //   });

  //   return size;
  // }, []);

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
      // value={getValue(isActive) || ''}
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
        <MenuItem
          value={size}
          selected={fontSize === size}
          // selected={isActive[size] || false}
          key={size}
        >
          {`${size}`}
        </MenuItem>
      ))}
    </Select>
  );
};
