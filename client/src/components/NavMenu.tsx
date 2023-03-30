import React, { useState } from 'react';
import { Box, Button, ButtonProps, ClickAwayListener, Popper } from '@mui/material';
// import { useSpring, animated } from '@react-spring/web';

export interface NavMenuProps {
  btnTitle: string;
  btnProps?: Partial<ButtonProps>;
  children?: React.ReactNode;
}

export const NavMenu: React.FC<NavMenuProps> = ({ btnTitle = 'open', btnProps, children }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('CLICK CALLED');
    setAnchorEl(event.currentTarget);
    setOpen((previousOpen) => !previousOpen);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const canBeOpen = open && Boolean(anchorEl);
  const id = canBeOpen ? `menu-${btnTitle}` : undefined;

  return (
    <div>
      <Button aria-describedby={id} onClick={handleClick} {...btnProps}>
        {btnTitle}
      </Button>
      <Popper id={id} open={open} anchorEl={anchorEl} sx={{ zIndex: 1000 }}>
        {/* {({ TransitionProps }) => (
          <Fade {...TransitionProps}> */}
        <ClickAwayListener onClickAway={handleClose}>
          <Box
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
            onClick={handleClose}
          >
            {children}
          </Box>
        </ClickAwayListener>
        {/* </Fade>
        )} */}
      </Popper>
    </div>
  );
};

// interface FadeProps {
//   children?: React.ReactElement;
//   in?: boolean;
//   onEnter?: () => void;
//   onExited?: () => void;
// }

// const Fade = React.forwardRef<HTMLDivElement, FadeProps>(function Fade(props, ref) {
//   const { in: open, children, onEnter, onExited, ...other } = props;
//   const style = useSpring({
//     from: { opacity: 0 },
//     to: { opacity: open ? 1 : 0 },
//     onStart: () => {
//       if (open && onEnter) {
//         onEnter();
//       }
//     },
//     onRest: () => {
//       if (!open && onExited) {
//         onExited();
//       }
//     },
//   });

//   return (
//     <animated.div ref={ref} style={style} {...other}>
//       {children}
//     </animated.div>
//   );
// });
