import { CloseRounded, DragHandleRounded, HomeRounded } from '@mui/icons-material';
import { Box, Drawer, IconButton, List, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES, createPath } from 'router';
import { NavItem } from './Header';

interface RenderItemProps extends NavItem {
  // toggleDrawer: () => void;
  key: string;
}
export interface NavDrawerProps {
  items: NavItem[];
  renderItem: (props: RenderItemProps) => React.ReactElement;
  // children?: ({ toggleDrawer }: { toggleDrawer: () => void }) => React.ReactNode;
}

export const NavDrawer = ({ items, renderItem }: NavDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setOpen((o) => !o);
  }, [setOpen]);
  // const openDrawer = () => {
  //   setOpen(true);
  // };
  // const closeDrawer = useCallback(
  //   (newVal: boolean) => {
  //     if (!open) return;
  //     setOpen(newVal);
  //   },
  //   [open, setOpen]
  // );

  // console.log('NAV DRAWER STATE: ', open);

  return (
    <>
      <IconButton onClick={toggleDrawer} aria-label='menu' color='primary'>
        <DragHandleRounded />
      </IconButton>
      <Drawer
        anchor='left'
        open={!!open ? true : false}
        onClose={toggleDrawer}
        // SlideProps={{
        //   unmountOnExit: true,
        // }}
        // variant='temporary'
        // ModalProps={{
        //   keepMounted: false,
        // }}
      >
        {/* {children && children({ toggleDrawer })} */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              py: 3,
              px: 3,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <IconButton
              color='primary'
              size='small'
              onClick={() => {
                toggleDrawer();
                navigate('/');
              }}
            >
              <HomeRounded />
            </IconButton>
            <div></div>
            <IconButton size='small' onClick={toggleDrawer}>
              <CloseRounded />
            </IconButton>
          </Box>
          <Box sx={{ flex: '1 1 auto', overflow: 'auto' }} onClick={toggleDrawer}>
            <List sx={{ minWidth: 260, maxWidth: 280, p: 3 }}>
              {items.map((item, i) => renderItem({ ...item, key: `${item.title}-${i}` }))}
              {/* {navPages?.map((item, i) => (
                <NavListItem
                  title={item.title}
                  route={item.route}
                  items={item.items}
                  icon={item.icon}
                  key={`${item.title}-${i}`}
                  selected={
                    (item.route &&
                      !!matchPath({ path: item.route as string }, location.pathname)) ||
                    false
                  }
                  handleClose={toggleDrawer}
                />
              ))} */}
            </List>
          </Box>
          <Box
            sx={{
              py: 4,
              px: 5,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant='subtitle2'
              color='text.secondary'
              onClick={() => {
                toggleDrawer();
                navigate(createPath({ path: ROUTES.CONTACT }));
              }}
              sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
            >
              Contact us
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
