import { CloseRounded, EditRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import { useCallback, useRef, useState } from 'react';

import { Organization } from 'common';
import { useClaims, useDocData } from 'hooks';

// TODO: change domain restrictions to an array ??

export const OrgSecurity = () => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('missing org ID');
  const { data: org } = useDocData<Organization>('organizations', orgId);
  const [editMode, setEditMode] = useState(false);
  const formRef = useRef<FormikProps<any>>(null);

  const handleUpdateOrg = useCallback(async (values: any) => {
    alert(JSON.stringify(values, null, 2));
    setEditMode(false); // or set in onSuccess handler of update hook ??
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='subtitle1' gutterBottom>
          Org Security Settings
        </Typography>
        <Stack direction='row' spacing={2}>
          {editMode ? (
            <LoadingButton
              loading={formRef.current?.isValidating || formRef.current?.isSubmitting}
              disabled={!formRef.current?.dirty || formRef.current?.isValid}
              size='small'
              variant='contained'
              sx={{ maxHeight: 34 }}
            >
              save
            </LoadingButton>
          ) : null}
          <IconButton
            onClick={() => {
              // if (editMode) fromRef.current?.resetForm()
              setEditMode((m) => !m);
            }}
            size='small'
            color='primary'
            aria-label={editMode ? 'cancel' : 'edit'}
          >
            {editMode ? <CloseRounded fontSize='inherit' /> : <EditRounded fontSize='inherit' />}
          </IconButton>
        </Stack>
      </Box>
      {editMode ? (
        <Box>
          <Typography>TODO: edit mode</Typography>
        </Box>
      ) : (
        <Box>
          <Paper sx={{ display: 'flex', flexWrap: 'nowrap', p: 3, my: 3 }}>
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography>Domain restriction</Typography>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Enforce email domain for all users in your organization.
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Typography
                color={
                  org.emailDomain && org.enforceDomainRestriction ? 'success.light' : 'grey.main'
                }
                align='right'
              >
                {org.emailDomain && org.enforceDomainRestriction ? 'enabled' : 'disabled'}
              </Typography>
              {org.enforceDomainRestriction ? (
                <Typography variant='body2' align='right'>
                  {org.enforceDomainRestriction}
                </Typography>
              ) : null}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
