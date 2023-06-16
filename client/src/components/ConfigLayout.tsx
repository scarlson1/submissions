import React, { useCallback, useState } from 'react';
// import { TabContext, TabList } from '@mui/lab';
import { Box, Tab, TabProps, Tabs } from '@mui/material';
import {
  Outlet,
  Link as RouterLink,
  // matchPath
} from 'react-router-dom'; // LinkProps,
import { ADMIN_ROUTES, createPath } from 'router';

// https://mui.com/material-ui/react-tabs/#nav-tabs

interface LinkTabProps extends Omit<TabProps, 'href' | 'component'> {
  label?: string;
  to: string;
}

function LinkTab(props: LinkTabProps) {
  return (
    <Tab
      // {...props}// TODO: fix ts error when passing along props
      component={RouterLink}
      to={props.to}
      onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        event.preventDefault();
      }}
    />
  );
}

export const ConfigLayout: React.FC = () => {
  const [value, setValue] = useState(0); // TODO: get state from url

  const handleChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    console.log('TAB CHANGE: ', event, newValue);
    setValue(newValue);
  }, []);

  return (
    <Box>
      <Tabs value={value} onChange={handleChange}>
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
      </Tabs>
      <Box>
        <Outlet />
      </Box>
    </Box>
  );
};

/* <TabContext value={value}>
        <Box>
          <TabList onChange={handleChange} scrollButtons='auto' variant='scrollable'> */

//     </TabList>
//   </Box>
// </TabContext>
