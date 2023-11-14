import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Brightness4,
  Brightness7,
  ContactSupportRounded,
  CorporateFareRounded,
  FiberNewRounded,
  InboxRounded,
  KeyboardArrowDownRounded,
  ManageAccountsRounded,
  PageviewRounded,
  PasswordRounded,
  PersonRounded,
  PolicyRounded,
  RequestQuoteRounded,
  TuneRounded,
  WaterRounded,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { Link as RouterLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { MAPBOX_DARK, MAPBOX_LIGHT, usePreferredMapStyle } from 'components/MapStyleControl';
import { AuthActionsProvider, useAuthActions } from 'context';
import { useClaims } from 'hooks';
import { stringAvatar } from 'modules/utils';
import { ACCOUNT_ROUTES, ADMIN_ROUTES, AUTH_ROUTES, ROUTES, createPath } from 'router';
import { NavDrawer } from './NavDrawer';
import { NavListItem } from './NavListItem';
import { NavMenu as PopperNavMenu } from './NavMenu';

// TODO: GENERALIZE MENU COMPONENT - allow for button or user avatar as button. nested items. icons.
// could have optional render function to render button??
// combine with icon button menu ??

// TODO: implement ListItemLink component from https://mui.com/material-ui/react-breadcrumbs/#integration-with-react-router

const authenticatedNavPages = [
  {
    title: 'New Submission',
    route: createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),
    icon: <FiberNewRounded color='primary' fontSize='small' />,
  },
  {
    title: 'Submissions',
    route: createPath({ path: ROUTES.SUBMISSIONS }),
    icon: <PageviewRounded color='primary' fontSize='small' />,
  },
  {
    title: 'Quotes',
    route: createPath({ path: ROUTES.QUOTES }),
    icon: <RequestQuoteRounded color='primary' fontSize='small' />,
  },
  {
    title: 'Policies',
    route: createPath({ path: ROUTES.POLICIES }),
    icon: <PolicyRounded color='primary' fontSize='small' />,
  },
];

const adminNavPages = [
  ...authenticatedNavPages,
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
        title: 'Organizations',
        route: createPath({
          path: ADMIN_ROUTES.ORGANIZATIONS,
        }),
        icon: <CorporateFareRounded color='primary' fontSize='small' />,
      },
      {
        title: 'Users',
        route: createPath({
          path: ADMIN_ROUTES.USERS,
        }),
        icon: <PersonRounded color='primary' fontSize='small' />,
      },
      {
        title: 'Config',
        route: createPath({
          path: ADMIN_ROUTES.CONFIG,
        }),
        icon: <TuneRounded color='primary' fontSize='small' />,
        // TODO: add items ??
      },
    ],
  },
];

const agentNavPages = authenticatedNavPages;

export interface NavItem {
  title: string;
  route?: string;
  items?: { title: string; route: string }[];
  icon?: React.ReactNode;
}

export interface HeaderProps {}

