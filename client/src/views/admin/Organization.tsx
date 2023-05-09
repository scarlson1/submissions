import React, { useState } from 'react';
import { Box, Tab, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { collection, doc, getFirestore, limit, orderBy, query, where } from 'firebase/firestore';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import { AddUsersDialog, InvitesGrid, PoliciesGrid, QuoteGrid, UsersGrid } from 'elements';

import { useAgencyInsureds } from 'hooks/useAgencyInsureds';
import { useCollectionDataInnerJoin, useRx, useRxDocJoin } from 'hooks/useRx';
import { ClaimsGuard } from 'components';
import { PersonAddRounded } from '@mui/icons-material';
import { AdminManageUsersGrid } from 'elements/UsersGrid';

const MIN_TAB_HEIGHT = 40;

export const Organization: React.FC = () => {
  const { orgId } = useParams();
  const [tabValue, setTabValue] = useState('invites');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  if (!orgId)
    return (
      <Typography align='center' sx={{ py: 4 }}>
        Missing org ID
      </Typography>
    );

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
            >
              <Tab label='Policies' value='policies' />
              <Tab label='Quotes' value='quotes' />
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
            <PoliciesGrid
              queryConstraints={[
                where('orgId', '==', `${orgId}`),
                // orderBy('metadata.created', 'desc'),
                limit(100),
              ]}
            />
          </TabPanel>
          <TabPanel value='quotes'>
            <QuoteGrid
              queryConstraints={[
                where('agencyId', '==', `${orgId}`),
                orderBy('metadata.created', 'desc'),
                limit(100),
              ]}
            />
          </TabPanel>
          <TabPanel value='insureds'>
            {/* TODO: use rxjs to fetch all policies under agency, then fetch users by id */}
            <UsersGrid queryConstraints={[where('insuredOfAgency', 'array-contains', orgId)]} />
            <TestAgencyInsureds orgId={orgId} />
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
  // const firestore = useFirestore();
  // const q = query(collection(firestore, 'policies'), where('orgId', '==', '123'));
  // const a = useAgencyInsureds(q, { suspense: false });
  // console.log('OBSERVABLE: ', a);
  // if (a.status === 'loading') return <div>loading...</div>;
  // console.log('DATA: ', a.data);

  const { policies, users } = useAgencyInsureds(orgId);

  const q = query(collection(getFirestore(), 'policies'), where('orgId', '==', '123'));

  const { data, status } = useRx(q, { idField: 'policyId', suspense: false });

  const pRef = doc(getFirestore(), 'policies', 'YBdp0k6fji8acPQVBgvG');
  const { data: docJoinData, status: docJoinStatus } = useRxDocJoin(
    pRef,
    { userId: 'users' },
    { idField: 'policyId', suspense: false }
  );

  const { data: innerJoinData, status: innerJoinStatus } = useCollectionDataInnerJoin(
    q,
    'userId',
    { root: 'submissions' },
    { suspense: false, idField: 'policyId' }
  );

  return (
    <>
      <div>Test agency insureds</div>
      <div>RxJs Observable - Policy combined with user (docJoin)</div>
      <div>
        {docJoinStatus === 'loading' ? (
          <div>loading docJoin Observable...</div>
        ) : (
          <pre>{JSON.stringify(docJoinData, null, 2)}</pre>
        )}
      </div>
      <hr />
      <div>RxJs Observable - Policy combined with user (innerJoin)</div>
      <div>
        {innerJoinStatus === 'loading' ? (
          <div>loading innerJoin Observable...</div>
        ) : (
          <pre>{JSON.stringify(innerJoinData, null, 2)}</pre>
        )}
      </div>
      <hr />
      <div>RxJs Observable - Policy combined with user</div>
      <div>
        {status === 'loading' ? <div>loading...</div> : <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
      <hr />
      <div>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </div>
      <div>Policies</div>
      <div>
        <pre>{JSON.stringify(policies, null, 2)}</pre>
      </div>
    </>
  );
}
