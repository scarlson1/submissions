import React, { useCallback } from 'react';
import { Box, Card, CardContent, Grid, Typography, Stack, Divider } from '@mui/material';
import { useFormikContext } from 'formik';

import { FloodValues } from 'views/SubmissionNew';
import { LimitKeys } from 'common/types';
import { dollarFormat } from 'modules/utils/helpers';
import { FormikCheckbox } from 'components/forms';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { FloodStateDisclosure } from './FloodStateDisclosure';

// TODO: generalize component

interface Detail {
  title: string;
  valueKey: LimitKeys | 'deductible';
}

export const policyDetails: Detail[] = [
  {
    title: 'A: Building Coverage Limit',
    valueKey: 'limitA', // 'building',
  },
  {
    title: 'B: Additional Structures Coverage Limit',
    valueKey: 'limitB', // 'structures',
  },
  {
    title: 'C: Contents Coverage Limit',
    valueKey: 'limitC', // 'contents',
  },
  {
    title: 'D: Expenses Coverage Limit',
    valueKey: 'limitD', // 'additional',
  },
  {
    title: 'Deductible',
    valueKey: 'deductible',
  },
];

// // TODO: SET QUOTE DATA TYPING ONCE TYPED
// interface ReviewStepProps {
//   quoteData: { [key: string]: any };
// }

export const ReviewStep: React.FC = () => {
  const { values } = useFormikContext<FloodValues>();
  const confirm = useConfirmation();

  // const locationData = useMemo(() => Object.values(quoteData.locations)[0], [quoteData.locations]);

  const showDisclosure = useCallback(
    async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();

      await confirm({
        variant: 'info',
        catchOnCancel: false,
        title: 'Disclosure',
        description: `A request for quote is subject to all state regulations, including, but not limited to, license and due diligence requirements regarding non-admitted insurance. This website is not intended for business in any state not licensed. Any initial premium indication is not a quote until full submission information has been provided and approved including all state disclosure, taxes, and fees.`,
        dialogContentProps: { dividers: true },
      });
    },
    [confirm]
  );

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box>
              <Typography variant='overline' sx={{ lineHeight: 1.5, color: 'text.secondary' }}>
                iDemand
              </Typography>
              <Typography variant='h5' sx={{ lineHeight: 1.5 }}>
                Flood
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <Typography variant='subtitle2' align='right'>
              {values.addressLine1}
            </Typography>
            {values.addressLine2 && (
              <Typography variant='subtitle2' align='right'>
                {values.addressLine2}
              </Typography>
            )}
            <Typography variant='subtitle2' align='right'>
              {`${values.city}, ${values.state} ${values.postal}`}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6' gutterBottom>
              Overview
            </Typography>
            <Stack
              spacing={2}
              alignItems='stretch'
              divider={<Divider variant='inset' />}
              sx={{ py: 2 }}
            >
              {policyDetails.map((item) => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  key={item.valueKey}
                >
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {item.title}
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 500 }}>
                    {dollarFormat(values[item.valueKey])}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant='h6' gutterBottom>
              What's Next?
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary' }} gutterBottom>
              {`Keep an eye on your inbox! We'll deliver a quote to the provided email address  (
              ${values.email}). It will include a link to proceed with binding a policy.`}
            </Typography>

            <Divider sx={{ my: 3 }} />
            <FormikCheckbox
              name='userAcceptance'
              label={
                <Typography variant='body2' color='text.secondary'>
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
                    terms and disclosures
                  </Typography>{' '}
                  <FloodStateDisclosure
                    state={values.state}
                    buttonText={'and state disclosure'}
                    textProps={{
                      variant: 'body2',
                      sx: {
                        display: 'inline-flex',
                        fontWeight: 'fontWeightMedium',
                        '&:hover': { textDecoration: 'underline' },
                      },
                    }}
                  />
                </Typography>
              }
              checkboxProps={{ size: 'small' }}
              componentsProps={{
                typography: { variant: 'body2' },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ReviewStep;
