import React from 'react';
import { Box } from '@mui/material';
import ReactJson from '@microlink/react-json-view';

import { useCollectionGroupData, useJsonTheme } from 'hooks';
import { InvitesGrid } from 'elements';
import { Invite } from 'common';

// TODO: use tabs (company details, users, invites, etc, policies, quotes, settings, banking, etc.)

export const Organization: React.FC = () => {
  // TODO: filter by org ID
  const { data, status } = useCollectionGroupData<Invite>('INVITES', [], { suspense: false });
  const theme = useJsonTheme();

  return (
    <Box>
      <Box
        sx={{
          typography: 'body2',
        }}
      >
        <ReactJson
          src={data}
          style={{ backgroundColor: 'inherit' }}
          theme={theme}
          // theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          iconStyle='circle'
          // enableClipboard={(data) => copy(data.src, true)}
          collapseStringsAfterLength={30}
        />
      </Box>
      <InvitesGrid data={data} loading={status === 'loading'} />
    </Box>
  );
};
