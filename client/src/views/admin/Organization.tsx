import { Box, Tab, Typography } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { PersonAddRounded } from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, doc, query, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { ErrorBoundary } from 'react-error-boundary';
import ReactJson from '@microlink/react-json-view';

import {
  AddUsersDialog,
  InvitesGrid,
  PoliciesGrid,
  QuotesGrid,
  SubmissionsGrid,
  UsersGrid,
} from 'elements';
import { useAgencyInsureds } from 'hooks/useAgencyInsureds';
import { useCollectionDataInnerJoin, useRx, useRxDocJoin } from 'hooks/useRx';
import { ClaimsGuard } from 'components';
import { AdminManageUsersGrid } from 'elements/UsersGrid';
import { useJsonTheme } from 'hooks';

const MIN_TAB_HEIGHT = 40;

export const Organization = () => {
  const { orgId } = useParams();
  let [searchParams, setSearchParams] = useSearchParams();
  const tabValue = searchParams.get('tab') || 'policies';

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setSearchParams({ tab: newValue });
  };

  if (!orgId) throw new Error('Missing orgId in URL params');

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
              <Tab label='Policies' value='policies' />
              <Tab label='Quotes' value='quotes' />
              <Tab label='Submissions' value='submissions' />
              <Tab label='Insureds' value='insureds' />
              <Tab label='Team' value='team' />
              <Tab label='Invites' value='invites' />
              <Tab label='Admin Users (test)' value='test' />
            </TabList>
          </Box>
          <TabPanel value='test'>
            <AdminManageUsersGrid orgId={`${orgId}`} />
          </TabPanel>
          <TabPanel value='policies'>
            <PoliciesGrid constraints={[where('orgId', '==', `${orgId}`)]} />
          </TabPanel>
          <TabPanel value='quotes'>
            <QuotesGrid
              constraints={[
                where('agency.orgId', '==', `${orgId}`),
                // orderBy('metadata.created', 'desc'),
                // limit(100),
              ]}
            />
          </TabPanel>
          <TabPanel value='submissions'>
            <SubmissionsGrid constraints={[where('agency.orgId', '==', orgId)]} />
          </TabPanel>
          <TabPanel value='insureds'>
            {/* TODO: use rxjs to fetch all policies under agency, then fetch users by id ?? use innerJoin observable ?? */}
            <UsersGrid queryConstraints={[where('insuredOfAgency', 'array-contains', orgId)]} />
            <ErrorBoundary
              fallback={
                <Typography variant='subtitle2' color='error.main' sx={{ py: 4 }}>
                  Expiremental RXJS combine observable resulted in an error. See console for
                  details.
                </Typography>
              }
            >
              <TestAgencyInsureds orgId={orgId} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel value='team'>
            <UsersGrid queryConstraints={[where('orgId', '==', orgId)]} />
          </TabPanel>
          <TabPanel value='invites'>
            <>
              <ClaimsGuard requiredClaims={['IDEMAND_ADMIN', 'ORG_ADMIN']}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
                  <AddUsersDialog
                    orgId={orgId}
                    buttonText='Add'
                    buttonProps={{
                      size: 'large',
                      startIcon: <PersonAddRounded />,
                      sx: { maxHeight: 36 },
                    }}
                  />
                </Box>
              </ClaimsGuard>
              {orgId && <InvitesGrid queryConstraints={[]} orgId={orgId} />}
            </>
          </TabPanel>
        </TabContext>
      </Box>
    </Box>
  );
};

