import { Suspense, useEffect, useMemo, useState } from 'react';

// import { TabContext, TabList } from '@mui/lab';
import { Box, Tab, TabProps, Tabs } from '@mui/material';
import { Outlet, Link as RouterLink, useLocation, matchPath } from 'react-router-dom';

import { ADMIN_ROUTES, createPath } from 'router';
import { LoadingComponent } from './Layout';

// https://mui.com/material-ui/react-tabs/#nav-tabs

interface LinkTabProps extends Omit<TabProps, 'href' | 'component'> {
  label: React.ReactNode;
  to: string;
}

function LinkTab({ to, label, ...props }: LinkTabProps) {
  // TODO: fix ts error when passing along props
  return (
    // @ts-ignore
    <Tab
      label={label}
      component={RouterLink}
      to={to}
      {...props}
      // onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      //   event.preventDefault();
      // }}
    />
  );
}

const getTab = (currPath: string, pathsArr: string[], isRetry: boolean = false): number => {
  for (const [i, p] of pathsArr.entries()) {
    if (matchPath({ path: p }, currPath)) return i;
  }

  let currPathArr = currPath.split('/').filter((x) => x);
  if (currPathArr.length > 3 && !isRetry) {
    let first3 = currPathArr.slice(0, 3);

    return getTab(`/${first3.join('/')}`, pathsArr, true);
  }

  return 0;
};

const MIN_TAB_HEIGHT = 40;

export const ConfigLayout = () => {
  const location = useLocation();
  const paths = useMemo(
    () => [
      createPath({ path: ADMIN_ROUTES.SL_TAXES }),
      createPath({
        path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
        params: { productId: 'flood' },
      }),
      createPath({ path: ADMIN_ROUTES.MORATORIUMS }),
      createPath({ path: ADMIN_ROUTES.SL_LICENSES }),
      createPath({ path: ADMIN_ROUTES.DISCLOSURES }),
      createPath({ path: ADMIN_ROUTES.DATA_IMPORTS }),
    ],
    []
  );
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(getTab(location.pathname, paths));
  }, [location, paths]);

  // const handleChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
  //   console.log('TAB CHANGE: ', event, newValue);
  //   setValue(newValue);
  // }, []);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          // onChange={handleChange}
          sx={{
            minHeight: MIN_TAB_HEIGHT,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: MIN_TAB_HEIGHT,
              p: 2,
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            },
          }}
          scrollButtons='auto'
          variant='scrollable'
        >
          <LinkTab label='Taxes' to={createPath({ path: ADMIN_ROUTES.SL_TAXES })} />
          <LinkTab
            label='States'
            to={createPath({
              path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
              params: { productId: 'flood' },
            })}
          />
          <LinkTab label='Moratoriums' to={createPath({ path: ADMIN_ROUTES.MORATORIUMS })} />
          <LinkTab label='Licenses' to={createPath({ path: ADMIN_ROUTES.SL_LICENSES })} />
          <LinkTab label='Disclosures' to={createPath({ path: ADMIN_ROUTES.DISCLOSURES })} />
          <LinkTab label='Imports' to={createPath({ path: ADMIN_ROUTES.DATA_IMPORTS })} />
        </Tabs>
      </Box>
      <Box sx={{ py: { xs: 2, md: 3 } }}>
        <Suspense fallback={<LoadingComponent />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};
