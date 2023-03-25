import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Box, Button, Popper, ClickAwayListener, alpha } from '@mui/material';
import { FormatColorTextRounded } from '@mui/icons-material';
// @ts-ignore
import { SketchPicker } from 'react-color';

export interface TextColorToolbarProps {
  editor?: Editor;
}

export const TextColorToolbar: React.FC<TextColorToolbarProps> = ({ editor }) => {
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
    (color: any) => {
      // TODO: validate color ??
      console.log('COLOR: ', color);
      if (color.hex) editor?.chain().focus().setColor(color.hex).run();
    },
    [editor]
  );

  if (!editor) return null;

  console.log('TEXT ATTRIBUTES: ', editor.getAttributes('textStyle'));
  const color = editor?.getAttributes('textStyle').color;

  return (
    <>
      <Button
        aria-describedby={id}
        onClick={toggleMenu}
        color='inherit'
        sx={{
          mx: 1,
          borderRadius: 0.5,
          // bgcolor: 'background.paper',
          maxHeight: 30,
          minWidth: 34,
          maxWidth: 40,
          m: 0.5,
          // border: (theme) => `1px solid ${theme.palette.divider}`,
          color: color || 'text.secondary',
          bgcolor: color ? alpha(color, 0.08) : 'transparent',
        }}
      >
        <FormatColorTextRounded fontSize='small' color='inherit' />
      </Button>
      <Popper id={id} open={open} anchorEl={anchorEl}>
        <Box sx={{ border: 1, p: 1, bgcolor: 'background.paper' }}>
          <ClickAwayListener onClickAway={handleClose}>
            <SketchPicker onChange={handleChange} />
          </ClickAwayListener>
        </Box>
      </Popper>
    </>
  );
};

// return (
//   <Button
//     size='small'
//     component={() => (
//       <input
//         type='color'
//         onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
//         value={editor.getAttributes('textStyle').color}
//         style={{ marginLeft: '4px', marginRight: '4px' }}
//       />
//     )}
//   ></Button>
//   // <input
//   //   type='color'
//   //   onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
//   //   value={editor.getAttributes('textStyle').color}
//   //   style={{ marginLeft: '4px', marginRight: '4px' }}
//   // />
//   // <ToggleButton value='color' aria-label='color' disabled>
//   //   <FormatColorFillIcon />
//   //   <ArrowDropDownIcon />
//   // </ToggleButton>
// );