export const Header = (props: HeaderProps) => {
  const theme = useTheme();
  // const { toggleColorMode: changeTheme } = useChangeTheme();
  const { mode, setMode } = useColorScheme();
  const [, setMapTheme] = usePreferredMapStyle(); // moved from themeContext when switching to css vars
  const navigate = useNavigate();
  const location = useLocation();
  const { user, claims } = useClaims();

  const userNavPages = useMemo(() => {
    const userPages = [
      {
        title: 'Quote',
        route: createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),
      },
    ];
    if (user) {
      userPages.push({
        title: 'Submissions',
        route: createPath({ path: ROUTES.SUBMISSIONS }),
      });
      userPages.push({
        title: 'Quotes',
        route: createPath({ path: ROUTES.QUOTES }),
      });

      if (!user.isAnonymous) {
        userPages.push({
          title: 'Policies',
          route: createPath({ path: ROUTES.POLICIES }),
        });
      }
    }

    return userPages;
  }, [user]);

  const navPages = useMemo<NavItem[]>(() => {
    if (!!claims?.iDemandAdmin) {
      return adminNavPages;
    }
    if (!!claims?.agent) {
      return agentNavPages;
    }

    return userNavPages;
  }, [claims, userNavPages]);

  const toggleTheme = useCallback(() => {
    setMapTheme(mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT);
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode]);

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
            <NavDrawer
              items={navPages}
              renderItem={({ title, route, items, icon, key }) => {
                return (
                  <NavListItem
                    title={title}
                    route={route}
                    items={items}
                    icon={icon}
                    key={key}
                    selected={
                      (route && !!matchPath({ path: route as string }, location.pathname)) || false
                    }
                    // handleClose={toggleDrawer}
                  />
                );
              }}
            />
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
                    items={page.items}
                    renderItem={({ route, title, handleClose }) => {
                      // matchPath(route, { path: key, exact: true });
                      let selected =
                        (route && !!matchPath({ path: route }, location.pathname)) || false;

                      return (
                        <ListItemButton
                          component={RouterLink as any}
                          to={route}
                          selected={selected}
                          key={route}
                          sx={{
                            py: 1,
                            px: 4,
                            '&.Mui-selected': {
                              borderRadius: 0,
                              border: '1px solid transparent',
                              borderColor: 'transparent !important',
                              '& .MuiListItemText-primary': {
                                fontWeight: 500,
                              },
                            },
                          }}
                          onClick={handleClose}
                        >
                          <ListItemText primary={title} sx={{ my: 1 }} />
                        </ListItemButton>
                      );
                    }}
                  />
                );
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

          {/* <Box sx={{ flexGrow: 0, flexShrink: 0 }}> */}
          <Box
            sx={{
              flexGrow: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <IconButton sx={{ mx: { xs: 1, sm: 2, md: 3 } }} onClick={toggleTheme} color='primary'>
              {theme.palette.mode === 'dark' ? (
                <Brightness7 fontSize='small' />
              ) : (
                <Brightness4 fontSize='small' />
              )}
            </IconButton>

            {!!user ? (
              // <UserMenu menuItems={settings} />
              <AuthActionsProvider>
                <Suspense fallback={<UserMenuSkeleton />}>
                  <UserMenu />
                </Suspense>
              </AuthActionsProvider>
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

export const AuthWrapper = ({
  children,
  fallback,
  ifAnonymousChildren,
}: React.PropsWithChildren<{
  fallback: JSX.Element;
  ifAnonymousChildren?: JSX.Element;
}>): JSX.Element => {
  const { data: signInCheckResult } = useSigninCheck();

  if (!children) {
    throw new Error('Children must be provided');
  }

  if (signInCheckResult.signedIn === true) {
    if (signInCheckResult.user.isAnonymous && ifAnonymousChildren) {
      return ifAnonymousChildren as JSX.Element;
    }
    return children as JSX.Element;
  } else {
    return fallback;
  }
};

const UserMenuSkeleton = () => {
  return (
    <Skeleton variant='circular'>
      <Avatar />
    </Skeleton>
  );
};

interface UserMenuProps {
  // user: User;
  // menuItems: { label: string; onClick: () => void; icon?: JSX.Element }[];
}

const UserMenu = (props: UserMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // TODO: use suspense ??
  const { data: authCheckResult } = useSigninCheck({ suspense: false });
  const { logout } = useAuthActions();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // setOpen(true);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
    // setOpen(false);
  };

  useEffect(() => {
    if (open) {
      handleCloseMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const settings = useMemo(() => {
    let sItems: { label: string; onClick: () => void; icon?: JSX.Element }[] = [
      {
        label: 'Contact Us',
        onClick: () => navigate(createPath({ path: ROUTES.CONTACT })),
        icon: <ContactSupportRounded color='inherit' fontSize='small' />,
      },
    ];

    if (authCheckResult?.user && !authCheckResult?.user?.isAnonymous)
      sItems.unshift({
        label: 'Account Settings',
        onClick: () => navigate(createPath({ path: ACCOUNT_ROUTES.ACCOUNT })),
        icon: <ManageAccountsRounded fontSize='small' />,
      });

    if (authCheckResult?.user?.isAnonymous) {
      sItems.push({
        label: 'Create Account',
        onClick: () =>
          navigate(createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }), { state: { from: location } }),
        icon: <PersonRounded fontSize='small' />,
      });
      sItems.push({
        label: 'Have an account? Login',
        onClick: () =>
          navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { state: { from: location } }),
        icon: <PasswordRounded fontSize='small' />,
      });
    }

    return sItems;
  }, [navigate, location, authCheckResult]);

  return (
    <>
      <Tooltip title='Open settings'>
        <IconButton
          onClick={handleOpenMenu}
          sx={{ p: 0 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup='true'
          aria-expanded={open ? 'true' : undefined}
        >
          {authCheckResult?.user?.photoURL ? (
            <Avatar
              alt={authCheckResult?.user?.displayName || undefined}
              src={authCheckResult?.user?.photoURL || ''}
            />
          ) : null}

          {!authCheckResult?.user?.photoURL && authCheckResult?.user?.displayName ? (
            <Avatar {...stringAvatar(authCheckResult!.user!.displayName)} />
          ) : null}

          {!authCheckResult.user ||
          !(authCheckResult.user?.displayName || authCheckResult?.user?.photoURL) ? (
            <Avatar />
          ) : null}
        </IconButton>
      </Tooltip>

      <Menu
        sx={{ mt: '45px', minWidth: 240, maxWidth: 340 }}
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
        open={open}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
      >
        <Box sx={{ px: 4, py: 3 }}>
          <Suspense
            fallback={
              <>
                <Skeleton variant='text' sx={{ fontSize: '1rem' }} />
                <Skeleton variant='text' sx={{ fontSize: '0.75rem' }} />
              </>
            }
          >
            <AuthWrapper fallback={<Typography>Not signed in</Typography>}>
              {authCheckResult?.user?.displayName ? (
                <Typography fontWeight={500}>{authCheckResult?.user.displayName}</Typography>
              ) : null}
              {authCheckResult?.user?.email ? (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                >
                  {authCheckResult?.user.email}
                </Typography>
              ) : null}
              {authCheckResult?.user?.isAnonymous ? (
                <>
                  <Typography
                    variant='body1'
                    onClick={() => {
                      handleCloseMenu();
                      navigate(createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }), {
                        state: { from: location },
                      });
                    }}
                    sx={{ pb: 1, '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
                  >
                    Create an account to save progress
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                  >{`User ID: ${authCheckResult.user.uid}`}</Typography>
                </>
              ) : null}
            </AuthWrapper>
          </Suspense>
        </Box>
        <Divider sx={{ my: 0 }} />
        {settings.map((item: any) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              handleCloseMenu();
              item.onClick();
            }}
          >
            <ListItemIcon>{item.icon && item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
        <Divider sx={{ my: 0 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
          <Suspense fallback={<Skeleton variant='rounded' width={80} height={36} />}>
            <AuthWrapper
              fallback={
                <Button
                  size='small'
                  onClick={() => {
                    handleCloseMenu();
                    navigate(createPath({ path: AUTH_ROUTES.LOGIN }), {
                      state: { from: location },
                    });
                  }}
                >
                  Sign In
                </Button>
              }
            >
              <Button
                size='small'
                onClick={() => {
                  handleCloseMenu();
                  logout();
                }}
              >
                Logout
              </Button>
            </AuthWrapper>
          </Suspense>
        </Box>
      </Menu>
    </>
  );
};

/* <Box sx={{ minWidth: 30 }}>{item.icon && item.icon}</Box> */

/* <Typography textAlign='center' color='text.primary'>
              {item.label}
            </Typography> */

// interface NavMenuProps {
//   title: string;
//   menuItems: { title: string; route: string }[];
// }
// // TODO: fix menu open bug
// const NavMenu<NavMenuProps> = ({ title, menuItems }) => {
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
