import { useState, type ReactElement } from 'react';

import {
  Box,
  Button,
  ButtonProps,
  ClickAwayListener,
  List,
  Popper,
} from '@mui/material';
import type { NavItem } from 'components/layout/Header';
// import { useSpring, animated } from '@react-spring/web';

export interface NavMenuProps {
  btnTitle: string;
  btnProps?: Partial<ButtonProps>;
  items: NavItem[];
  renderItem: ({
    route,
    title,
    handleClose,
  }: NavItem & {
    handleClose: () => void;
  }) => ReactElement;
}

export const NavMenu = ({
  btnTitle = 'open',
  btnProps,
  items,
  renderItem,
}: NavMenuProps) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
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
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        sx={{ zIndex: (theme) => theme.zIndex.appBar }}
      >
        {/* {({ TransitionProps }) => (
          <Fade {...TransitionProps}> */}
        <ClickAwayListener onClickAway={handleClose}>
          <Box
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
            // onClick={handleClose}
          >
            {/* {children} */}
            <List
              sx={{
                minWidth: 160,
                maxWidth: 260,
                '& .MuiListItemButton-root:first-of-type': {
                  borderTopLeftRadius: (theme) => theme.shape.borderRadius,
                  borderTopRightRadius: (theme) => theme.shape.borderRadius,
                },
                '& .MuiListItemButton-root:last-of-type': {
                  borderBottomLeftRadius: (theme) => theme.shape.borderRadius,
                  borderBottomRightRadius: (theme) => theme.shape.borderRadius,
                },
              }}
              dense
            >
              {items.map((itemProps) => {
                return renderItem({ ...itemProps, handleClose });
              })}
            </List>
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
