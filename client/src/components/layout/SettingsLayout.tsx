import { Unstable_Grid2 as Grid, List, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

interface SettingsLayoutProps {
  navItems: string[]; // TODO: nav items type (obj with url, icon etc. see mui AppNavDrawerItem component)
}

export const SettingsLayout = ({ navItems }: SettingsLayoutProps) => {
  return (
    <Grid container spacing={5}>
      <Grid xs={4} md={3} display={{ xs: 'none', lg: 'block' }}>
        <List>
          {navItems.map((i) => (
            // <AppNavDrawerItem></AppNavDrawerItem>
            <Typography key={i}>{i}</Typography>
          ))}
        </List>
      </Grid>
      <Grid xs>
        <Outlet />
      </Grid>
    </Grid>
  );
};
