import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Box, Button, Popper, ClickAwayListener } from '@mui/material';
import { FormatPaintRounded } from '@mui/icons-material'; // @ts-ignore
import { GithubPicker } from 'react-color';

export interface HighlightToolbarProps {
  editor?: Editor;
}

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({ editor }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'highlight-color' : undefined;

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
      if (color?.hex && color.hex === 'transparent')
        return editor?.chain().focus().unsetHighlight().run();
      if (color?.hex) editor?.chain().focus().toggleHighlight({ color: color.hex }).run();
    },
    [editor]
  );

  if (!editor) return null;

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
            color: 'text.secondary',
          }}
        >
          <FormatPaintRounded fontSize='small' color='inherit' />
        </Button>
      </Box>
      <Popper id={id} open={open} anchorEl={anchorEl}>
        <ClickAwayListener onClickAway={handleClose}>
          <GithubPicker
            colors={[
              '#B80000',
              '#DB3E00',
              '#FCCB00',
              '#008B02',
              '#1273DE',
              '#EB9694',
              '#FAD0C3',
              '#FEF3BD',
              '#BEDADC',
              '#C4DEF6',
              'transparent',
            ]}
            onChangeComplete={handleChange}
            width='138px'
            triangle='hide'
          />
        </ClickAwayListener>
      </Popper>
    </>
  );
};
