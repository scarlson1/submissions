import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

export interface FontFamilyToolbarProps {
  editor?: Editor;
}

export const FontFamilyToolbar: React.FC<FontFamilyToolbarProps> = ({ editor }) => {
  const tahomaActive = editor?.isActive('textStyle', { fontFamily: 'Tahoma' });
  const interActive = editor?.isActive('textStyle', { fontFamily: 'Inter' });
  const serifActive = editor?.isActive('textStyle', { fontFamily: 'serif' });
  const sansSerifActive = editor?.isActive('textStyle', { fontFamily: 'sans-serif' });
  const monospaceActive = editor?.isActive('textStyle', { fontFamily: 'monospace' });

  const fontFamily = useMemo(() => {
    if (tahomaActive) return 'Tahoma';
    if (interActive) return 'Inter';
    if (serifActive) return 'serif';
    if (sansSerifActive) return 'sans-serif';
    if (monospaceActive) return 'monospace';
    return '';
  }, [tahomaActive, interActive, serifActive, sansSerifActive, monospaceActive]);

  const handleChange = useCallback(
    (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
      let newVal = event.target.value as string;
      if (newVal) return editor?.chain().focus().setFontFamily(newVal).run();
      return editor?.chain().focus().unsetFontFamily().run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <Select
      id='font-family-select'
      value={fontFamily}
      onChange={handleChange}
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
      }}
    >
      <MenuItem value={''}>Default</MenuItem>
      <MenuItem value={'Inter'}>Inter</MenuItem>
      <MenuItem value={'serif'}>Serif</MenuItem>
      <MenuItem value={'sans-sarif'}>Sans-serif</MenuItem>
      <MenuItem value={'monospace'}>Monospace</MenuItem>
      <MenuItem value={'Tahoma'}>Tahoma</MenuItem>
    </Select>
  );
};
