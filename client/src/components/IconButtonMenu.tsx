import React, { useState, useCallback } from 'react';
import {
  IconButton,
  IconButtonProps,
  Menu,
  MenuItem,
  MenuItemProps,
  MenuProps,
} from '@mui/material';
import { MoreVertRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Option {
  label: React.ReactNode;
  action: string | (() => void) | (() => Promise<void>);
}

export interface IconButtonMenuProps {
  menuItems: Option[];
  menuProps?: Partial<MenuProps>;
  menuItemProps?: Partial<MenuItemProps>;
  iconButtonProps?: Partial<IconButtonProps>;
  buttonIcon?: React.ReactNode;
}

export const IconButtonMenu: React.FC<IconButtonMenuProps> = ({
  menuItems,
  iconButtonProps,
  menuProps,
  menuItemProps,
  buttonIcon,
}) => {
  const navigate = useNavigate();
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
  let actionsMenuOpen = Boolean(actionsAnchorEl);

  const handleActionsOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setActionsAnchorEl(e.currentTarget);
  }, []);

  const handleActionsClose = useCallback(() => {
    setActionsAnchorEl(null);
  }, []);

  return (
    <>
      <IconButton
        color='primary'
        aria-label='more'
        onClick={handleActionsOpen}
        // sx={{ ml: 2, borderRadius: 1 }}
        {...iconButtonProps}
      >
        {buttonIcon ? buttonIcon : <MoreVertRounded />}
      </IconButton>
      <Menu
        open={actionsMenuOpen}
        anchorEl={actionsAnchorEl}
        id='account-menu'
        onClose={handleActionsClose}
        onClick={handleActionsClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        {...menuProps}
      >
        {menuItems.map(({ action, label }, i) => (
          <MenuItem
            onClick={() => (typeof action === 'string' ? navigate(action) : action())}
            divider
            key={`menuItem-${i}-${label}`}
            {...menuItemProps}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
