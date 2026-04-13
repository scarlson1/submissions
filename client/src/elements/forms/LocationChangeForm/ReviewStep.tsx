import {
  BedRounded,
  FenceRounded,
  HouseRounded,
  WeekendRounded,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
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
import { isNumber, merge } from 'lodash';
import { Fragment, ReactNode, useCallback, useMemo, useState } from 'react';
import { useFirestore } from 'reactfire';

import { Collection, type ILocation, type WithId } from '@idemand/common';
import {
  AddLocationRequest,
  CancellationRequest,
  DraftAddLocationRequest,
  fallbackImages,
  PolicyChangeRequest,
} from 'common';
import { WizardNavButtons } from 'components/forms';
import { useAsyncToast, useDocData, useWizard } from 'hooks';
import { useFirstRender } from 'hooks/utils';
import { getAllById } from 'modules/db';
import {
  deepMergeOverwriteArrays,
  dollarFormat,
  dollarFormat2,
} from 'modules/utils';

// async function getLocations(constraints: QueryConstraint[]) {
//   const locationsCol = locationsCollection(getFirestore())
//   const q = query(locationsCol, ...constraints)
//   const snaps = await getDocs(q)

//   return snaps.docs.map(snap => ({ ...snap.data(), id: snap.id}))
// }

// // TODO: use query key factory (getAllById, filters (constraints), byPolicyId, etc.)
// const useLocations = (constraints: QueryConstraint[]) => {

//   return useQuery({
//     queryKey: ['locations', {constraints}],
//     queryFn: () => getLocations(constraints)
//   })
// }

// TODO: add field in location data for change type ?? locationChangeType: ['endorsement', 'amendment']
// add chip or styling to indicate change type on location card

export function useChangeRequestReview(policyId: string, requestId: string) {
  const firestore = useFirestore();
  // TODO: need to wrap in error boundary (with reset to reset form)
  // const { data } = useDocData<PolicyChangeRequest>('POLICIES', requestId, [
  //   policyId,
  //   Collection.Enum.changeRequests,
  // ]);
  const { data } = useDocData<PolicyChangeRequest>(
    'policies',
    policyId,
    Collection.Enum.changeRequests,
    requestId,
  );
  const [reqState, setReqState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  // react-query alternative for fetching locations (limited to 30 docs)
  // const { data: locations } = useLocations([where(documentId(), 'in', docIds)]);
  const [locationData, setLocationData] = useState<WithId<ILocation>[]>([]);

  // TODO: loading state ?? use react query w/ suspense ??
  // TODO: can't use getAll for more than 30/50 documents
  const getLocations = useCallback(async () => {
    try {
      setReqState({
        loading: true,
        error: null,
      });

      const lcnIds = Object.keys(
        merge(
          data.endorsementChanges || {},
          data.amendmentChanges || {}, // @ts-ignore
          data.cancellationChanges || {},
        ),
      );
      // let lcns = await getAll<ILocation>(firestore, 'LOCATIONS', lcnIds);
      // let lcnData = lcns.docs.map((l) => ({ id: l.id, ...l.data() }));
      let lcns = await getAllById<ILocation>(firestore, 'locations', lcnIds);

      // TODO: fix typing (and/or throw if one of the locations is not found ??)
      let lcnData = lcns
        .filter((s) => s.exists())
        .map((l) => ({ id: l.id, ...l.data() })) as WithId<ILocation>[];

      setLocationData([...lcnData]);
      console.log('locations: ', lcnData);
      // setLoading(false);
      setReqState({ ...reqState, loading: false });
    } catch (err: any) {
      console.log('Err fetching locations: ', err);
      const errMsg = 'Something went wrong. Failed to fetch location data.';
      setReqState({ error: errMsg, loading: false });
      // TODO: pass onError prop
    }
  }, [firestore, data, reqState]);

  useFirstRender(() => getLocations());

  const locations = useMemo<WithId<ILocation>[]>(() => {
    let lcnChangesObj = merge(
      data.endorsementChanges || {},
      data.amendmentChanges || {}, // @ts-ignore
      data.cancellationChanges || {},
    );

    return locationData.map((l) =>
      deepMergeOverwriteArrays(l, lcnChangesObj[l.id] || {}),
    ) as WithId<ILocation>[];
  }, [locationData, data]);

  return { changeRequest: data, locations, ...reqState };
}

interface ReviewStepProps {
  policyId: string;
  requestId: string;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({
  policyId,
  requestId,
  onSubmit,
}: ReviewStepProps) => {
  const { changeRequest, locations, error } = useChangeRequestReview(
    policyId,
    requestId,
  );

  // TODO: better loading state indication
  // if (loading)
  //   return (
  //     <Box sx={{ height: 300 }}>
  //       <LoadingComponent />
  //     </Box>
  //   );

  if (error)
    return (
      <Alert severity='error' sx={{ mx: 'auto' }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );

  return (
    <ReviewStepComponent
      changeRequest={changeRequest}
      locations={locations}
      onSubmit={onSubmit}
    />
  );
};

interface ReviewStepComponentProps {
  changeRequest:
    | AddLocationRequest
    | DraftAddLocationRequest
    | PolicyChangeRequest
    | CancellationRequest;
  locations: WithId<ILocation>[];
  onSubmit: () => Promise<void>;
}

export const ReviewStepComponent = ({
  changeRequest,
  locations,
  onSubmit,
}: ReviewStepComponentProps) => {
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 300, sm: 400, md: 500, lg: 600 },
      }}
    >
      <Container
        maxWidth='sm'
        disableGutters
        sx={{ flex: '1 1 auto', overflowY: 'auto', px: { xs: 0 } }}
      >
        <Typography variant='h6' align='center'>
          Review
        </Typography>

        {/* TODO: horizontal Location card - also used in bind quote (separate out to stand along component) */}
        <Box sx={{ py: 3, maxHeight: 400, overflowY: 'auto' }}>
          {locations.map((l) => (
            <LocationCard location={l} key={l.id} />
          ))}
        </Box>
        <Divider sx={{ my: 3 }} variant='middle' />
        <Typography variant='h6'>New Policy Totals</Typography>
        <Grid container spacing={2} sx={{ py: 4 }} disableEqualOverflow>
          {isNumber(changeRequest.policyChanges?.termPremium) ? (
            <>
              <Grid xs={8}>
                <Typography
                  variant='body1'
                  sx={{ pr: 2, display: 'inline-block' }}
                >
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
                <Typography
                  variant='body1'
                  fontWeight='fontWeightMedium'
                  align='right'
                >
                  {dollarFormat2(changeRequest.policyChanges!.termPremium)}
                </Typography>
              </Grid>
            </>
          ) : null}
          {changeRequest.policyChanges?.taxes?.length
            ? changeRequest.policyChanges.taxes.map((t, i) => (
                <Fragment key={`tax-${i}`}>
                  <Grid xs={8}>
                    <Typography variant='body1' sx={{ fontSize: '0.875rem' }}>
                      {t?.displayName}
                    </Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography align='right' sx={{ fontSize: '0.875rem' }}>
                      {isNumber(t?.value) ? dollarFormat2(t!.value) : ''}
                    </Typography>
                  </Grid>
                </Fragment>
              ))
            : null}
          {changeRequest.policyChanges?.fees?.length
            ? changeRequest.policyChanges.fees.map((f, i) => (
                <Fragment key={`fee-${i}`}>
                  <Grid xs={8}>
                    <Typography variant='body1' sx={{ fontSize: '0.875rem' }}>
                      {f?.displayName}
                    </Typography>
                  </Grid>
                  <Grid xs={4}>
                    <Typography align='right' sx={{ fontSize: '0.875rem' }}>
                      {isNumber(f?.value) ? dollarFormat2(f!.value) : ''}
                    </Typography>
                  </Grid>
                </Fragment>
              ))
            : null}
          {changeRequest.policyChanges?.price ? (
            <>
              <Grid xs={8}>
                <Typography variant='body1'>Policy Term Total</Typography>
              </Grid>
              <Grid xs={4}>
                <Typography
                  variant='body1'
                  fontWeight='fontWeightMedium'
                  align='right'
                >
                  {dollarFormat2(changeRequest.policyChanges.price)}
                </Typography>
              </Grid>
            </>
          ) : null}
        </Grid>
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

export function LocationCard({
  location,
  renderTopRight,
}: {
  location: WithId<ILocation>;
  renderTopRight?: (location: WithId<ILocation>) => ReactNode;
}) {
  return (
    <Card sx={{ display: 'flex', my: 3 }}>
      <CardMedia
        component='img'
        sx={{
          width: { xs: 120, sm: 130, md: 140 },
          minHeight: { xs: 100, sm: 120, md: 140 },
        }}
        alt={`${location?.address?.addressLine1} map`}
        image={location?.imageURLs?.satellite || fallbackImages[0]}
        title={`${location?.address?.addressLine1} map`}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='h6' align='right'>
              {location.address.addressLine1}
            </Typography>
            <Box sx={{ flex: '0 0 auto', mt: -2 }}>
              {renderTopRight ? (
                renderTopRight(location)
              ) : (
                <>
                  <Typography
                    variant='overline'
                    align='right'
                    color='text.secondary'
                    sx={{ lineHeight: 1, fontSize: '0.675rem' }}
                  >
                    Annual Premium
                  </Typography>
                  <Typography
                    variant='subtitle1'
                    align='right'
                    sx={{ lineHeight: 1.2 }}
                  >
                    {dollarFormat(location.annualPremium)}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
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
                label={dollarFormat(location.limits?.limitA)}
                size='small'
                sx={{ cursor: 'default' }}
              />
            </Tooltip>
          </Grid>

          <Grid xs='auto'>
            <Tooltip
              title='Additional Structures Coverage Limit'
              placement='top'
            >
              <Chip
                icon={<FenceRounded />}
                label={dollarFormat(location.limits?.limitB)}
                size='small'
                sx={{ cursor: 'default' }}
              />
            </Tooltip>
          </Grid>

          <Grid xs='auto'>
            <Tooltip title='Contents Coverage Limit' placement='top'>
              <Chip
                icon={<WeekendRounded />}
                label={dollarFormat(location.limits?.limitC)}
                size='small'
                sx={{ cursor: 'default' }}
              />
            </Tooltip>
          </Grid>

          <Grid xs='auto'>
            <Tooltip title='Living Expenses Coverage Limit' placement='top'>
              <Chip
                icon={<BedRounded />}
                label={dollarFormat(location.limits.limitD)}
                size='small'
                sx={{ cursor: 'default' }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}
