import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from '@mui/material';
import { Adb, MenuRounded, Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { useChangeTheme } from 'modules/components/ThemeContext';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from 'modules/components/AuthContext';

const pages = [
  {
    title: 'Quote',
    route: 'quote',
  },
  {
    title: 'Contact Us',
    route: 'contact',
  },
];
const settings = ['Website', 'Logout']; // ['Profile', 'Account', 'Dashboard', 'Logout'];

export const Header: React.FC = () => {
  const theme = useTheme();
  const changeTheme = useChangeTheme();
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

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
          <Adb
            sx={{
              display: { xs: 'none', md: 'flex' },
              mr: 1,
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          />
          <Typography
            variant='h6'
            noWrap
            onClick={() => navigate('/')}
            // component='a'
            // href='/'
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
              {pages.map((page) => (
                <MenuItem key={page.title} onClick={() => navigate(page.route)}>
                  <Typography textAlign='center' color='text.primary'>
                    {page.title}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Adb
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 1,
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          />
          <Typography
            variant='h5'
            noWrap
            onClick={() => navigate('/')}
            // component='a'
            // href=''
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
            }}
          >
            iDemand
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
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
            <IconButton
              sx={{ mx: { xs: 1, sm: 1.5, md: 2 } }}
              onClick={changeTheme}
              color='primary'
            >
              {theme.palette.mode === 'dark' ? (
                <Brightness7 fontSize='small' />
              ) : (
                <Brightness4 fontSize='small' />
              )}
            </IconButton>
            <Tooltip title='Open settings'>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt='Remy Sharp' src='/static/images/avatar/2.jpg' />
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
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography textAlign='center' color='text.primary'>
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
export default Header;
