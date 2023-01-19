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
} from '@mui/material';
import { MenuRounded, Brightness4, Brightness7, WaterRounded } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { useChangeTheme } from 'modules/components/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'modules/components/AuthContext';
import { ROUTES, ADMIN_ROUTES, createPath } from 'router';
import { User } from 'firebase/auth';

export interface NavItem {
  title: string;
  route: string;
}

interface UserMenuProps {
  user: User;
  menuItems: { label: string; onClick: () => void }[];
}

const UserMenu: React.FC<UserMenuProps> = ({ user, menuItems }) => {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <>
      <Tooltip title='Open settings'>
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
          <Avatar alt={user.displayName || undefined} src={user.photoURL || ''} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id='menu-appbar'
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => {
              item.onClick();
              handleCloseUserMenu();
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

export interface HeaderProps {
  // navItems?: NavItem[];
}

export const Header: React.FC<HeaderProps> = () => {
  const theme = useTheme();
  const changeTheme = useChangeTheme();
  const navigate = useNavigate();
  const { user, customClaims, logout } = useAuth();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

  const adminNavPages = useMemo(
    () => [
      {
        title: 'Quote',
        route: createPath({ path: ROUTES.SUBMISSION_NEW }),
      },
      {
        title: 'Submissions',
        route: createPath({ path: ADMIN_ROUTES.SUBMISSIONS }),
      },
    ],
    []
  );

  const userNavPages = useMemo(
    () => [
      {
        title: 'Quote',
        route: createPath({ path: ROUTES.SUBMISSION_NEW }),
      },
      // {
      //   title: 'Contact Us',
      //   route: createPath({ path: ROUTES.CONTACT }),
      // },
    ],
    []
  );

  const navPages = useMemo(() => {
    if (!!customClaims.iDemandAdmin) {
      return adminNavPages;
    }
    return userNavPages;
  }, [customClaims.iDemandAdmin, adminNavPages, userNavPages]);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const settings = useMemo(
    () => [
      // { label: 'Website', onClick: () => {} },
      { label: 'Logout', onClick: logout },
    ],
    [logout]
  );

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
            <IconButton
              size='large'
              aria-label='account of current user'
              aria-controls='menu-appbar'
              aria-haspopup='true'
              onClick={handleOpenNavMenu}
              // color='inherit'
            >
              <MenuRounded />
            </IconButton>
            <Menu
              id='menu-appbar'
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navPages?.map((page) => (
                <MenuItem key={page.title} onClick={() => navigate(page.route)}>
                  <Typography textAlign='center' color='text.primary'>
                    {page.title}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
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
              mr: 4,
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
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navPages?.map((page) => (
              <Button
                key={page.title}
                onClick={() => navigate(page.route)}
                sx={{
                  my: 2,
                  display: 'block',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <IconButton sx={{ mx: { xs: 1, sm: 2, md: 3 } }} onClick={changeTheme} color='primary'>
              {theme.palette.mode === 'dark' ? (
                <Brightness7 fontSize='small' />
              ) : (
                <Brightness4 fontSize='small' />
              )}
            </IconButton>

            {!!user && <UserMenu user={user} menuItems={settings} />}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
export default Header;
