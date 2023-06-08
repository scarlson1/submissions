import React, { useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useFormikContext } from 'formik';

import { FloodValues } from 'views/SubmissionNew';
import { LimitKeys } from 'common';
import { dollarFormat } from 'modules/utils/helpers';
import { FormikCheckbox } from 'components/forms';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { useDisclosure } from 'hooks';

// TODO: generalize component

// type NestedLimits = {
//   [Property in keyof Limits as `limits.${string & Property}`]: Limits[Property]
// }

interface Detail {
  title: string;
  valueKey: LimitKeys | 'deductible'; //  keyof NestedLimits | 'deductible'
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

export const ReviewStep: React.FC = () => {
  const { values } = useFormikContext<FloodValues>();
  const confirm = useConfirmation();
  const { disclosureHTML, status } = useDisclosure(values.address?.state);

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
              {values.address?.addressLine1}
            </Typography>
            {values.address?.addressLine2 && (
              <Typography variant='subtitle2' align='right'>
                {values.address?.addressLine2}
              </Typography>
            )}
            <Typography variant='subtitle2' align='right'>
              {`${values.address?.city}, ${values.address?.state} ${values.address?.postal}`}
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
                    {item.valueKey === 'deductible'
                      ? dollarFormat(values[item.valueKey])
                      : dollarFormat(values.limits[item.valueKey])}
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
              ${values.contact.email}). It will include a link to proceed with binding a policy.`}
            </Typography>

            <Divider sx={{ my: 3 }} />
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
                  {disclosureHTML && (
                    <Typography component='span' variant='body2'>
                      and state disclosure below
                    </Typography>
                  )}
                </Typography>
              }
              checkboxProps={{ size: 'small' }}
              componentsProps={{
                typography: { variant: 'body2' },
              }}
            />
            {status === 'loading' && (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {disclosureHTML && (
              <Box
                sx={{
                  mt: 3,
                  ml: 4,
                  pl: 3,
                  borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: disclosureHTML }} />
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ReviewStep;