function TestAgencyInsureds({ orgId }: { orgId: string }) {
  const theme = useJsonTheme();
  const firestore = useFirestore();

  // SEARCHES POLICIES COLLECTION FOR orgId === orgId -- delete ?? use obervable
  const { policies, users } = useAgencyInsureds(orgId);
  // const { policies, users } = useAgencyInsureds('123');

  // const q = query(collection(firestore, 'policies'), where('orgId', '==', '123'));
  const q = query(collection(firestore, 'policies'), where('orgId', '==', orgId));

  // NOT WORKING ?? GROUPS POLICIES RESULT BY USER ID RETURNING:
  // { userId: uid, policies: Policy[] }
  const { data, status } = useRx(q, { idField: 'policyId', suspense: false });

  // WORKS FOR SINGLE DOCUMENT (NOT COLLECTION QUERY)
  // Looks at userId field from policy and retrieves the users/{userId} doc
  // works like mongoose "polulate"
  const pRef = doc(firestore, 'policies', 'YBdp0k6fji8acPQVBgvG');
  // const pRef = doc(getFirestore(), 'policies', 'YBdp0k6fji8'); // test - not doc with matching id
  const { data: docJoinData, status: docJoinStatus } = useRxDocJoin(
    pRef,
    { userId: 'users' },
    { idField: 'policyId', suspense: false }
  );

  console.log('DOC JOIN DATA: ', docJoinData);

  // Joins policy doc with all submissions where userId matches userId
  // user = { userId: '123', ...rest }
  // policy = { userId: '123', ...rest }
  // --> returns: { ...user, [collectionName]: [ ...docsWithMatchingUserId ]}
  // TODO: include id in joined data
  // TODO: observable idField not working
  const { data: innerJoinData, status: innerJoinStatus } = useCollectionDataInnerJoin(
    q,
    'userId',
    { root: 'submissions' },
    { suspense: false, idField: 'policyId' }
  );

  return (
    <>
      <Typography sx={{ py: 3 }} variant='h6'>
        Test agency insureds
      </Typography>
      <Typography sx={{ py: 2 }}>RxJs Observable - Policy combined with user (docJoin)</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
        (hard coded policyId "YBdp0k6fji8acPQVBgvG" for testing)
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        {docJoinStatus === 'loading' ? (
          <div>loading docJoin Observable...</div>
        ) : (
          // <pre>{JSON.stringify(docJoinData, null, 2)}</pre>
          <ReactJson
            src={docJoinData as object}
            style={{ backgroundColor: 'inherit' }}
            theme={theme}
            iconStyle='circle'
            // enableClipboard={(data) => copy(data.src, true)}
            enableClipboard={false}
            collapseStringsAfterLength={30}
          />
        )}
      </Typography>
      <hr />
      <Typography sx={{ py: 2 }}>
        RxJs Observable - Policy combined with submissions, joined on userId (innerJoin)
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
        (hard coded orgId "123" for testing)
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        {innerJoinStatus === 'loading' ? (
          <div>loading innerJoin Observable...</div>
        ) : (
          // <pre>{JSON.stringify(innerJoinData, null, 2)}</pre>
          <ReactJson
            src={innerJoinData as object}
            style={{ backgroundColor: 'inherit' }}
            theme={theme}
            iconStyle='circle'
            enableClipboard={false}
            collapseStringsAfterLength={30}
          />
        )}
      </Typography>
      <hr />
      <Typography sx={{ py: 2 }}>
        RxJs Observable - Policy combined with user (not working - only returns first policy)
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        {status === 'loading' ? (
          <div>loading...</div>
        ) : (
          // <pre>{JSON.stringify(data, null, 2)}</pre>
          <ReactJson
            src={data as object}
            style={{ backgroundColor: 'inherit' }}
            theme={theme}
            iconStyle='circle'
            enableClipboard={false}
            collapseStringsAfterLength={30}
          />
        )}
      </Typography>
      <hr />
      <Typography sx={{ py: 2 }}>
        Hook - fetches policies, then fetch users (uses useEffect, not rxjs obverable)
      </Typography>
      <Typography variant='subtitle2' sx={{ py: 1 }}>
        Users
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        {/* <pre>{JSON.stringify(users, null, 2)}</pre> */}
        <ReactJson
          src={users as object}
          style={{ backgroundColor: 'inherit' }}
          theme={theme}
          iconStyle='circle'
          enableClipboard={false}
          collapseStringsAfterLength={30}
        />
      </Typography>
      <Typography variant='subtitle2' sx={{ py: 1 }}>
        Policies
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        {/* <pre>{JSON.stringify(policies, null, 2)}</pre> */}
        <ReactJson
          src={policies as object}
          style={{ backgroundColor: 'inherit' }}
          theme={theme}
          iconStyle='circle'
          enableClipboard={false}
          collapseStringsAfterLength={30}
        />
      </Typography>
    </>
  );
}
