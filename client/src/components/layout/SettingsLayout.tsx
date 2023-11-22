import { Unstable_Grid2 as Grid, List } from '@mui/material';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet, useLocation } from 'react-router-dom';

import { ErrorFallback } from 'components/ErrorFallback';
import { NavItem } from './Header';
import { LoadingComponent } from './Layout';
import { NavListItem } from './NavListItem';

interface SettingsLayoutProps {
  navItems: NavItem[]; // TODO: nav items type (obj with url, icon etc. see mui AppNavDrawerItem component)
}

export const SettingsLayout = ({ navItems }: SettingsLayoutProps) => {
  const location = useLocation();

  return (
    <Grid container spacing={8}>
      <Grid xs={4} md={3} display={{ xs: 'none', sm: 'block' }}>
        <List>
          {navItems.map((i) => (
            // <AppNavDrawerItem></AppNavDrawerItem>
            <NavListItem
              key={`${i.title}-${i.route}`}
              title={i.title}
              route={i.route}
              selected={i.route ? location.pathname.includes(i.route) : false}
              dense
              // selected={
              //   (i.route && !!matchPath({ path: i.route! as string }, location.pathname)) || false
              // }
            />
          ))}
        </List>
      </Grid>
      <Grid xs>
        <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
          <Suspense fallback={<LoadingComponent />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </Grid>
    </Grid>
  );
};
