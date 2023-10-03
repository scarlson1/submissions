import ReactJson from '@microlink/react-json-view';
import { BedRounded, FenceRounded, HouseRounded, WeekendRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { COLLECTIONS, ILocation, PolicyChangeRequest, WithId, fallbackImages } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useAsyncToast, useDocData, useWizard } from 'hooks';
import { useFirstRender } from 'hooks/utils';
import { merge } from 'lodash';
import { getAll } from 'modules/db';
import { deepMergeOverwriteArrays, dollarFormat } from 'modules/utils';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore } from 'reactfire';

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
    // TODO: no point of grid if all xs={12}
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 300, sm: 400, md: 500, lg: 600 },
      }}
    >
      <Grid container spacing={5} disableEqualOverflow sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
        <Grid xs={12}>
          <Typography variant='h6' align='center'>
            Review
          </Typography>
        </Grid>
        {/* TODO: combine endorsement changes and amendments by location and present as location card w/ premium, limits, additional interests, deductible (requires either storing that info in the change request data or fetching each location. create component that fetching location and accepts value overrides ?? or fetch all locations above & combine data and then map result ??)*/}

        {/* TODO: horizontal Location card - also used in bind quote */}
        {locations.map((l) => (
          <Grid xs={12} md={8} key={l.id}>
            <Card sx={{ display: 'flex' }}>
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
                  <Typography variant='h6'>{l.address.addressLine1}</Typography>
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
          </Grid>
        ))}
        <Grid xs={12}>
          <Typography component='div' variant='body2' color='text.secondary'>
            <ReactJson
              src={data}
              style={{ backgroundColor: 'inherit' }}
              // theme={theme}
              // theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
              iconStyle='circle'
              // enableClipboard={(data) => copy(data.src, true)}
              collapseStringsAfterLength={30}
            />
          </Typography>
        </Grid>
      </Grid>
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
