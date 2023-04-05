import React from 'react';
import { Box } from '@mui/material';
import ReactJson from '@microlink/react-json-view';

import { useCollectionData, useJsonTheme } from 'hooks';
import { InvitesGrid } from 'elements';
import { COLLECTIONS, Invite } from 'common';
import { useParams } from 'react-router-dom';
import { limit } from 'firebase/firestore';

// TODO: use tabs (company details, users, invites, etc, policies, quotes, settings, banking, etc.)

export const Organization: React.FC = () => {
  const { orgId } = useParams();
  const { data, status } = useCollectionData<Invite>(
    'ORGANIZATIONS',
    [limit(100)],
    { suspense: false },
    [`${orgId}`, COLLECTIONS.INVITES]
  );
  // const { data, status } = useCollectionGroupData<Invite>('INVITES', [where()], { suspense: false });
  const theme = useJsonTheme();

  return (
    <Box>
      <InvitesGrid data={data} loading={status === 'loading'} />
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
    </Box>
  );
};
