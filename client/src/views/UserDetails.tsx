import { GridViewRounded, MapRounded, TableRowsRounded } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Avatar, Box, Card, Tab, Typography } from '@mui/material';
import { useIsFetching } from '@tanstack/react-query';
import { where } from 'firebase/firestore';
import { Suspense, useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { User } from 'common';
import { Copy, ErrorFallback, LoadingSpinner, ViewToggleButtons } from 'components';
import { QuoteCards } from 'elements';
import { PolicyCards, SubmissionCards } from 'elements/cards';
import { PoliciesGrid, QuotesGrid, SubmissionsGrid } from 'elements/grids';
import { PoliciesMap, QuotesMap, SubmissionsMap } from 'elements/maps';
import { DataViewType, TDataViewType, useDocData, useSafeParams } from 'hooks';
import { formatDate } from 'modules/utils';
import { ROUTES, createPath } from 'router';

// TODO: handle queries depending on whether user is insured or agent
// query user policies based on userId or insured.userId ??

export const UserDetails = () => {
  const { userId } = useSafeParams(['userId']);
  const [value, setValue] = useState('policies');
  const isFetching = useIsFetching();

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
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pt: 2, px: 3 }}
        >
          <LoadingSpinner loading={isFetching > 0} />
          <ViewToggleButtons<TDataViewType>
            queryKey={VIEW_QUERY_KEY}
            options={DataViewType.options}
            defaultOption='cards'
            icons={{ cards: <GridViewRounded />, grid: <TableRowsRounded />, map: <MapRounded /> }}
          />
        </Box>
        <TabPanel value='submissions'>
          <UserSubmissions userId={userId} />
        </TabPanel>
        <TabPanel value='quotes'>
          <UserQuotes userId={userId} />
        </TabPanel>
        <TabPanel value='policies'>
          <UserPolicies userId={userId} />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

// PRE_DEPLOY: get photo from user doc -- not auth photo
// need to sync photo url to user doc when auth profile is changed
function UserInfo({ userId }: { userId: string }) {
  const { data } = useDocData<User>('USERS', userId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflowX: 'hidden' }}>
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

// TODO: use shared components (currently duplicating ??)

// TODO: use context for toggle button group & view state instead of updating view state from changes in useSearchParams
// see mui tab context as example
// pass data view as prop ??
const VIEW_QUERY_KEY = 'view';

function UserPolicies({ userId }: { userId: string }) {
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  // TODO: query params different for agent vs user ??
  // abstract to user context ??

  const handleViewPolicy = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate]
  );

  return (
    <Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          {view === DataViewType.Enum.cards ? (
            <PolicyCards
              constraints={[where('namedInsured.userId', '==', userId)]}
              onClick={handleViewPolicy}
            />
          ) : null}
          {view === DataViewType.Enum.grid ? (
            <PoliciesGrid constraints={[where('namedInsured.userId', '==', userId)]} />
          ) : null}
          {view === DataViewType.Enum.map ? (
            <PoliciesMap constraints={[where('namedInsured.userId', '==', userId)]} />
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
}

function UserQuotes({ userId }: { userId: string }) {
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  const handleViewQuote = useCallback(
    (quoteId: string) => {
      navigate(
        createPath({
          path: ROUTES.QUOTE_VIEW,
          params: { quoteId },
        })
      );
    },
    [navigate]
  );

  return (
    <Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          {view === DataViewType.Enum.cards ? (
            <QuoteCards constraints={[where('userId', '==', userId)]} onClick={handleViewQuote} />
          ) : null}
          {view === DataViewType.Enum.grid ? (
            <QuotesGrid
              constraints={[where('userId', '==', userId)]}
              // renderActions={renderActions}
              onRowDoubleClick={(params) => handleViewQuote(params.id.toString())}
            />
          ) : null}
          {view === DataViewType.Enum.map ? (
            <QuotesMap constraints={[where('userId', '==', `${userId}`)]} />
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
}

function UserSubmissions({ userId }: { userId: string }) {
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  return (
    <Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          {view === DataViewType.Enum.cards ? (
            <SubmissionCards constraints={[where('userId', '==', userId)]} />
          ) : null}
          {view === DataViewType.Enum.grid ? (
            <SubmissionsGrid constraints={[where('userId', '==', userId)]} />
          ) : null}
          {view === DataViewType.Enum.map ? (
            <Card sx={{ height: { xs: 300, sm: 400, md: 460, lg: 500 }, width: '100%' }}>
              <SubmissionsMap constraints={[where('userId', '==', userId)]} />
            </Card>
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
}
