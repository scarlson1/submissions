import {
  GridViewRounded,
  InfoRounded,
  MapRounded,
  OpenInNewRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  Container,
  Link,
  MenuItem,
  Typography,
} from '@mui/material';
import { UploadResult } from 'firebase/storage';
import { camelCase } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import invariant from 'tiny-invariant';

import { Collection, StorageFolder } from '@idemand/common';
import { POLICY_IMPORT_REQUIRED_HEADERS, VIEW_QUERY_KEY } from 'common';
import { DownloadStorageFileButton } from 'components';
import { IconMenu } from 'components/IconButtonMenu';
import { ToggleViewLayout, ToggleViewLayoutProps } from 'components/toggleView';
import { ToggleViewPanel } from 'components/toggleView/ToggleViewPanel';
import { CSVUploadDialog } from 'elements';
import { PolicyCards } from 'elements/cards';
import { ControlledChangeRequestDialog } from 'elements/ChangeRequestDialog';
import { PoliciesGrid } from 'elements/grids';
import { PoliciesMap } from 'elements/maps';
import { DataViewType, TDataViewType, useAsyncToast, useClaims } from 'hooks';
import { getPoliciesQueryProps } from 'modules/db/query';
import { getDuplicates } from 'modules/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';
import { createPath, ROUTES } from 'router';

// TODO: include change requests in grid ?? (could use rxjs and aggregation query)
// TODO: make sure component is wrapped in must be authed wrapper in router

// TODO: add a tab to view change requests

function getLayoutProps(claims: {
  iDemandAdmin: boolean;
  orgAdmin: boolean;
  agent: boolean;
}) {
  let props: Pick<
    ToggleViewLayoutProps<TDataViewType>,
    'defaultOption' | 'actions'
  > = {
    defaultOption: 'cards',
  };
  if (claims?.iDemandAdmin) {
    props = {
      defaultOption: 'grid',
      actions: (
        <>
          <ControlledChangeRequestDialog />
          <AdminPoliciesActionMenu />
        </>
      ),
    };
  } else if (claims?.orgAdmin || claims?.agent) {
    props = {
      defaultOption: 'grid',
      actions: (
        <>
          <ControlledChangeRequestDialog />
        </>
      ),
    };
  } else {
    props = {
      defaultOption: 'cards',
      actions: (
        <>
          <ControlledChangeRequestDialog />
        </>
      ),
    };
  }
  return props;
}

export const Policies = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  invariant(user);

  const layoutProps = useMemo(() => getLayoutProps(claims), [claims]);
  const queryProps = useMemo(
    () => getPoliciesQueryProps(user, claims),
    [user, claims],
  );

  const handleViewPolicy = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate],
  );

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
      <ToggleViewLayout<TDataViewType>
        title='Policies'
        queryKey={VIEW_QUERY_KEY}
        options={DataViewType.options}
        icons={{
          cards: <GridViewRounded />,
          grid: <TableRowsRounded />,
          map: <MapRounded />,
        }}
        isFetchingOptions={{
          queryKey: [`infinite-${Collection.Enum.policies}`],
        }}
        headerContainerSx={{ pb: { xs: 2, sm: 3, lg: 4 } }}
        {...layoutProps}
      >
        <ToggleViewPanel value={DataViewType.Enum.cards}>
          <PolicyCards {...queryProps} onClick={handleViewPolicy} />
        </ToggleViewPanel>
        <ToggleViewPanel value={DataViewType.Enum.grid}>
          <PoliciesGrid
            {...queryProps}
            checkboxSelection={claims?.iDemandAdmin}
          />
        </ToggleViewPanel>
        <ToggleViewPanel value={DataViewType.Enum.map}>
          <PoliciesMap {...queryProps} />
        </ToggleViewPanel>
      </ToggleViewLayout>
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

  const checkForDuplicates = useCallback(
    (headers: string[], formatFn: (str: string) => string) => {
      let formatted = headers.map((h) => formatFn(h));
      setDupHeaders(getDuplicates(formatted));
    },
    [],
  );

  const handleHeaderStatus = useCallback(
    (requiredHeaders: string[], formatFn: (str: string) => string) =>
      (headers: string[]) => {
        checkForDuplicates(headers, formatFn);
        return getCsvHeaderStatus(headers, requiredHeaders, formatFn);
      },
    [checkForDuplicates],
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
    [toast],
  );

  return (
    <Box>
      <IconMenu>
        <MenuItem onClick={handleOpen('importPolicies')}>
          Import Policies
        </MenuItem>
      </IconMenu>
      <CSVUploadDialog
        open={open === 'importPolicies'}
        onClose={handleClose}
        destinationFolder={StorageFolder.enum.importPolicies} // TODO: folders enum
        getCsvHeaderStatus={handleHeaderStatus(
          POLICY_IMPORT_REQUIRED_HEADERS,
          camelCase,
        )}
        onSuccess={onSuccess}
        title={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6'>Import Policies</Typography>
            <DownloadStorageFileButton filePath='public/policyImportTemplate.csv'>
              Download template
            </DownloadStorageFileButton>
          </Box>
        }
      >
        <Typography variant='body2' color='text.secondary' component='div'>
          Headers will be transformed to{' '}
          <Link
            href='https://lodash.com/docs/4.17.15#camelCase'
            target='_blank'
            rel='noopener'
          >
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
