import { CloseRounded, EditRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Collapse, IconButton, Paper, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import { useCallback, useRef, useState } from 'react';
import { boolean, object, string } from 'yup';

import { Organization } from 'common';
import { FormikSwitch, FormikTextField } from 'components/forms';
import { useAsyncToast, useClaims, useDocData, useUpdateOrg } from 'hooks';

// TODO: change domain restrictions to an array ??

const domainRegex = /^@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const validation = object().shape({
  enforceDomainRestriction: boolean(),
  emailDomain: string().when('enforceDomainRestriction', {
    is: true,
    then: () =>
      string().required('domain required').matches(domainRegex, 'invalid domain. format: @xxx.yyy'),
    otherwise: () => string().notRequired(),
  }),
});

function getUsersDomain(email?: string | null) {
  const d = email?.split('@')[1];
  return d ? `@${d}` : '';
}

interface OrgSecurityValues {
  emailDomain: string;
  enforceDomainRestriction: boolean;
}

export const OrgSecurity = () => {
  const { orgId, user } = useClaims();
  if (!orgId) throw new Error('missing org ID');

  const toast = useAsyncToast({ position: 'top-right' });
  const { data: org } = useDocData<Organization>('organizations', orgId);
  const [editMode, setEditMode] = useState(false);
  const formRef = useRef<FormikProps<OrgSecurityValues>>(null);

  const updateOrg = useUpdateOrg(
    orgId,
    () => {
      toast.success('org changes saved');
      setEditMode(false);
    },
    (msg) => {
      toast.error(msg);
    }
  );

  const handleUpdateOrg = useCallback(
    (values: OrgSecurityValues) => updateOrg(values),
    [updateOrg]
  );

  const saveDisabled = (() => !formRef.current?.dirty || !formRef.current?.isValid)();
  const saveLoading = (() => formRef.current?.isValidating || formRef.current?.isSubmitting)();

  console.log(saveDisabled, saveLoading);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='subtitle1' gutterBottom>
          Org Security Settings
        </Typography>
        <Stack direction='row' spacing={2}>
          {editMode ? (
            <LoadingButton
              loading={saveLoading}
              disabled={saveDisabled}
              size='small'
              variant='contained'
              sx={{ maxHeight: 34 }}
              onClick={() => formRef.current?.submitForm()}
            >
              save
            </LoadingButton>
          ) : null}
          <IconButton
            onClick={() => {
              editMode && formRef.current?.resetForm();
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
          <Formik<OrgSecurityValues>
            innerRef={formRef}
            initialValues={{
              emailDomain: org?.emailDomain || getUsersDomain(user?.email),
              enforceDomainRestriction: org?.enforceDomainRestriction || false,
            }}
            onSubmit={handleUpdateOrg}
            validationSchema={validation}
          >
            {({ values, handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <Box>
                  <Paper sx={{ p: 3, my: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'nowrap' }}>
                      <Box sx={{ flex: '1 1 auto' }}>
                        <Typography>Domain restriction</Typography>
                        <Typography variant='body2' color='text.secondary' gutterBottom>
                          Enforce email domain for new users in your organization.
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '0 0 auto', justifySelf: 'flex-end' }}>
                        <FormikSwitch
                          name='enforceDomainRestriction'
                          label=''
                          formControlLabelProps={{ componentsProps: {}, sx: { mr: 0 } }}
                        />
                      </Box>
                    </Box>
                    <Collapse in={values.enforceDomainRestriction}>
                      <Box sx={{ py: 2 }}>
                        <FormikTextField name='emailDomain' label='Email domain' fullWidth />
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      ) : (
        <Box>
          {/* TODO: make reusable component ?? */}
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
          {/* TODO: sign in providers */}
          {/* TODO: MFA */}
        </Box>
      )}
    </Box>
  );
};
