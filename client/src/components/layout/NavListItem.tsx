import { ExpandLessRounded, ExpandMoreRounded } from '@mui/icons-material';
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemButtonProps,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom'; // Link as RouterLink,

interface NavListItemProps extends Omit<NavItemComponentProps, 'children'> {
  title: string;
  route?: string;
  items?: NavListItemProps[];
  icon?: React.ReactNode;
  selected?: boolean;
  // handleClose?: () => void;
}

export const NavListItem = ({
  title,
  route,
  items,
  icon,
  // handleClose,
  ...props
}: NavListItemProps) => {
  const location = useLocation();
  const isExpandable = items && items.length > 0;
  const [open, setOpen] = useState(false);

  const handleExpandClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isExpandable) e.stopPropagation();
      setOpen((o) => !o);
      // if (route && props.handleClose) props.handleClose();
    },
    [isExpandable]
  );

  const rootItem = (
    <NavItemComponent
      route={route}
      handleExpandClick={handleExpandClick}
      // handleClose={handleClose}
      // handleClose={props.handleClose}
      {...props}
    >
      {!!icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText primary={title} />
      {isExpandable && !open && <ExpandMoreRounded />}
      {isExpandable && open && <ExpandLessRounded />}
    </NavItemComponent>
  );

  const ItemChildren = isExpandable ? (
    <Collapse in={open} timeout='auto'>
      <Divider sx={{ my: 2 }} />
      <List>
        {items.map((item: NavListItemProps, i) => (
          <NavItemComponent
            route={item.route}
            selected={(item.route && !!matchPath({ path: item.route }, location.pathname)) || false}
            key={`${title}-${item.route}-${i}`}
            // handleClose={handleClose}
          >
            {!!item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.title} />
          </NavItemComponent>
        ))}
      </List>
    </Collapse>
  ) : null;

  return (
    <Box sx={{ width: '100%' }}>
      {rootItem}
      {ItemChildren}
    </Box>
  );
};

interface NavItemComponentProps extends ListItemButtonProps {
  route?: string;
  handleExpandClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  selected?: boolean;
  // handleClose?: () => void;
}

function NavItemComponent({
  handleExpandClick,
  route,
  children,
  // handleClose,
  ...props
}: NavItemComponentProps) {
  const navigate = useNavigate();
  if (!route || typeof route !== 'string') {
    return (
      <ListItemButton onClick={handleExpandClick} sx={{ my: 1, borderRadius: 1 }}>
        {children}
      </ListItemButton>
    );
  }

  return (
    <ListItemButton
      onClick={(e: any) => {
        // e.stopPropagation();
        // handleClose && handleClose();
        navigate(route);
      }}
      // component={RouterLink as any}
      // to={route}
      sx={{
        my: 1,
        borderRadius: 1,
        '&.Mui-selected': {
          border: 'none',
          borderColor: 'transparent !important',
          color: 'primary',
          '& .MuiListItemText-primary': {
            fontWeight: 600,
          },
        },
      }}
      {...props}
    >
      {children}
    </ListItemButton>
  );
}
