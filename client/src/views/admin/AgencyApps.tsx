import { CheckCircleOutlineRounded, SendRounded } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridCellParams, GridRowParams } from '@mui/x-data-grid';
import { FirebaseError } from 'firebase/app';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useSigninCheck } from 'reactfire';

import { AGENCY_SUBMISSION_STATUS, COLLECTIONS, CLAIMS } from 'common';
import { IconButtonMenu } from 'components';
import { useConfirmation } from 'context';
import { AgencyAppsGrid } from 'elements/grids';
import { useAsyncToast, useCreateTenant } from 'hooks';
import { useSendAgencyAppNotification } from 'hooks/useCreateTenant';
import { ADMIN_ROUTES, ROUTES, createPath } from 'router';

export const AgencyApps = () => {
  const firestore = useFirestore();
  const navigate = useNavigate();
  const toast = useAsyncToast();
  const confirm = useConfirmation();
  const { data: authCheck } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });

  const { confirmAndSend } = useSendAgencyAppNotification(null, (errMsg: string) =>
    toast.error(errMsg)
  );

  const { createTenant, error: createTenantError } = useCreateTenant();

  const handleCellClick = (params: GridCellParams<any>) => {
    const ignoreFieldsContaining = ['email', 'phone', 'EandO'];

    if (ignoreFieldsContaining.some((partialField) => params.field.includes(partialField))) {
      if (params.value) return;
    } else if (params.field === 'actions') {
      return;
    } else {
      navigate(
        createPath({
          path: ADMIN_ROUTES.AGENCY_APP,
          params: { submissionId: params.id.toString() },
        })
      );
    }
  };

  const handleApprove = useCallback(
    (params: GridRowParams) => async () => {
      if (params.row?.status !== AGENCY_SUBMISSION_STATUS.SUBMITTED) {
        try {
          await confirm({
            catchOnCancel: true,
            variant: 'danger',
            title: (
              <Typography variant='h6' sx={{ fontSize: '1.2rem' }}>
                POTENTIAL DUPLICATE - are you sure?
              </Typography>
            ),
            description: (
              <>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ pb: 2 }}
                >{`The status of the agency application does not match the expected status ("${AGENCY_SUBMISSION_STATUS.SUBMITTED}"). The current status is "${params.row?.status}." Have you checked to see if the org was already created?`}</Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                >{`Please confirm that you would like to continue.`}</Typography>
              </>
            ),
            confirmButtonText: 'Create Org',
            dialogProps: { maxWidth: 'sm' },
            dialogContentProps: { dividers: true },
          });
        } catch (err) {
          toast.warn('Create org aborted');
          return;
        }
      }

      await createTenant(params.id.toString());
    },
    [createTenant, confirm, toast]
  );

  const getTenantIdByOrgName = useCallback(
    async (orgName: string) => {
      const orgQuery = query(
        collection(firestore, COLLECTIONS.ORGANIZATIONS),
        where('orgName', '==', orgName)
      );

      const orgSnap = await getDocs(orgQuery);
      if (orgSnap.empty)
        throw new Error(`No org doc found with orgName ${orgName} (need to accept / create org)`);

      const orgs = orgSnap.docs.map((snap) => snap.data());
      if (orgs.length > 1)
        console.log(`${orgs.length} orgs found matching orgName = ${orgName}`, orgs);

      const orgId = orgs[0].tenantId;
      if (!orgId) throw new Error('Org record did not have tenantId property');

      return orgId;
    },
    [firestore]
  );

  // TODO: add tenantCreated: tenantId to agency app doc
  // TODO: check if user already exists ??
  const handleResendInvite = useCallback(
    (params: GridRowParams) => async () => {
      // check if status === approved
      // alert('Not implemented yet');
      // await sendApprovedNotification(docId, tenantId)

      try {
        let orgName = params.row.orgName;
        if (!orgName) return toast.error('missing orgName to search for Org record');

        const orgId = await getTenantIdByOrgName(orgName);

        await confirmAndSend('approved', params.id.toString(), orgId);
      } catch (err: any) {
        console.log('RESEND INVITE ERROR: ', err);
        let msg = err?.message ?? 'Error getting Org record';

        toast.error(msg);
      }
    },
    [confirmAndSend, getTenantIdByOrgName, toast]
  );

  const navUserAgencyNew = useCallback(
    () => navigate(createPath({ path: ROUTES.AGENCY_NEW })),
    [navigate]
  );

  const renderActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip title='approve' placement='top'>
            <CheckCircleOutlineRounded color='action' />
          </Tooltip>
        }
        onClick={handleApprove(params)}
        label='Approve'
        disabled={!authCheck.hasRequiredClaims}
      />,
      <GridActionsCellItem
        icon={
          <Tooltip title='send invite' placement='top'>
            <SendRounded color='action' />
          </Tooltip>
        }
        onClick={handleResendInvite(params)}
        label='Send invite'
      />,
    ],
    [handleApprove, handleResendInvite, authCheck?.hasRequiredClaims]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Agency Submissions
        </Typography>
        <Stack direction='row' spacing={2}>
          <Button
            onClick={() => navigate(createPath({ path: ADMIN_ROUTES.CREATE_TENANT }))}
            variant='contained'
            sx={{ maxHeight: 34 }}
          >
            New Agency
          </Button>
          <IconButtonMenu
            menuItems={[
              {
                label: 'New Agency (user form)',
                action: navUserAgencyNew,
              },
            ]}
          />
        </Stack>
      </Box>

      {/* TODO: put error inside collapse */}
      {Boolean(createTenantError) && (
        <Box sx={{ maxWidth: 500, pb: 4 }}>
          <Alert severity='error'>
            <AlertTitle>Create Tenant Error</AlertTitle>
            {createTenantError instanceof FirebaseError
              ? `${createTenantError.message} ${createTenantError.code}`
              : 'See console for details'}
          </Alert>
        </Box>
      )}

      <AgencyAppsGrid renderActions={renderActions} onCellDoubleClick={handleCellClick} />
    </Box>
  );
};
