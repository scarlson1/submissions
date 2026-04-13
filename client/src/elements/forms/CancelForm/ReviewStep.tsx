import type { ILocation, Policy, WithId } from '@idemand/common';
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { CancellationRequest } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { useFirstRender } from 'hooks/utils';
import { getAllById } from 'modules/db';
import { dollarFormat } from 'modules/utils';
import { useCallback, useState } from 'react';
import { useFirestore } from 'reactfire';
import { LocationCard } from '../LocationChangeForm/ReviewStep';

// TODO: reuse ReviewStepComponent ??
// need to add custom props to grey out or add "cancel" banner over location card ??

// TODO: location cards with react query infinite scroll ??
// how should locations be displayed for policy cancellation (many locations)

function useCancelRequestReview(changeRequest: Partial<CancellationRequest>) {
  const firestore = useFirestore();
  const [reqState, setReqState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });
  const [locationData, setLocationData] = useState<WithId<ILocation>[]>([]);

  const getLocations = useCallback(async () => {
    try {
      setReqState({
        loading: true,
        error: null,
      });

      const lcnIds = Object.keys(changeRequest.cancellationChanges || {});
      // let lcns = await getAll<ILocation>(firestore, 'LOCATIONS', lcnIds);
      // let lcnData = lcns.docs.map((l) => ({ id: l.id, ...l.data() }));
      let lcns = await getAllById<ILocation>(firestore, 'locations', lcnIds);
      // TODO: limited to 50 locations

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
  }, [firestore, changeRequest, reqState]);

  useFirstRender(() => getLocations());

  // const locations = useMemo<WithId<ILocation>[]>(() => {
  //   if (!changeRequest?.cancellationChanges) return []

  //   return locationData.map((l) =>
  //     deepMergeOverwriteArrays(l, changeRequest.cancellationChanges![l.id] || {})
  //   ) as WithId<ILocation>[];
  // }, [locationData, changeRequest]);

  return { changeRequest, locations: locationData, ...reqState };
}

export interface ReviewStepProps {
  changeRequest: Partial<CancellationRequest>;
  onSubmit: () => Promise<void>;
  policy: Policy;
}

// using onSubmit ??

export const ReviewStep = ({
  onSubmit,
  changeRequest,
  policy,
}: ReviewStepProps) => {
  // const { changeRequest, locations, error } = useChangeRequestReview(changeRequest.policyId, changeRequest);
  const { handleStep } = useWizard();
  const { locations, error } = useCancelRequestReview(changeRequest);

  handleStep(() => {
    return onSubmit();
  });

  // estimatedRefundPremium
  // const { earnedPremium } = useMemo(() => {
  //   const lcns = Object.values(changeRequest.policyChanges?.locations || {});

  //   const earnedPremium = sumBy(lcns, 'termPremium');
  //   // TODO: estimated refund below is wrong for multi-location
  //   // TODO: calc refund doc and save to refundCalc collection (like taxCalc) and reference in change request --> once approved, look up refund calc doc and create refund
  //   // const estimatedRefundPremium = policy.termPremium - earnedPremium;

  //   // return { earnedPremium, estimatedRefundPremium };
  //   return { earnedPremium };
  // }, [policy, changeRequest]);

  if (error)
    return (
      <Alert severity='error' sx={{ mx: 'auto' }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 300, sm: 400, md: 500, lg: 600 },
      }}
    >
      <Typography variant='h6' align='center'>
        Review
      </Typography>
      <Container
        maxWidth='sm'
        disableGutters
        sx={{ flex: '1 1 auto', overflowY: 'auto', px: { xs: 0 } }}
      >
        <Box sx={{ py: 3, maxHeight: 400, overflowY: 'auto' }}>
          {locations.map((l) => (
            <LocationCard
              location={l}
              key={l.id}
              renderTopRight={(lcn) => {
                const earnedTermPremium =
                  changeRequest.policyChanges?.locations[lcn.id].termPremium;
                if (!earnedTermPremium) return null;

                return (
                  <>
                    <Typography
                      variant='overline'
                      component='div'
                      align='right'
                      color='text.secondary'
                      sx={{ lineHeight: 1.6, fontSize: '0.675rem' }}
                    >
                      Term Premium
                    </Typography>
                    <Stack direction='row' spacing={2}>
                      <Typography
                        variant='subtitle1'
                        color='text.tertiary'
                        align='right'
                        sx={{ lineHeight: 1.2, textDecoration: 'line-through' }}
                      >
                        {dollarFormat(lcn.termPremium)}
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        align='right'
                        sx={{ lineHeight: 1.2 }}
                      >
                        {dollarFormat(earnedTermPremium)}
                      </Typography>
                    </Stack>
                  </>
                );
              }}
            />
          ))}
        </Box>
      </Container>
      {/* <Grid container spacing={2} sx={{ py: 4 }} disableEqualOverflow>
        <Grid xs={8}>
          <Typography>Term Premium</Typography>
        </Grid>
        <Grid xs={4}>
          <Typography variant='body1' fontWeight='fontWeightMedium' align='right'>
            {dollarFormat2(policy.termPremium)}
          </Typography>
        </Grid>
        <Grid xs={8}>
          <Typography>Earned Premium</Typography>
        </Grid>
        <Grid xs={4}>
          <Typography variant='body1' fontWeight='fontWeightMedium' align='right'>
            {dollarFormat2(earnedPremium)}
          </Typography>
        </Grid>
        TODO: refund amount (from refund calc doc)
        
        <Grid xs={8}>
          <Typography>Estimated Refund</Typography>
        </Grid>
         <Grid xs={4}>
          <Typography variant='body1' fontWeight='fontWeightMedium' align='right'>
            {dollarFormat2(estimatedRefundPremium)}
          </Typography>
        </Grid>
      </Grid> */}
      <Box sx={{ py: 2 }}>
        <Alert severity='info'>
          The earned premium and refunded amount listed above are estimates and
          may not reflect the exact premium refunded.
        </Alert>
      </Box>
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
      {/* <ReviewStepComponent changeRequest={changeRequest} locations={[]} onSubmit={onSubmit} /> */}
    </Box>
  );
};
