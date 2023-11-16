import { Alert, AlertTitle, Box, Collapse, Link, MenuItem, Stack } from '@mui/material';
import { UploadResult } from 'firebase/storage';
import { useCallback, useState } from 'react';

// USER POLICIES COMPONENT IMPORTS
import { InfoRounded, OpenInNewRounded } from '@mui/icons-material';
import { Container, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { camelCase } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { POLICY_IMPORT_REQUIRED_HEADERS, StorageFolder } from 'common';
import { DownloadStorageFileButton } from 'components';
import { IconMenu } from 'components/IconButtonMenu';
import Search from 'components/search/reactQuery/Search';
import { CSVUploadDialog } from 'elements';
import { ControlledChangeRequestDialog } from 'elements/ChangeRequestDialog';
import { PolicyCards } from 'elements/cards';
import { PoliciesGrid } from 'elements/grids';
import { useAsyncToast, useClaims } from 'hooks';
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

  // TODO: admin upload new policy documents

  const handleViewPolicy = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate]
  );

  const header = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2, pr: { xs: 0, sm: 1 } }}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ ml: { xs: 2, sm: 3, md: 4 }, '&:hover': { cursor: 'pointer' } }}
        onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
      >
        Policies
      </Typography>
      <Stack direction='row' spacing={2}>
        <ControlledChangeRequestDialog />
        {claims?.iDemandAdmin ? <AdminPoliciesActionMenu /> : null}
      </Stack>
    </Box>
  );

  if (claims?.iDemandAdmin)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid checkboxSelection />
        </Box>
        <Box>
          <Search filters='collectionName:users' onSelect={console.log} />
        </Box>
      </Container>
    );

  if (claims?.orgAdmin && user?.tenantId)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agency.orgId', '==', `${user.tenantId}`)]} />
        </Box>
      </Container>
    );

  if (claims?.agent && user?.uid)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agent.userId', '==', user.uid)]} />
        </Box>
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
