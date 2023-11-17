import { Alert, AlertTitle, Box, Collapse, Link, MenuItem } from '@mui/material';
import { UploadResult } from 'firebase/storage';
import { useCallback, useState } from 'react';

// USER POLICIES COMPONENT IMPORTS
import {
  GridViewRounded,
  InfoRounded,
  MapRounded,
  OpenInNewRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import { Container, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { camelCase } from 'lodash';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { COLLECTIONS, POLICY_IMPORT_REQUIRED_HEADERS, StorageFolder, VIEW_QUERY_KEY } from 'common';
import { DownloadStorageFileButton } from 'components';
import { IconMenu } from 'components/IconButtonMenu';
import { DataViewLayout } from 'components/layout';
import { ToggleViewLayout } from 'components/toggleView';
import { ToggleViewPanel } from 'components/toggleView/ToggleViewPanel';
import { CSVUploadDialog } from 'elements';
import { ControlledChangeRequestDialog } from 'elements/ChangeRequestDialog';
import { PolicyCards } from 'elements/cards';
import { PoliciesGrid } from 'elements/grids';
import { PoliciesMap } from 'elements/maps';
import { DataViewType, TDataViewType, useAsyncToast, useClaims } from 'hooks';
import { getDuplicates } from 'modules/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';
import { ROUTES, createPath } from 'router';

// TODO: change policies view to allow switching between card and grid view (and map ??)
// TODO: include change requests in grid ?? (could use rxjs and aggregation query)
// TODO: make sure component is wrapped in must be authed wrapper in router

// TODO: add a tab to view change requests

export const Policies = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  // TODO: get from tab context/hook
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  // TODO: admin upload new policy documents

  const handleViewPolicy = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate]
  );

  // TODO: Create component combining provider & buttons ?? similar to DataViewLayout
  if (claims?.iDemandAdmin) {
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <ToggleViewLayout<TDataViewType>
          title='Policies'
          queryKey={VIEW_QUERY_KEY}
          options={DataViewType.options}
          defaultOption='cards'
          icons={{
            cards: <GridViewRounded />,
            grid: <TableRowsRounded />,
            map: <MapRounded />,
          }}
        >
          <ToggleViewPanel value={DataViewType.Enum.cards}>
            <PolicyCards constraints={[]} onClick={handleViewPolicy} />
          </ToggleViewPanel>
          <ToggleViewPanel value={DataViewType.Enum.grid}>
            <PoliciesGrid checkboxSelection />
          </ToggleViewPanel>
          <ToggleViewPanel value={DataViewType.Enum.map}>
            <PoliciesMap constraints={[]} />
          </ToggleViewPanel>
        </ToggleViewLayout>
      </Container>
    );
  }

  // if (claims?.iDemandAdmin)
  //   return (
  //     <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
  //       <DataViewLayout
  //         title='Policies'
  //         isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.POLICIES}`] }}
  //         actions={
  //           <>
  //             <ControlledChangeRequestDialog />
  //             <AdminPoliciesActionMenu />
  //           </>
  //         }
  //       >
  //         {view === DataViewType.Enum.cards ? (
  //           <PolicyCards constraints={[]} onClick={handleViewPolicy} />
  //         ) : null}
  //         {view === DataViewType.Enum.grid ? <PoliciesGrid checkboxSelection /> : null}
  //         {view === DataViewType.Enum.map ? <PoliciesMap constraints={[]} /> : null}
  //         <Box>
  //           <Search filters='collectionName:users' onSelect={console.log} />
  //         </Box>
  //       </DataViewLayout>
  //     </Container>
  //   );

  if (claims?.orgAdmin && user?.tenantId)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <DataViewLayout
          title='Policies'
          isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.POLICIES}`] }}
          actions={<ControlledChangeRequestDialog />}
        >
          {view === DataViewType.Enum.cards ? (
            <PolicyCards
              constraints={[where('agency.orgId', '==', `${user.tenantId}`)]}
              onClick={handleViewPolicy}
            />
          ) : null}
          {view === DataViewType.Enum.grid ? (
            <PoliciesGrid constraints={[where('agency.orgId', '==', `${user.tenantId}`)]} />
          ) : null}
          {view === DataViewType.Enum.map ? (
            <PoliciesMap constraints={[where('agency.orgId', '==', `${user.tenantId}`)]} />
          ) : null}
        </DataViewLayout>
      </Container>
    );

  if (claims?.agent && user?.uid)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <DataViewLayout
          title='Policies'
          isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.POLICIES}`] }}
          actions={<ControlledChangeRequestDialog />}
        >
          {view === DataViewType.Enum.cards ? (
            <PolicyCards
              constraints={[where('agent.userId', '==', user.uid)]}
              onClick={handleViewPolicy}
            />
          ) : null}
          {view === DataViewType.Enum.grid ? (
            <PoliciesGrid constraints={[where('agent.userId', '==', user.uid)]} />
          ) : null}
          {view === DataViewType.Enum.map ? (
            <PoliciesMap constraints={[where('agent.userId', '==', user.uid)]} />
          ) : null}
        </DataViewLayout>
      </Container>
    );

  if (!user?.uid) return <Typography align='center'>Must be signed in</Typography>;

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
      <Box>
        <Typography
          variant='h5'
          gutterBottom
          sx={{ ml: { xs: 2, sm: 3, md: 4 }, '&:hover': { cursor: 'pointer' } }}
          onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
        >
          Policies
        </Typography>
      </Box>
      <PolicyCards
        constraints={[where('namedInsured.userId', '==', user.uid)]}
        onClick={handleViewPolicy}
      />
    </Container>
  );
};

