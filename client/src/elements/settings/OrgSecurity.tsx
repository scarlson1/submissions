import { CloseRounded, EditRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Collapse, IconButton, Paper, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikConfig } from 'formik';
import { useCallback, useState } from 'react';
import { array, boolean, object, string } from 'yup';

import { Organization } from 'common';
import { FormikFieldArray, FormikSwitch } from 'components/forms';
import { useAsyncToast, useClaims, useDocData, useUpdateOrg } from 'hooks';

const domainRegex = /^@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// const validation = object().shape({
//   enforceDomainRestriction: boolean(),
//   emailDomain: string().when('enforceDomainRestriction', {
//     is: true,
//     then: () =>
//       string().required('domain required').matches(domainRegex, 'invalid domain. format: @xxx.yyy'),
//     otherwise: () => string().notRequired(),
//   }),
// });
const validation = object().shape({
  enforceDomainRestriction: boolean(),
  emailDomains: array().when('enforceDomainRestriction', {
    is: true,
    then: () =>
      array()
        .min(1, 'at least one domain required if enabled')
        .of(
          string()
            .required('domain required')
            .matches(domainRegex, 'invalid domain. format: @xxx.yyy')
        ),
    otherwise: () => array().notRequired(),
  }),
});

function getUsersDomain(email?: string | null) {
  const d = email?.split('@')[1];
  return d ? `@${d}` : '';
}

interface OrgSecurityValues {
  emailDomains: string[];
  enforceDomainRestriction: boolean;
}

export const OrgSecurity = () => {
  const { orgId, user } = useClaims();
  if (!orgId) throw new Error('missing org ID');

  const toast = useAsyncToast({ position: 'top-right' });
  const { data: org } = useDocData<Organization>('organizations', orgId);
  const [editMode, setEditMode] = useState(false);
  // const formRef = useRef<FormikProps<OrgSecurityValues>>(null);

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

  return (
    <Box>
      {editMode ? (
        <Box>
          <EditOrgSecurityForm
            exitEditMode={() => setEditMode(false)}
            // innerRef={formRef}
            initialValues={{
              emailDomains:
                Array.isArray(org?.emailDomains) && org?.emailDomains?.length
                  ? org?.emailDomains
                  : [getUsersDomain(user?.email)],
              enforceDomainRestriction: org?.enforceDomainRestriction || false,
            }}
            onSubmit={handleUpdateOrg}
            validationSchema={validation}
          />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='subtitle1' gutterBottom>
              Org Security Settings
            </Typography>
            <Stack direction='row' spacing={2}>
              <IconButton
                onClick={() => {
                  setEditMode((m) => !m);
                }}
                size='small'
                color='primary'
                aria-label={'edit'}
              >
                {/* {editMode ? <CloseRounded fontSize='inherit' /> : <EditRounded fontSize='inherit' />} */}
                <EditRounded fontSize='inherit' />
              </IconButton>
            </Stack>
          </Box>
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
                    org.emailDomains && org.enforceDomainRestriction ? 'success.light' : 'grey.main'
                  }
                  align='right'
                >
                  {org.emailDomains && org.enforceDomainRestriction ? 'enabled' : 'disabled'}
                </Typography>

                {org.enforceDomainRestriction && org.emailDomains?.length ? (
                  <Typography variant='body2' align='right'>
                    {`${org.emailDomains[0]} ${
                      org.emailDomains.length > 1 ? `+${org.emailDomains.length - 1} more` : ''
                    }`.trim()}
                  </Typography>
                ) : null}
              </Box>
            </Paper>
            {/* TODO: sign in providers */}
            {/* TODO: MFA */}
          </Box>
        </>
      )}
    </Box>
  );
};

interface EditOrgSecurityForm extends FormikConfig<OrgSecurityValues> {
  exitEditMode: () => void;
}

function EditOrgSecurityForm({ exitEditMode, ...props }: EditOrgSecurityForm) {
  return (
    <Formik<OrgSecurityValues> {...props}>
      {({
        values,
        errors,
        touched,
        dirty,
        isValid,
        isValidating,
        isSubmitting,
        handleSubmit,
        resetForm,
        submitForm,
        setFieldValue,
        setFieldError,
        setFieldTouched,
      }) => (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='subtitle1' gutterBottom>
              Org Security Settings
            </Typography>
            <Stack direction='row' spacing={2}>
              <LoadingButton
                loading={isValidating || isSubmitting}
                disabled={!dirty || !isValid}
                size='small'
                variant='contained'
                sx={{ maxHeight: 34 }}
                // onClick={() => formRef.current?.submitForm()}
                onClick={() => submitForm()}
              >
                save
              </LoadingButton>
              <IconButton
                onClick={() => {
                  // editMode && formRef.current?.resetForm();
                  // setEditMode((m) => !m);
                  resetForm();
                  exitEditMode();
                }}
                size='small'
                color='primary'
                // aria-label={editMode ? 'cancel' : 'edit'}
                aria-label={'cancel'}
              >
                <CloseRounded fontSize='inherit' />
                {/* {editMode ? <CloseRounded fontSize='inherit' /> : <EditRounded fontSize='inherit' />} */}
              </IconButton>
            </Stack>
          </Box>
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
                    {/* <FormikTextField name='emailDomain' label='Email domain' fullWidth /> */}
                    <FormikFieldArray
                      parentField='emailDomains'
                      inputFields={[
                        {
                          name: null,
                          label: 'Authorized domain',
                          required: true,
                          inputType: 'text',
                          gridProps: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
                        },
                      ]}
                      values={values}
                      isValidating={isValidating}
                      isSubmitting={isSubmitting}
                      errors={errors}
                      touched={touched}
                      dirty={dirty}
                      setFieldValue={setFieldValue}
                      setFieldError={setFieldError}
                      setFieldTouched={setFieldTouched}
                    />
                  </Box>
                </Collapse>
              </Paper>
            </Box>
          </Form>
        </>
      )}
    </Formik>
  );
}
