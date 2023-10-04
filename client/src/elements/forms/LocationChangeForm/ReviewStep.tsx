import { BedRounded, FenceRounded, HouseRounded, WeekendRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { merge } from 'lodash';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { useFirestore } from 'reactfire';
// import ReactJson from '@microlink/react-json-view';

import { COLLECTIONS, ILocation, PolicyChangeRequest, WithId, fallbackImages } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useAsyncToast, useDocData, useWizard } from 'hooks';
import { useFirstRender } from 'hooks/utils';
import { getAll } from 'modules/db';
import { deepMergeOverwriteArrays, dollarFormat, dollarFormat2 } from 'modules/utils';

interface ReviewStepProps {
  policyId: string;
  requestId: string | undefined;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ policyId, requestId, onSubmit }: ReviewStepProps) => {
  if (!requestId) throw new Error('missing change request ID prop'); // TODO: better method for ensuring req ID
  // does this throw if doc not found ?? need to wrap in error boundary (with reset to reset form)
  const { data } = useDocData<PolicyChangeRequest>('POLICIES', requestId, [
    policyId,
    COLLECTIONS.CHANGE_REQUESTS,
  ]);
  const toast = useAsyncToast({ position: 'top-right' });

  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      // set status draft --> submitted
      toast.loading('saving...');
      await onSubmit();
      toast.success('saved!');
    } catch (err: any) {
      console.log('ERR: ', err);
      toast.error('An error occurred');
    }
  });

  const firestore = useFirestore();
  const [locationData, setLocationData] = useState<WithId<ILocation>[]>([]);
  // TODO: loading state ?? use react query ??
  const getLocations = useCallback(async () => {
    try {
      const lcnIds = Object.keys(merge(data.endorsementChanges || {}, data.amendmentChanges, {}));
      let lcns = await getAll<ILocation>(firestore, 'LOCATIONS', lcnIds);
      console.log('locations: ', lcns);

      let lcnData = lcns.docs.map((l) => ({ id: l.id, ...l.data() }));
      setLocationData([...lcnData]);
    } catch (err: any) {
      console.log('Err fetching locations: ', err);
    }
  }, [firestore, data]);

  useFirstRender(() => getLocations());

  const locations = useMemo<WithId<ILocation>[]>(() => {
    let lcnChangesObj = merge(data.endorsementChanges || {}, data.amendmentChanges, {});

    return locationData.map((l) =>
      deepMergeOverwriteArrays(l, lcnChangesObj[l.id] || {})
    ) as WithId<ILocation>[];
  }, [locationData, data]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 300, sm: 400, md: 500, lg: 600 },
      }}
    >
      <Container maxWidth='sm' disableGutters sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
        <Typography variant='h6' align='center'>
          Review
        </Typography>

        {/* TODO: horizontal Location card - also used in bind quote (separate out to stand along component) */}
        <Box sx={{ py: 3, maxHeight: 400, overflowY: 'auto' }}>
          {locations.map((l) => (
            <Card sx={{ display: 'flex', my: 3 }} key={l.id}>
              <CardMedia
                component='img'
                sx={{
                  width: { xs: 120, sm: 130, md: 140 },
                  minHeight: { xs: 100, sm: 120, md: 140 },
                }}
                alt={`${l?.address?.addressLine1} map`}
                image={l?.imageURLs?.satellite || fallbackImages[0]}
                title={`${l?.address?.addressLine1} map`}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='h6'>{l.address.addressLine1}</Typography>
                    <Box sx={{ flex: '0 0 auto', mt: -2 }}>
                      <Typography
                        variant='overline'
                        align='right'
                        color='text.secondary'
                        sx={{ lineHeight: 1, fontSize: '0.675rem' }}
                      >
                        Annual Premium
                      </Typography>
                      <Typography variant='subtitle1' align='right' sx={{ lineHeight: 1.2 }}>
                        {dollarFormat(l.annualPremium)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
                    {`Effective: ${formatDate(values.effectiveDate, `MMM dd, yy`) || '--'} - ${
                      formatDate(addToDate({ years: 1 }, values.effectiveDate), `MMM dd, yy`) ||
                      '--'
                    }`}
                  </Typography> */}
                </CardContent>
                <Grid
                  container
                  columnSpacing={{ xs: 2, md: 2 }}
                  rowSpacing={1}
                  wrap='wrap'
                  sx={{ pl: 2, pr: 1, pb: 2 }}
                >
                  <Grid xs='auto'>
                    <Tooltip title='Building Coverage Limit' placement='top'>
                      <Chip
                        icon={<HouseRounded />}
                        label={dollarFormat(l.limits?.limitA)}
                        size='small'
                      />
                    </Tooltip>
                  </Grid>

                  <Grid xs='auto'>
                    <Tooltip title='Additional Structures Coverage Limit' placement='top'>
                      <Chip
                        icon={<FenceRounded />}
                        label={dollarFormat(l.limits?.limitB)}
                        size='small'
                      />
                    </Tooltip>
                  </Grid>

                  <Grid xs='auto'>
                    <Tooltip title='Contents Coverage Limit' placement='top'>
                      <Chip
                        icon={<WeekendRounded />}
                        label={dollarFormat(l.limits?.limitC)}
                        size='small'
                      />
                    </Tooltip>
                  </Grid>

                  <Grid xs='auto'>
                    <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                      <Chip
                        icon={<BedRounded />}
                        label={dollarFormat(l.limits.limitD)}
                        size='small'
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          ))}
        </Box>
        <Divider sx={{ my: 3 }} variant='middle' />
        <Typography variant='h6'>New Policy Totals</Typography>
        <Grid container spacing={2} sx={{ py: 4 }}>
          {data.policyChanges?.termPremium ? (
            <>
              <Grid xs={8}>
                <Typography variant='body1' sx={{ pr: 2, display: 'inline-block' }}>
                  Policy Term Premium
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  component='span'
                  sx={{ display: 'inline-block' }}
                >
                  {' '}
                  (sum of location term premiums)
                </Typography>
              </Grid>
              <Grid xs={4}>
                <Typography variant='body1' fontWeight='fontWeightMedium' align='right'>
                  {dollarFormat2(data.policyChanges.termPremium)}
                </Typography>
              </Grid>
            </>
          ) : null}
          {data.policyChanges?.taxes?.length
            ? data.policyChanges.taxes.map((t, i) => (
                <Fragment key={`tax-${i}`}>
                  <Grid xs={8}>
                    <Typography variant='body1'>{t?.displayName}</Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography align='right'>{t?.value ? dollarFormat2(t?.value) : ''}</Typography>
                  </Grid>
                </Fragment>
              ))
            : null}
          {data.policyChanges?.fees?.length
            ? data.policyChanges.fees.map((f, i) => (
                <Fragment key={`fee-${i}`}>
                  <Grid xs={8}>
                    <Typography variant='body1'>{f?.feeName}</Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography align='right'>{f?.value ? dollarFormat2(f?.value) : ''}</Typography>
                  </Grid>
                </Fragment>
              ))
            : null}
          {data.policyChanges?.price ? (
            <>
              <Grid xs={8}>
                <Typography variant='body1'>Policy Term Total</Typography>
              </Grid>
              <Grid xs={4}>
                <Typography variant='body1' fontWeight='fontWeightMedium' align='right'>
                  {dollarFormat2(data.policyChanges.price)}
                </Typography>
              </Grid>
            </>
          ) : null}
        </Grid>
        {/* <Typography component='div' variant='body2' color='text.secondary' sx={{ my: 4 }}>
          <ReactJson
            src={data}
            style={{ backgroundColor: 'inherit' }}
            iconStyle='circle'
            collapseStringsAfterLength={30}
          />
        </Typography> */}
      </Container>
      <Box
        sx={{
          flex: '0 0 auto',
          pt: 2,
          mb: -2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <WizardNavButtons buttonText='Submit' />
      </Box>
    </Box>
  );
};
