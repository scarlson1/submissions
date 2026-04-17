import {
  GridViewRounded,
  MapRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Avatar, Box, Tab, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { User } from '@idemand/common';
import { VIEW_QUERY_KEY } from 'common';
import { Copy } from 'components';
import { ToggleViewLayout, ToggleViewPanel } from 'components/toggleView';
import { QuoteCards } from 'elements';
import { PolicyCards, SubmissionCards } from 'elements/cards';
import { PoliciesGrid, QuotesGrid, SubmissionsGrid } from 'elements/grids';
import { PoliciesMap, QuotesMap, SubmissionsMap } from 'elements/maps';
import { DataViewType, TDataViewType, useDocData, useSafeParams } from 'hooks';
import { formatDate } from 'modules/utils';
import { createPath, ROUTES } from 'router';

// TODO: handle queries depending on whether user is insured or agent
// query user policies based on userId or insured.userId ??

export const UserDetails = () => {
  const { userId } = useSafeParams(['userId']);
  const [value, setValue] = useState('policies');

  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
    },
    [],
  );

  return (
    <Box>
      <Box>
        <UserInfo userId={userId} />
      </Box>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label='record type'>
            <Tab value='submissions' label='Submissions' />
            <Tab value='quotes' label='Quotes' />
            <Tab value='policies' label='Policies' />
          </TabList>
        </Box>
        <ToggleViewLayout<TDataViewType>
          queryKey={VIEW_QUERY_KEY}
          options={DataViewType.options}
          icons={{
            cards: <GridViewRounded />,
            grid: <TableRowsRounded />,
            map: <MapRounded />,
          }}
          defaultOption='cards'
          headerContainerSx={{ pb: 1, pt: 2, pr: 3 }}
        >
          <TabPanel value='submissions'>
            <UserSubmissions userId={userId} />
          </TabPanel>
          <TabPanel value='quotes'>
            <UserQuotes userId={userId} />
          </TabPanel>
          <TabPanel value='policies'>
            <UserPolicies userId={userId} />
          </TabPanel>
        </ToggleViewLayout>
      </TabContext>
    </Box>
  );
};

// PRE_DEPLOY: get photo from user doc -- not auth photo
// need to sync photo url to user doc when auth profile is changed
function UserInfo({ userId }: { userId: string }) {
  const { data } = useDocData<User>('users', userId);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Avatar
        alt={data.displayName}
        // src={authUser?.photoURL || undefined}
        src={data?.photoURL || undefined}
        sx={{
          width: { xs: 48, sm: 56, md: 60, lg: 64 },
          height: { xs: 48, sm: 56, md: 60, lg: 64 },
          mr: { xs: 3, sm: 5, md: 6 },
        }}
      />
      <Box>
        <Typography variant='h6'>{data?.displayName}</Typography>
        <Typography variant='subtitle2' color='text.secondary'>
          {data?.email}
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mr: 1, fontSize: '0.725rem' }}
          >
            User&nbsp;ID:
          </Typography>
          <Copy value={userId} textProps={{ sx: { fontSize: '0.725rem' } }}>
            {userId}
          </Copy>
        </Box>
      </Box>
      {/* TODO: get org details ?? (or use useUser custom hook with rxjs) */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'block' },
          ml: 'auto',
          alignSelf: 'flex-start',
        }}
      >
        <Typography
          variant='body2'
          align='right'
          sx={{ fontSize: '0.725rem' }}
        >{`Joined: ${formatDate(data.metadata.created.toDate())}`}</Typography>
        {data.orgId ? (
          <Typography
            variant='body2'
            align='right'
            sx={{ fontSize: '0.725rem' }}
          >{`Org ID: ${data.orgId}`}</Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function UserPolicies({ userId }: { userId: string }) {
  const navigate = useNavigate();

  // TODO: query params different for agent vs user ??
  // abstract to user context ??

  const handleViewPolicy = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate],
  );

  return (
    <>
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <PolicyCards
          constraints={[where('namedInsured.userId', '==', userId)]}
          onClick={handleViewPolicy}
        />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        <PoliciesGrid
          constraints={[where('namedInsured.userId', '==', userId)]}
        />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <PoliciesMap
          constraints={[where('namedInsured.userId', '==', userId)]}
        />
      </ToggleViewPanel>
    </>
  );
}

function UserQuotes({ userId }: { userId: string }) {
  const navigate = useNavigate();

  const handleViewQuote = useCallback(
    (quoteId: string) => {
      navigate(
        createPath({
          path: ROUTES.QUOTE_VIEW,
          params: { quoteId },
        }),
      );
    },
    [navigate],
  );

  return (
    <>
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <QuoteCards
          constraints={[where('userId', '==', userId)]}
          onClick={handleViewQuote}
        />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        <QuotesGrid
          constraints={[where('userId', '==', userId)]}
          // renderActions={renderActions}
          onRowDoubleClick={(params) => handleViewQuote(params.id.toString())}
        />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <QuotesMap constraints={[where('userId', '==', `${userId}`)]} />
      </ToggleViewPanel>
    </>
  );
}

function UserSubmissions({ userId }: { userId: string }) {
  return (
    <>
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <SubmissionCards constraints={[where('userId', '==', userId)]} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        <SubmissionsGrid constraints={[where('userId', '==', userId)]} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <SubmissionsMap constraints={[where('userId', '==', userId)]} />
      </ToggleViewPanel>
    </>
  );
}
