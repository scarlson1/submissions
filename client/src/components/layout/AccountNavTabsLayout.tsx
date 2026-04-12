import { Box, Tabs } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ClaimsGuard } from 'components/ClaimsGuard';
import { LinkTab } from 'components/layout/ConfigLayout';
import { ACCOUNT_ROUTES, createPath } from 'router';

// TODO: MOVE TABS LAYOUT TO LAYOUTS FOLDER
// Use this component to display user profile at the top, with an outlet for the tabs nav

const MIN_TAB_HEIGHT = 40;

export const AccountNavTabsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  const paths = useMemo(
    () => [
      createPath({ path: ACCOUNT_ROUTES.USER_SETTINGS }),
      createPath({ path: ACCOUNT_ROUTES.ORG_SETTINGS }),
    ],
    [],
  );

  // subpath links are relative --> need to redirect if only /account
  useEffect(() => {
    // createPath({ path: ACCOUNT_ROUTES.ACCOUNT })
    if (location.pathname === '/account') navigate('user');
  }, [navigate, location]);

  // TODO: better tab matching (assumes first two elements are exclusive within paths)
  useEffect(() => {
    // setValue(getTab(location.pathname, paths));
    let firstTwo = location.pathname
      .split('/')
      .filter((x) => x)
      .slice(0, 2)
      .join('/');

    const tabIndex = paths.indexOf(`/${firstTwo}`);
    setValue(tabIndex === -1 ? 0 : tabIndex);
  }, [location]);

  return (
    <Box>
      <Box
        sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 2, md: 3 } }}
      >
        <Tabs
          value={value}
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
          <LinkTab
            label='User'
            to={createPath({ path: ACCOUNT_ROUTES.USER_SETTINGS })}
          />
          <ClaimsGuard
            requiredClaims={['iDemandAdmin', 'orgAdmin']}
            requireAll={false}
          >
            <LinkTab
              label='Org'
              to={createPath({ path: ACCOUNT_ROUTES.ORG_SETTINGS })}
            />
          </ClaimsGuard>
        </Tabs>
      </Box>
      <Outlet />
    </Box>
  );
};
