import { LoadingButton } from '@mui/lab';
import { Box, Container, Divider, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik, FormikConfig, useFormikContext } from 'formik';
import { camelCase, isEqual } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { mixed, object, string } from 'yup';

import { BaseContact, OptionalKeys, emailVal } from 'common';
import { DownloadStorageFileButton } from 'components';
import { FormikCheckbox, FormikDragDrop, FormikTextField } from 'components/forms';
import { RouterLink } from 'components/layout';
import { RequiredHeaders } from 'elements';
import { useDialog, useDisclosure, useGeneralQuoteDisclosure, useParseCSV } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { getCsvHeaderStatus } from 'modules/utils/storage';
import { ROUTES, createPath } from 'router';

// const PORTFOLIO_QUOTE_TEMPLATE_URL = '';

// header validation options
//    - useFormikContext & useEffect to parse headers
//    - pass prop to FormikDragDrop/FilesDragProp

export interface PortfolioSubmissionValues {
  orgName: string;
  contact: Omit<BaseContact, 'phone'>;
  portfolio: File[];
  userAcceptance: boolean;
}

const DEFAULT_INITIAL_VALUES: PortfolioSubmissionValues = {
  orgName: '',
  contact: {
    firstName: '',
    lastName: '',
    email: '',
  },
  portfolio: [],
  userAcceptance: false,
};

const REQUIRED_HEADERS = [
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postal',
  'buildingLimit',
  'appurtenantStructuresLimit',
  'contentsLimit',
  'businessInterruptionLimit',
  'deductible',
];

// TODO: csv validation factory function
export const csvValidation = mixed()
  .test('required', 'file is required', (value) => {
    if (!value || value.length < 1) return false;
    return true;
  })
  // .test('fileSize', 'The file must be less than 2mb', (value) => {
  //   if (!value || value.length < 1) return false;
  //   return value[0].size / 1024 < 2048;
  // })
  .test('fileType', 'The file type must be .csv', (value) => {
    if (!value || !value.length) return false;
    return value[0].type.includes('csv');
  });

const validation = object().shape({
  orgName: string().required('org name required'),
  contact: object().shape({
    firstName: string().required('first name required'),
    lastName: string().required('last name required'),
    email: emailVal.required('email required'),
  }),
  portfolio: csvValidation,
});

interface PortfolioSubmissionFormProps
  extends OptionalKeys<FormikConfig<PortfolioSubmissionValues>, 'initialValues'> {
  initialValues?: PortfolioSubmissionValues;
}

export function PortfolioSubmissionForm({
  initialValues = DEFAULT_INITIAL_VALUES,
  ...props
}: PortfolioSubmissionFormProps) {
  const showDisclosure = useGeneralQuoteDisclosure();
  const { disclosureHTML } = useDisclosure([['displayName', '==', 'Exempt Commercial Purchaser']]);
  const dialog = useDialog();

  const showCommercialAck = useCallback(() => {
    if (!disclosureHTML) toast('database missing disclosure');

    dialog.prompt({
      variant: 'info',
      catchOnCancel: false,
      title: 'Exempt Commercial Purchaser Acknowledgement',
      content: <div dangerouslySetInnerHTML={{ __html: disclosureHTML }} />,
      slotProps: {
        dialog: {
          maxWidth: 'md',
        },
      },
    });
  }, [dialog, disclosureHTML]);

  return (
    <Container maxWidth='sm' disableGutters>
      <Formik initialValues={initialValues} {...props} validationSchema={validation}>
        {({ handleSubmit, isSubmitting, isValidating, isValid }) => (
          <Form onSubmit={handleSubmit}>
            <Grid container rowSpacing={5} columnSpacing={8}>
              <Grid xs={12}>
                <Typography variant='body1' component='div' sx={{ pb: 2 }}>
                  Please upload a CSV containing the locations you would like quoted.{' '}
                  <DownloadStorageFileButton
                    filePath='public/floodQuoteTemplate.csv'
                    variant='body1'
                    sx={{ pb: 2 }}
                  >
                    Download template
                  </DownloadStorageFileButton>
                </Typography>
                <PortfolioDragDrop requiredHeaders={REQUIRED_HEADERS} formatFn={camelCase} />
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ mb: 4 }} />
                <FormikTextField name='orgName' label='Organization name' fullWidth />
              </Grid>
              <Grid xs={6}>
                <FormikTextField name='contact.firstName' label='First name' fullWidth />
              </Grid>
              <Grid xs={6}>
                <FormikTextField name='contact.lastName' label='Last name' fullWidth />
              </Grid>
              <Grid xs={12}>
                <FormikTextField
                  name='contact.email'
                  label='Email'
                  helperText={`don't worry, your email will only be used for delivering quote`}
                  fullWidth
                />
              </Grid>
              <Grid xs={12}>
                <FormikCheckbox
                  name='userAcceptance'
                  label={
                    <Typography variant='body2' color='text.secondary' component='div'>
                      I agree to the{' '}
                      <Typography
                        component='span'
                        variant='body2'
                        sx={{
                          fontWeight: 'fontWeightMedium',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={showDisclosure}
                      >
                        terms and conditions
                      </Typography>{' '}
                      and{' '}
                      {disclosureHTML && (
                        <Typography
                          component='span'
                          variant='body2'
                          sx={{
                            fontWeight: 'fontWeightMedium',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={showCommercialAck}
                        >
                          Exempt Commercial Purchaser acknowledgement
                        </Typography>
                      )}
                    </Typography>
                  }
                  checkboxProps={{ size: 'small' }}
                  componentsProps={{
                    typography: { variant: 'body2' },
                  }}
                />
              </Grid>

              <Grid xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  Just one location?{' '}
                  <RouterLink
                    to={createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })}
                    sx={{ fontSize: 'inherit' }}
                    underline='none'
                  >
                    Start&nbsp;a&nbsp;quote
                  </RouterLink>
                </Typography>
              </Grid>

              <Grid xs={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <LoadingButton
                  type='submit'
                  variant='contained'
                  loading={isSubmitting}
                  disabled={isValidating || !isValid}
                >
                  Submit
                </LoadingButton>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Container>
  );
}

interface PortfolioDragDropProps {
  requiredHeaders: string[];
  formatFn: (str: string) => string;
}

function PortfolioDragDrop({ requiredHeaders, formatFn }: PortfolioDragDropProps) {
  const { values } = useFormikContext<PortfolioSubmissionValues>();
  const prevPortfolio = usePrevious(values.portfolio);

  const [headerStatus, setHeaderStatus] = useState(
    getCsvHeaderStatus([], requiredHeaders, formatFn)
  );

  const { handleParse } = useParseCSV((state) =>
    setHeaderStatus(getCsvHeaderStatus(state.headers, requiredHeaders, formatFn))
  );

  useEffect(() => {
    if (!Array.isArray(values.portfolio) || values.portfolio.length < 1) return;
    if (isEqual(values.portfolio, prevPortfolio)) return;

    handleParse(values.portfolio[0]);
  }, [values.portfolio, prevPortfolio, requiredHeaders, formatFn, handleParse]);

  return (
    <Box>
      <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
        The following columns are required:
      </Typography>
      <Box sx={{ px: 2, maxHeight: 90, overflowY: 'auto' }}>
        <RequiredHeaders headerStatus={headerStatus} />
      </Box>

      <FormikDragDrop
        name='portfolio'
        acceptedTypes='.csv'
        filesDragDropProps={{ multiple: false }}
      />
    </Box>
  );
}
