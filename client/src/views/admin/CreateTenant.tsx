import { useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Divider,
  Unstable_Grid2 as Grid,
  AlertTitle,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Formik, FormikHelpers, Form } from 'formik';
import { FirebaseError } from 'firebase/app';

import {
  FormikTextField,
  FormikMaskField,
  PhoneMask,
  FeinMask,
  FormikDragDrop,
} from 'components/forms';
import FormikAddress from 'elements/FormikAddress';
import { useCreateAgencySubmission, useCreateTenant, useAsyncToast } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';
import { AgencyAppValues, INITIAL_VALUES } from 'views/AgencyNew';

// DIRECTLY CREATES TENANT - INSTEAD OF APPROVAL PROCESS

// TODO: use rxFire to upload to storage and create submission in Observable ??

export const CreateTenant = () => {
  const navigate = useNavigate();
  const toast = useAsyncToast();

  const { handleSubmission, error: createAgencyError } = useCreateAgencySubmission({});

  const { createTenant, error: createTenantError } = useCreateTenant({
    onSuccess: ({ tenantId }) => {
      if (tenantId) navigate(createPath({ path: ADMIN_ROUTES.ORGANIZATIONS }));
    },
  });

  const handleSubmit = useCallback(
    async (values: AgencyAppValues, helpers: FormikHelpers<AgencyAppValues>) => {
      toast.dismiss();
      toast.loading('creating agency doc...');
      console.log('values => ', values);

      // TODO: only create new submission if draft not saved (submission created)

      try {
        // TODO: set status to something other than submitted ??
        // upload E and O and create submission doc
        let agencyId = await handleSubmission(values, false);
        if (!agencyId) {
          throw new Error('Error creating submission. See console for details.');
        }
        toast.success(`Agency app doc created (ID: ${agencyId})`);

        // toast.updateLoadingMsg('creating tenant ...');
        // let newTenant = await createOrg(agencyId);
        // toast.success(`Org created (ID: ${newTenant?.tenantId}) 🎉`);
        await createTenant(agencyId);

        helpers.setSubmitting(false);
        // return handleSuccess(agencyId, newTenant?.tenantId);
      } catch (err) {
        console.log('ERR => ', err);

        let msg = 'An error occurred while attempting to create tenant. See console for details.';
        if (err instanceof FirebaseError) msg = `${err.message} (${err.code})`;
        toast.error(msg);

        helpers.setSubmitting(false);
        return;
      }
    },
    [handleSubmission, createTenant, toast]
  );

  // const handleSaveDraft = useCallback(() => {
  //   alert('save draft not implemented yet.');
  //   // CREATE SUBMISSION -> REDIRECT TO EDIT SUBMISSION ??
  // }, []);

  const handleCancel = useCallback(
    (setValues: (values: AgencyAppValues) => void) => {
      setValues(INITIAL_VALUES);
      navigate(createPath({ path: ADMIN_ROUTES.AGENCY_APPS }));
    },
    [navigate]
  );

  return (
    <Box>
      <Box sx={{ pb: 3, mt: -2 }}>
        <Formik
          initialValues={INITIAL_VALUES}
          onSubmit={handleSubmit}
          // validationSchema={editValidation}
          enableReinitialize
        >
          {({ values, isSubmitting, isValid, dirty, handleSubmit, setFieldValue, setValues }) => (
            <Form onSubmit={handleSubmit}>
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  // [theme.breakpoints.down('md')]: {
                  //   top: 60,
                  // },
                  // [theme.breakpoints.down('sm')]: {
                  //   top: 54,
                  // },
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? '#FAFAFB' : theme.palette.background.paper,
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  zIndex: 10,
                  py: 2,
                  // mt: -1,
                  // top: (theme) => theme.mixins.toolbar.minHeight ? theme.mixins.toolbar.minHeight.replace( /^\D+/g, '') + 12 : 64
                })}
              >
                <Stack direction='row' spacing={2}>
                  <Button
                    type='submit'
                    variant='contained'
                    disabled={isSubmitting || !isValid || !dirty}
                  >
                    Create Agency
                  </Button>
                  {/* <Button
                    variant='contained'
                    disabled={isSubmitting || !isValid || !dirty}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button> */}
                  <Button
                    variant='outlined'
                    disabled={isSubmitting || !isValid}
                    onClick={() => handleCancel(setValues)}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Box>

              {Boolean(createAgencyError) && (
                <Box sx={{ maxWidth: 500, pb: 4 }}>
                  <Alert severity='error'>
                    <AlertTitle>Create Submission Error</AlertTitle>
                    {createAgencyError}
                  </Alert>
                </Box>
              )}

              {Boolean(createTenantError) && (
                <Box sx={{ maxWidth: 500, pb: 4 }}>
                  <Alert severity='error'>
                    <AlertTitle>Create Submission Error</AlertTitle>
                    {createTenantError instanceof FirebaseError
                      ? `${createTenantError.message} ${createTenantError.code}`
                      : 'See console for details'}
                  </Alert>
                </Box>
              )}

              <Typography variant='h6' gutterBottom sx={{ pl: 6, mt: 2 }}>
                Company Details
              </Typography>
              <Card sx={{ mb: 8 }}>
                <CardContent>
                  <Grid container spacing={8}>
                    <Grid xs={12}>
                      <FormikTextField
                        name='orgName'
                        id='orgName'
                        label='Organization Name'
                        variant='standard'
                        fullWidth
                      />
                      <Box sx={{ py: 4 }}>
                        <FormikAddress
                          setFieldValue={setFieldValue}
                          textFieldProps={{ variant: 'standard' }}
                          selectFieldProps={{ variant: 'standard' }}
                        />
                      </Box>
                      <Divider sx={{ mt: 3 }} />
                    </Grid>
                    <Grid container xs={12}>
                      <Grid xs={6} sm={4}>
                        <FormikTextField
                          id='routingNumber'
                          name='routingNumber'
                          label='Routing Number'
                          variant='standard'
                          fullWidth
                        />
                      </Grid>
                      <Grid xs={6} sm={4}>
                        <FormikTextField
                          id='accountNumber'
                          name='accountNumber'
                          label='Account Number'
                          variant='standard'
                          fullWidth
                        />
                      </Grid>
                      <Grid xs={6} sm={4}>
                        <FormikMaskField
                          id='FEIN'
                          name='FEIN'
                          label='FEIN'
                          fullWidth
                          required
                          maskComponent={FeinMask}
                          variant='standard'
                        />
                      </Grid>
                      <Grid xs={12}>
                        <Divider sx={{ mb: 3 }} />
                        <Box sx={{ flex: 1 }}>
                          {/* TODO: display file url if "save draft" is clicked ?? */}
                          <Typography variant='body2' color='text.secondary' component='span'>
                            E&O
                          </Typography>
                          <FormikDragDrop
                            name='EandO'
                            acceptedTypes='.pdf'
                            filesDragDropProps={{ multiple: false }}
                          />
                          {/* TODO: display url if file already uploaded ("save draft") */}
                          {/* <Box>
                            <Typography variant='body2' color='text.secondary' component='span'>Uploaded File:</Typography>

                            <FileLink 
                              filepath={submission.EandO}
                              url={submission.EandO}
                              fileType='.pdf'
                            />
                          </Box> */}
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Typography variant='h6' gutterBottom sx={{ pl: 6 }}>
                Contacts
              </Typography>
              <Card>
                <CardContent>
                  <Grid container spacing={8}>
                    <Grid container xs={12} sm={6} spacing={4} sx={{ alignContent: 'flex-start' }}>
                      <Grid xs={12}>
                        <Typography variant='overline'>Primary Contact</Typography>
                      </Grid>
                      {/* TODO: make it a select field ?? add search ?? add action button to users section (set as primary contact) */}
                      <Grid xs={6}>
                        <FormikTextField
                          id='firstName'
                          name='firstName'
                          label='First Name'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid xs={6}>
                        <FormikTextField
                          id='lastName'
                          name='lastName'
                          label='Last Name'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid xs={6}>
                        <FormikTextField
                          id='email'
                          name='email'
                          label='Email'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>

                      <Grid xs={6}>
                        <FormikMaskField
                          id='phone'
                          name='phone'
                          label='Phone'
                          variant='standard'
                          fullWidth
                          required
                          maskComponent={PhoneMask}
                        />
                      </Grid>
                    </Grid>
                    {/* <Grid container xs={12} sm={6} spacing={4} sx={{ alignContent: 'flex-start' }}>
                      <Grid xs={12}>
                        <Typography variant='overline'>Principal Producer</Typography>
                      </Grid>
                      
                      <Grid xs={6}>
                        <FormikTextField
                          id='producerFirstName'
                          name='producerFirstName'
                          label='First Name'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>

                      <Grid xs={6}>
                        <FormikTextField
                          id='producerLastName'
                          name='producerLastName'
                          label='Last Name'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>

                      <Grid xs={6}>
                        <FormikTextField
                          id='producerEmail'
                          name='producerEmail'
                          label='Email'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>

                      <Grid xs={6}>
                        <FormikMaskField
                          id='producerPhone'
                          name='producerPhone'
                          label='Phone'
                          variant='standard'
                          fullWidth
                          maskComponent={PhoneMask}
                        />
                      </Grid>

                      <Grid xs={12}>
                        <FormikTextField
                          id='producerNPN'
                          name='producerNPN'
                          label='National Producer Number (individual NPN)'
                          variant='standard'
                          fullWidth
                          required
                        />
                      </Grid>
                    </Grid> */}
                  </Grid>
                </CardContent>
              </Card>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

// const createOrg = useCallback(
//   async (submissionId: string) => {
//     try {
//       const createTenantRes = await createTenant(submissionId);

//       return createTenantRes;
//     } catch (error) {
//       if (error instanceof FirebaseError) {
//         toast.error(`${error.message} (${error.code})`);
//       } else {
//         toast.error(
//           'An error occurred while attempting to create tenant. See console for details.'
//         );
//       }
//     }
//   },
//   [createTenant, toast]
// );

// const promptForNotification = useCallback(async () => {
//   try {
//     await confirm({
//       catchOnCancel: true,
//       variant: 'danger',
//       title: 'Notify Primary Contact?',
//       confirmButtonText: 'Submit',
//       description:
//         'Would you like to notify the primary contact and invite them to create an account?',
//       dialogContentProps: { dividers: true },
//     });
//     return true;
//   } catch (err) {
//     return false;
//   }
// }, [confirm]);

// const handleSuccess = useCallback(
//   async (agencyId: string, tenantId?: string) => {
//     const shouldNotify = await promptForNotification();
//     if (!!shouldNotify) {
//       toast.loading('sending notification...');
//       await sendApprovedNotification(agencyId, `${tenantId}`);
//       toast.success('Error delivering notification');
//     }

//     navigate(createPath({ path: ADMIN_ROUTES.ORGANIZATIONS }));
//   },
//   [promptForNotification, sendApprovedNotification, navigate, toast]
// );
