import { useState, useCallback } from 'react';

import { Editor } from '@tiptap/react';
import { Box, Button, Popper, ClickAwayListener, alpha } from '@mui/material';
import { FormatColorTextRounded } from '@mui/icons-material'; // @ts-ignore
import { SketchPicker } from 'react-color'; // Color
import { useTheme } from '@mui/system';

export interface TextColorToolbarProps {
  editor?: Editor;
}

export const TextColorToolbar = ({ editor }: TextColorToolbarProps) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'text-color' : undefined;

  const toggleMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    },
    [anchorEl]
  );
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChange = useCallback(
    (color?: any) => {
      console.log('COLOR: ', color);
      // if (color)
      if (color?.hex) editor?.chain().focus().setColor(color.hex).run();
    },
    [editor]
  );

  if (!editor) return null;

  const color = editor?.getAttributes('textStyle').color;

  return (
    <>
      <Box sx={{ borderRadius: 0.5, bgcolor: 'background.paper' }}>
        <Button
          aria-describedby={id}
          onClick={toggleMenu}
          color='inherit'
          sx={{
            mx: 1,
            borderRadius: 0.5,
            maxHeight: 30,
            minWidth: 34,
            maxWidth: 40,
            m: 0.5,
            color: color || 'text.secondary',
            bgcolor: color ? alpha(color, 0.08) : 'transparent',
          }}
        >
          <FormatColorTextRounded fontSize='small' color='inherit' />
        </Button>
      </Box>
      <Popper id={id} open={open} anchorEl={anchorEl}>
        <ClickAwayListener onClickAway={handleClose}>
          <SketchPicker
            color={color || theme.palette.text.primary}
            onChangeComplete={handleChange}
            disableAlpha
            presetColors={[
              { color: '#000000', title: 'black' },
              { color: '#FFFFFF', title: 'white' },
              { color: '#1A2027', title: 'text primary' },
              { color: '#3E5060', title: 'text secondary' },
              { color: '#B2BAC2', title: 'text secondary dark' },
              { color: '#A0AAB4', title: 'grey' },
              { color: '#5090D3', title: 'dark blue' },
              { color: '#007FFF', title: 'blue' },
              { color: '#EB0014', title: 'red' },
              { color: '#570007', title: 'dark red' },
              { color: '#1AA251', title: 'success' },
            ]}
          />
        </ClickAwayListener>
      </Popper>
    </>
  );
};
