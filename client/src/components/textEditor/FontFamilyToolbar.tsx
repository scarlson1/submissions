import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

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
  'Roboto',
  'Sans-serif',
  'Serif',
  'Times New Roman',
  'Tahoma',
  'Verdana',
];

export const FontFamilyToolbar: React.FC<FontFamilyToolbarProps> = ({ editor }) => {
  // const isActive: { [key: string]: boolean } = {};
  // FONTS.forEach(
  //   (font) => (isActive[font] = editor?.isActive('textStyle', { fontFamily: font }) || false)
  // );

  // const getValue = useCallback((activeObj: { [key: string]: boolean }) => {
  //   let font = 'default';
  //   Object.keys(activeObj).forEach((f) => {
  //     if (!!activeObj[f]) font = f;
  //   });

  //   return font;
  // }, []);

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
      // value={getValue(isActive) || 'default'}
      value={fontFamily || 'default'}
      onChange={handleChange}
      size='small'
      renderValue={(value: any) => (
        <Typography
          variant='subtitle2'
          color='text.secondary'
          sx={{ fontFamily: fontFamily || 'Roboto' }}
          // sx={{ fontFamily: getValue(isActive) }}
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
          // selected={isActive[font] || false}
          style={{ fontFamily: font }}
          key={font}
        >
          {`${font}`}
        </MenuItem>
      ))}
    </Select>
  );
};

// const baskervilleActive = editor?.isActive('textStyle', { fontFamily: 'Baskerville' });
// const comicSansMSActive = editor?.isActive('textStyle', { fontFamily: 'Comic Sans MS' });
// const courierActive = editor?.isActive('textStyle', { fontFamily: 'Courier' });
// const georgiaActive = editor?.isActive('textStyle', { fontFamily: 'Georgia' });
// const helveticaActive = editor?.isActive('textStyle', { fontFamily: 'Helvetica' });
// const lucidaActive = editor?.isActive('textStyle', { fontFamily: 'Lucida' });
// const interActive = editor?.isActive('textStyle', { fontFamily: 'Inter' });
// const monacoActive = editor?.isActive('textStyle', { fontFamily: 'Monaco' });
// const monospaceActive = editor?.isActive('textStyle', { fontFamily: 'monospace' });
// const tahomaActive = editor?.isActive('textStyle', { fontFamily: 'Tahoma' });
// const timesNewRomanActive = editor?.isActive('textStyle', { fontFamily: 'Times New Roman' });
// const verdanaActive = editor?.isActive('textStyle', { fontFamily: 'Verdana' });
// const serifActive = editor?.isActive('textStyle', { fontFamily: 'serif' });
// const sansSerifActive = editor?.isActive('textStyle', { fontFamily: 'sans-serif' });

// <MenuItem value={'Baskerville'} selected={baskervilleActive}>
//   Baskerville
// </MenuItem>
// <MenuItem value={'Comic Sans MS'} selected={comicSansMSActive}>
//   Comic Sans MS
// </MenuItem>
// <MenuItem value={'Courier'} selected={courierActive}>
//   Courier
// </MenuItem>
// <MenuItem value={'Georgia'} selected={georgiaActive}>
//   Georgia
// </MenuItem>
// <MenuItem value={'Helvetica'} selected={helveticaActive}>
//   Helvetica
// </MenuItem>
// <MenuItem value={'Inter'} selected={interActive}>
//   Inter
// </MenuItem>
// <MenuItem value={'Lucida'} selected={lucidaActive}>
//   Lucida
// </MenuItem>
// <MenuItem value={'Monaco'} selected={monacoActive}>
//   Monaco
// </MenuItem>
// <MenuItem value={'monospace'} selected={monospaceActive}>
//   Monospace
// </MenuItem>
// <MenuItem value={'sans-sarif'} selected={sansSerifActive}>
//   Sans-serif
// </MenuItem>
// <MenuItem value={'serif'} selected={serifActive}>
//   Serif
// </MenuItem>
// <MenuItem value={'Times New Roman'} selected={timesNewRomanActive}>
//   Times New Roman
// </MenuItem>
// <MenuItem value={'Tahoma'} selected={tahomaActive}>
//   Tahoma
// </MenuItem>
// <MenuItem value={'Verdana'} selected={verdanaActive}>
//   Verdana
// </MenuItem>
