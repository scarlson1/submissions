import React, { useState } from 'react';
import { Box, Tab } from '@mui/material';
import ReactJson from '@microlink/react-json-view';

import { useCollectionData, useJsonTheme } from 'hooks';
import { InvitesGrid, UsersGrid } from 'elements';
import { COLLECTIONS, Invite } from 'common';
import { useParams } from 'react-router-dom';
import { limit, where } from 'firebase/firestore';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// TODO: use tabs (company details, users, invites, etc, policies, quotes, settings, banking, etc.)

const MIN_TAB_HEIGHT = 40;

export const Organization: React.FC = () => {
  const { orgId } = useParams();
  const [tabValue, setTabValue] = useState('invites');
  const { data: invites, status } = useCollectionData<Invite>(
    'ORGANIZATIONS',
    [limit(100)],
    { suspense: false },
    [`${orgId}`, COLLECTIONS.INVITES]
  );
  // const { data, status } = useCollectionGroupData<Invite>('INVITES', [where()], { suspense: false });
  const theme = useJsonTheme();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ width: '100%', typography: 'body2' }}>
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={handleChange}
              aria-label='organization details tabs'
              sx={{
                minHeight: MIN_TAB_HEIGHT,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 400,
                  minHeight: MIN_TAB_HEIGHT,
                  p: 2,
                  fontFamily:
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
                },
              }}
            >
              <Tab label='Policies' value='policies' />
              <Tab label='Quotes' value='quotes' />
              <Tab label='Insureds' value='insureds' />
              <Tab label='Team' value='team' />
              <Tab label='Invites' value='invites' />
            </TabList>
          </Box>
          <TabPanel value='policies'>Policies contents</TabPanel>
          <TabPanel value='quotes'>Quotes tab content</TabPanel>
          <TabPanel value='insureds'>Insureds tab content</TabPanel>
          <TabPanel value='team'>
            <UsersGrid queryConstraints={[where('orgId', '==', orgId)]} />
          </TabPanel>
          <TabPanel value='invites'>
            <InvitesGrid data={invites} loading={status === 'loading'} />
            <Box
              sx={{
                typography: 'body2',
              }}
            >
              <ReactJson
                src={invites}
                style={{ backgroundColor: 'inherit' }}
                theme={theme}
                iconStyle='circle'
                collapseStringsAfterLength={30}
              />
            </Box>
          </TabPanel>
        </TabContext>
      </Box>
    </Box>
  );
};