// TODO: duplicated code with quotes/transactions menu --> create reusable component ??
// make composable (separate out required headers component from CSV upload)

function AdminPoliciesActionMenu() {
  const toast = useAsyncToast({ position: 'top-right', duration: 2400 });
  const [open, setOpen] = useState<string | null>(null);
  const [dupHeaders, setDupHeaders] = useState<string[]>([]);

  const handleOpen = useCallback((val: string) => () => setOpen(val), []);
  const handleClose = useCallback(() => {
    setOpen(null);
  }, []);

  const checkForDuplicates = useCallback((headers: string[], formatFn: (str: string) => string) => {
    let formatted = headers.map((h) => formatFn(h));
    setDupHeaders(getDuplicates(formatted));
  }, []);

  const handleHeaderStatus = useCallback(
    (requiredHeaders: string[], formatFn: (str: string) => string) => (headers: string[]) => {
      checkForDuplicates(headers, formatFn);
      return getCsvHeaderStatus(headers, requiredHeaders, formatFn);
    },
    [checkForDuplicates]
  );

  const onSuccess = useCallback(
    (uploadResult: UploadResult[]) => {
      console.log('upload result: ', uploadResult);
      toast.success("you'll receive an email once records are staged", {
        duration: 3500,
        position: 'top-right',
        icon: <InfoRounded />,
      });
      setDupHeaders([]);
    },
    [toast]
  );

  return (
    <Box>
      <IconMenu>
        <MenuItem onClick={handleOpen('importPolicies')}>Import Policies</MenuItem>
      </IconMenu>
      <CSVUploadDialog
        open={open === 'importPolicies'}
        onClose={handleClose}
        destinationFolder={StorageFolder.enum.importPolicies} // TODO: folders enum
        getCsvHeaderStatus={handleHeaderStatus(POLICY_IMPORT_REQUIRED_HEADERS, camelCase)}
        onSuccess={onSuccess}
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Import Policies</Typography>
            <DownloadStorageFileButton filePath='public/policyImportTemplate.csv'>
              Download template
            </DownloadStorageFileButton>
          </Box>
        }
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link href='https://lodash.com/docs/4.17.15#camelCase' target='_blank' rel='noopener'>
            camel case <OpenInNewRounded sx={{ fontSize: 16 }} />
          </Link>
          {`. (ex: "CovA limit" → "cov_a_limit")`}
        </Typography>
        <Collapse in={dupHeaders.length > 0}>
          <Alert severity='warning'>
            <AlertTitle>Duplicate headers detected</AlertTitle>
            {dupHeaders.join(', ')}
          </Alert>
        </Collapse>
      </CSVUploadDialog>
    </Box>
  );
}
