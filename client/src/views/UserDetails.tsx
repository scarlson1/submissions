import { GridViewRounded, MapRounded, TableRowsRounded } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Avatar, Box, Tab, Typography } from '@mui/material';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSearchParams } from 'react-router-dom';

import { User } from 'common';
import { Copy, ErrorFallback, LoadingSpinner, ViewToggleButtons } from 'components';
import { DataViewType, TDataViewType, useDocData, useSafeParams } from 'hooks';
import { formatDate } from 'modules/utils';
import { useUser } from 'reactfire';

export const UserDetails = () => {
  const { userId } = useSafeParams(['userId']);
  // TODO: tabs for submissions, quotes, policies
  const [value, setValue] = useState('policies');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

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
        <TabPanel value='submissions'>
          <Typography align='center'>TODO: display user submissions</Typography>
        </TabPanel>
        <TabPanel value='quotes'>
          <Typography align='center'>TODO: display user quotes</Typography>
        </TabPanel>
        <TabPanel value='policies'>
          <UserPolicies />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

function UserInfo({ userId }: { userId: string }) {
  const { data: authUser } = useUser();
  const { data } = useDocData<User>('USERS', userId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflowX: 'hidden' }}>
      <Avatar
        alt={data.displayName}
        src={authUser?.photoURL || undefined}
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
        <Box sx={{ display: 'inline-flex', alignItems: 'center', overflow: 'hidden' }}>
          <Typography variant='body2' color='text.secondary' sx={{ mr: 1, fontSize: '0.725rem' }}>
            User&nbsp;ID:
          </Typography>
          <Copy value={userId} textProps={{ sx: { fontSize: '0.725rem' } }}>
            {userId}
          </Copy>
        </Box>
      </Box>
      {/* TODO: get org details ?? (or use useUser custom hook with rxjs) */}
      <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto', alignSelf: 'flex-start' }}>
        <Typography variant='body2' align='right'>{`Created: ${formatDate(
          data.metadata.created.toDate()
        )}`}</Typography>
        {data.orgId ? (
          <Typography variant='body2' align='right'>{`Org ID: ${data.orgId}`}</Typography>
        ) : null}
      </Box>
    </Box>
  );
}

// TODO: use shared components (currently duplicating ??)

// TODO: use context for toggle button group & view state instead of updating view state from changes in useSearchParams
// see mui tab context as example
const VIEW_QUERY_KEY = 'l_view';

function UserPolicies() {
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ViewToggleButtons<TDataViewType>
          queryKey={VIEW_QUERY_KEY}
          options={DataViewType.options}
          defaultOption='cards'
          icons={{ cards: <GridViewRounded />, grid: <TableRowsRounded />, map: <MapRounded /> }}
        />
      </Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}></Suspense>
      </ErrorBoundary>
      {view === DataViewType.Enum.cards ? <Typography align='center'>Cards</Typography> : null}
      {view === DataViewType.Enum.grid ? <Typography align='center'>Grid</Typography> : null}
      {view === DataViewType.Enum.map ? <Typography align='center'>Map</Typography> : null}
    </Box>
  );
}
