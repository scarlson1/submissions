import React, { useMemo } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  WaterRounded,
  KeyboardArrowDownRounded,
  FiberNewRounded,
  PageviewRounded,
  RequestQuoteRounded,
  PolicyRounded,
  InboxRounded,
  AccountBalanceRounded,
  PublicRounded,
  BlockRounded,
  PlagiarismRounded,
  SourceRounded,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

import { useChangeTheme } from 'modules/components/ThemeContext';
import { useAuth } from 'modules/components/AuthContext';
import { ROUTES, ADMIN_ROUTES, createPath, AUTH_ROUTES, ACCOUNT_ROUTES } from 'router';
import { User } from 'firebase/auth';
import { NavListItem } from './NavListItem';
import { NavMenu as PopperNavMenu } from './NavMenu';
import { NavDrawer } from './NavDrawer';

// TODO: GENERALIZE MENU COMPONENT - allow for button or user avatar as button. nested items. icons.
// could have optional render function to render button??
// combine with icon button menu ??

// TODO: implement ListItemLink component from https://mui.com/material-ui/react-breadcrumbs/#integration-with-react-router

export interface NavItem {
  title: string;
  route?: string;
  items?: { title: string; route: string }[];
  icon?: React.ReactNode;
}

export interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const theme = useTheme();
  const changeTheme = useChangeTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customClaims, logout } = useAuth();

  const adminNavPages = useMemo(
    () => [
      {
        title: 'New Submission',
        route: createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),
        icon: <FiberNewRounded color='primary' fontSize='small' />,
      },
      {
        title: 'Submissions',
        route: createPath({ path: ADMIN_ROUTES.SUBMISSIONS }),
        icon: <PageviewRounded color='primary' fontSize='small' />,
      },
      {
        title: 'Quotes',
        route: createPath({ path: ADMIN_ROUTES.QUOTES }),
        icon: <RequestQuoteRounded color='primary' fontSize='small' />,
      },
      {
        title: 'Policies',
        route: createPath({ path: ADMIN_ROUTES.POLICIES }),
        icon: <PolicyRounded color='primary' fontSize='small' />,
      },
      {
        title: 'More',
        items: [
          {
            title: 'Agency Apps',
            route: createPath({
              path: ADMIN_ROUTES.AGENCY_APPS,
            }),
            icon: <InboxRounded color='primary' fontSize='small' />,
          },
          {
            title: 'Taxes',
            route: createPath({ path: ADMIN_ROUTES.SL_TAXES }),
            icon: <AccountBalanceRounded color='primary' fontSize='small' />,
          },
          {
            title: 'States',
            route: createPath({
              path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
              params: { productId: 'flood' },
            }),
            icon: <PublicRounded color='primary' fontSize='small' />,
          },
          {
            title: 'Moratoriums',
            route: createPath({
              path: ADMIN_ROUTES.MORATORIUMS,
            }),
            icon: <BlockRounded color='primary' fontSize='small' />,
          },
          {
            title: 'Licenses',
            route: createPath({
              path: ADMIN_ROUTES.SL_LICENSES,
            }),
            icon: <SourceRounded color='primary' fontSize='small' />,
          },
          {
            title: 'Disclosures',
            route: createPath({
              path: ADMIN_ROUTES.DISCLOSURES,
            }),
            icon: <PlagiarismRounded color='primary' fontSize='small' />,
          },
        ],
      },
    ],
    []
  );

  const userNavPages = useMemo(() => {
    const userPages = [
      {
        title: 'Quote',
        route: createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),
      },
    ];
    if (user)
      userPages.push({
        title: 'Submissions',
        route: createPath({ path: ROUTES.SUBMISSIONS }),
      });
    return userPages;
  }, [user]);

  const navPages = useMemo<NavItem[]>(() => {
    if (!!customClaims.iDemandAdmin) {
      return adminNavPages;
    }
    return userNavPages;
  }, [customClaims.iDemandAdmin, adminNavPages, userNavPages]);

  const settings = useMemo(() => {
    let sItems = [
      {
        label: 'Contact Us',
        onClick: () => navigate(createPath({ path: ROUTES.CONTACT })),
      },
    ];

    if (user && !user.isAnonymous)
      sItems.unshift({
        label: 'Account Settings',
        onClick: () => navigate(createPath({ path: ACCOUNT_ROUTES.ACCOUNT })),
      });

    if (user?.isAnonymous) {
      sItems.push({
        label: 'Create Account',
        onClick: () => navigate(createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT })),
      });
      sItems.push({
        label: 'Login',
        onClick: () =>
          navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { state: { from: location } }),
      });
    }
    sItems.push({ label: 'Logout', onClick: logout });

    return sItems;
  }, [logout, navigate, location, user]);

  return (
    <AppBar
      position='static'
      elevation={0}
      sx={{
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <WaterRounded
            sx={{
              display: { xs: 'none', md: 'flex' },
              mr: 2,
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,

              '&:hover': {
                cursor: 'pointer',
              },
            }}
            onClick={() => navigate('/')}
          />
          <Typography
            variant='h6'
            noWrap
            onClick={() => navigate('/')}
            sx={{
              mr: 4,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.24rem',
              // color: 'inherit',
              color: 'text.primary',
              textDecoration: 'none',
              textTransform: 'uppercase',
              '&:hover': {
                cursor: 'pointer',
              },
            }}
          >
            iDemand
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <NavDrawer>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: '1 1 auto' }}>
                  <List sx={{ minWidth: 260, maxWidth: 280, p: 3 }}>
                    {navPages?.map((item, i) => (
                      <NavListItem
                        title={item.title}
                        route={item.route}
                        items={item.items}
                        icon={item.icon}
                        key={`${item.title}-${i}`}
                        selected={
                          (item.route && !!matchPath({ path: item.route }, location.pathname)) ||
                          false
                        }
                      />
                    ))}
                  </List>
                </Box>
                <Typography>Contact us</Typography>
              </Box>
            </NavDrawer>
          </Box>
          <WaterRounded
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 2,
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
              '&:hover': {
                cursor: 'pointer',
              },
            }}
            onClick={() => navigate('/')}
          />
          <Typography
            variant='h5'
            noWrap
            onClick={() => navigate('/')}
            sx={{
              mr: '-34px',
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.24rem',
              color: 'text.primary',
              textDecoration: 'none',
              textTransform: 'uppercase',
              '&:hover': {
                cursor: 'pointer',
              },
            }}
          >
            iDemand
          </Typography>
          <Box
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {navPages?.map((page, i) => {
              if (page.hasOwnProperty('items') && page.items) {
                return (
                  <PopperNavMenu
                    btnTitle={page.title}
                    key={`${page.title}-${i}`}
                    btnProps={{
                      endIcon: <KeyboardArrowDownRounded />,
                      sx: {
                        my: 2,
                        color: (theme) =>
                          theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                        whiteSpace: 'nowrap',
                      },
                    }}
                  >
                    <List sx={{ minWidth: 160, maxWidth: 260 }} dense>
                      {page.items.map((i) => (
                        <ListItemButton
                          component={RouterLink as any}
                          to={i.route}
                          // selected={}
                          key={i.route}
                          sx={{ py: 1, px: 4 }}
                        >
                          <ListItemText primary={i.title} sx={{ my: 1 }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </PopperNavMenu>
                );
                // return (
                //   <NavMenu title={page.title} menuItems={page.items} key={`${page.title}-${i}`} />
                // );
              }
              if (!page.route) return null;

              return (
                <Button
                  key={page.title}
                  onClick={() => page.route && navigate(page.route)}
                  sx={{
                    my: 2,
                    display: 'block',
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {page.title}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flexGrow: 0, flexShrink: 0 }}>
            <IconButton sx={{ mx: { xs: 1, sm: 2, md: 3 } }} onClick={changeTheme} color='primary'>
              {theme.palette.mode === 'dark' ? (
                <Brightness7 fontSize='small' />
              ) : (
                <Brightness4 fontSize='small' />
              )}
            </IconButton>

            {!!user ? (
              <UserMenu user={user} menuItems={settings} />
            ) : (
              <Button
                onClick={() =>
                  navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { state: { from: location } })
                }
                sx={{ maxHeight: 34 }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;

interface UserMenuProps {
  user: User;
  menuItems: { label: string; onClick: () => void }[];
}

const UserMenu: React.FC<UserMenuProps> = ({ user, menuItems }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title='Open settings'>
        <IconButton onClick={handleOpenMenu} sx={{ p: 0 }}>
          <Avatar alt={user.displayName || undefined} src={user.photoURL || ''} />
        </IconButton>
      </Tooltip>

      <Menu
        sx={{ mt: '45px' }}
        id='account-menu'
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              item.onClick();
              handleCloseMenu();
            }}
          >
            <Typography textAlign='center' color='text.primary'>
              {item.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// interface NavMenuProps {
//   title: string;
//   menuItems: { title: string; route: string }[];
// }
// // TODO: fix menu open bug
// const NavMenu: React.FC<NavMenuProps> = ({ title, menuItems }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const open = Boolean(anchorEl);

//   const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   }, []);
//   const handleClose = useCallback(() => {
//     setAnchorEl(null);
//   }, []);

//   return (
//     <div>
//       <div>
//         <Button
//           onClick={handleOpen}
//           variant='text'
//           endIcon={<KeyboardArrowDownRounded />}
//           sx={{
//             my: 2,
//             color: (theme) =>
//               theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
//             whiteSpace: 'nowrap',
//           }}
//         >
//           {title}
//         </Button>
//       </div>
//       {/* {open && ( */}
//       <Menu
//         id={`menu-nav-md-${title}`}
//         anchorEl={anchorEl}
//         keepMounted
//         open={open}
//         onClose={handleClose}
//         onClick={handleClose}
//         // MenuListProps={{ dense: true }}
//         PaperProps={{ style: { minWidth: 200, maxWidth: 300 } }}
//       >
//         {menuItems.map((item) => (
//           <MenuItem
//             key={`nav-${title}-${item.title}`}
//             onClick={() => {
//               handleClose();
//               navigate(item.route);
//             }}
//             selected={!!matchPath({ path: item.route }, location.pathname)}
//           >
//             <Typography textAlign='center' color='text.primary'>
//               {item.title}
//             </Typography>
//           </MenuItem>
//         ))}
//       </Menu>
//       {/* )} */}
//     </div>
//   );
// };
