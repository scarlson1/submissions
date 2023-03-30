import React, { useState, useCallback } from 'react';
import { Drawer, IconButton } from '@mui/material';
import { MenuRounded } from '@mui/icons-material';

export interface NavDrawerProps {
  children?: ({ toggleDrawer }: { toggleDrawer: () => void }) => React.ReactNode;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return (
    <>
      <IconButton onClick={toggleDrawer} aria-label='menu'>
        <MenuRounded />
      </IconButton>
      <Drawer anchor='left' open={open} onClose={toggleDrawer}>
        {children && children({ toggleDrawer })}
      </Drawer>
    </>
  );
};
