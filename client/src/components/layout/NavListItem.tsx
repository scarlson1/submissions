import { useCallback, useState } from 'react';

import {
  Box,
  Collapse,
  List,
  ListItemText,
  Divider,
  ListItemIcon,
  ListItemButton,
} from '@mui/material';
import { ExpandLessRounded, ExpandMoreRounded } from '@mui/icons-material';
import { matchPath, useLocation, useNavigate } from 'react-router-dom'; // Link as RouterLink,

interface NavListItemProps {
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

interface NavItemComponentProps {
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

// OLD MOBILE MENU

// const MenuItemComponent = ({ onClick, route, children, onClose, test }: any) => {
//   if (!route || typeof route !== 'string') {
//     return <ListItemButton children={children} onClick={onClick} dense sx={{ px: 4, py: 2 }} />;
//   }

//   return (
//     <ListItemButton
//       // component={RouterLink as any}
//       // to={route}
//       children={children}
//       // onClick={onClose}
//       onClick={() => test(route)}
//       dense
//       sx={{ px: 4, py: 2 }}
//     />
//   );
// };

// export interface NavMenuItemProps {
//   title: string;
//   route?: string;
//   items?: { title: string; route: string }[];
//   icon?: React.ReactNode;
//   onClose?: () => void;
//   test?: (route?: string) => void;
// }

// export const NavMenuItem = ({ title, route, items, icon, onClose, test }: any) => {
//   const isExpandable = items && items.length > 0;
//   const [open, setOpen] = React.useState(false);

//   function handleClick(e: any) {
//     e.stopPropagation();
//     setOpen(!open);
//   }

//   const MenuItemRoot = (
//     <MenuItemComponent route={route} onClick={handleClick} onClose={onClose} test={test}>
//       {!!icon && <ListItemIcon>{icon}</ListItemIcon>}
//       <ListItemText primary={title} />
//       {isExpandable && !open && <ExpandMoreRounded />}
//       {isExpandable && open && <ExpandLessRounded />}
//     </MenuItemComponent>
//   );

//   const MenuItemChildren = isExpandable ? (
//     <Collapse in={open} timeout='auto' unmountOnExit>
//       <Divider />
//       <List component='div' disablePadding dense>
//         {items.map((item: any, i: number) => (
//           <NavMenuItem
//             title={item.title}
//             route={item.route}
//             key={`${title}-${item.title}-${i}`}
//             onClose={onClose}
//             test={test}
//           />
//         ))}
//       </List>
//     </Collapse>
//   ) : null;

//   return (
//     <Box sx={{ minWidth: 200, maxWidth: 300 }}>
//       {MenuItemRoot}
//       {MenuItemChildren}
//     </Box>
//   );
// };

// function MobileNav({ items }: { items: NavItem[] }) {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const navigate = useNavigate();

//   const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   }, []);

//   const handleClose = useCallback(() => {
//     setAnchorEl(null);
//   }, []);

//   const test = useCallback(
//     (route: string) => {
//       setAnchorEl(null);
//       navigate(route);
//     },
//     [navigate]
//   );

//   return (
//     <div>
//       <IconButton
//         size='large'
//         aria-label='nav menu'
//         aria-controls='nav-menu'
//         aria-haspopup='true'
//         onClick={handleOpen}
//       >
//         <MenuRounded />
//       </IconButton>
//       <Menu
//         id='menu-mobile'
//         anchorEl={anchorEl}
//         keepMounted
//         open={Boolean(anchorEl)}
//         onClose={handleClose}
//       >
//         <List component='div' disablePadding dense>
//           {items?.map((page, i) => {
//             return (
//               <NavMenuItem
//                 title={page.title}
//                 route={page.route}
//                 items={page.items}
//                 key={`${page.title}-${i}`}
//                 onClose={handleClose}
//                 test={test}
//               />
//             );
//           })}
//         </List>
//       </Menu>
//     </div>
//   );
// }
