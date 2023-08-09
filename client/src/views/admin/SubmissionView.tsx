import { ArrowBackIosRounded, OpenInNewRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonProps,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { doc, getDoc, orderBy, where } from 'firebase/firestore';
import { ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirestore } from 'reactfire';
import invariant from 'tiny-invariant';

import { COLLECTIONS, RatingData } from 'common';
import { Submission } from 'common/types';
import { useDocData, useFetchFirestore, useJsonDialog } from 'hooks';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils/helpers';
import { ADMIN_ROUTES, ROUTES, createPath } from 'router';

// TODO: use observable to lazy load rating data collection
// https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase
export const ShowRatingDialog = ({ id, btnProps }: { id: string; btnProps?: ButtonProps }) => {
  const dialog = useJsonDialog();
  const { fetchData, loading } = useFetchFirestore<RatingData>(COLLECTIONS.RATING_DATA, [
    where('submissionId', '==', id),
    orderBy('metadata.created', 'desc'),
  ]);

  const handleShowRatingDialog = useCallback(async () => {
    // const data = ratingData ?? (await fetchData());
    // if (!data) {
    //   await fetchData();
    // } else {
    //   fetchData();
    // }
    let d = await fetchData();

    if (!d) return toast(`No rating documents found`);

    dialog(d, 'Rating Data');
  }, [dialog, fetchData]);

  return (
    <>
      <Button {...btnProps} onClick={() => handleShowRatingDialog()}>
        Show Rating Data
      </Button>
      {loading && (
        <Box
          sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <CircularProgress size={28} />
        </Box>
      )}
    </>
  );
};

export const RowItem = ({ title, value }: { title: string; value: ReactNode }) => (
  <Stack direction='row' spacing={1} display='flex' alignItems='flex-start'>
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: 0,
      }}
    >
      <Typography
        variant='subtitle2'
        sx={{
          mr: 2,
          color: 'text.secondary',
          lineHeight: 1.75,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
    </Box>
    <Box sx={{ flex: '1 0 auto' }}>
      {/* <Typography textAlign='right'>{value}</Typography> */}
      <Box
        textAlign='right'
        typography='body1'
        color='text.primary'
        sx={{ fontSize: '0.875rem', lineHeight: 1.75 }}
      >
        {value}
      </Box>
    </Box>
  </Stack>
);

export const SubmissionView = () => {
  const { submissionId } = useParams();
  invariant(submissionId, 'Missing submission record ID');

  const navigate = useNavigate();
  const firestore = useFirestore();
  const dialog = useJsonDialog();
  const { data } = useDocData<Submission>('SUBMISSIONS', submissionId!);

  const showDialog = useCallback(
    async (collection: string, docId: string, title: string) => {
      try {
        const snap = await getDoc(doc(firestore, collection, docId));

        const d = snap.data();
        if (!snap.exists() || !d) return toast.error(`Failed to fetch data for doc ID ${docId}`);

        dialog(d, title);
      } catch (err: any) {
        let msg = 'error fetching property data record';
        if (err?.message) msg = err.message;
        toast.error(msg);
      }
    },
    [dialog, firestore]
  );

  const handleCreateQuote = useCallback(
    () =>
      navigate({
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: `${submissionId}` },
        }),
      }),
    [navigate, submissionId]
  );

  const openGoogleMaps = useCallback(() => {
    let { latitude, longitude } = data.coordinates;
    if (!(latitude && longitude)) return toast.error('Missing coordinates');
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`);
  }, [data]);

  if (!submissionId) throw new Error('Missing submission ID');

  // TODO: wont reach here if using suspense - need error boundary
  if (!data)
    return (
      <Typography
        variant='h6'
        textAlign='center'
      >{`Submission not found (ID: ${submissionId})`}</Typography>
    );

  return (
    <Grid container spacing={8}>
      <Grid xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              onClick={() => navigate(createPath({ path: ROUTES.SUBMISSIONS }))}
              sx={{ mr: 3 }}
              color='primary'
            >
              <ArrowBackIosRounded fontSize='inherit' />
            </IconButton>
            <Typography variant='h5'>Submission</Typography>
          </Box>
          <Button variant='contained' onClick={handleCreateQuote} sx={{ maxHeight: 34 }}>
            Create Quote
          </Button>
        </Box>

        <Typography variant='body2' sx={{ pt: 3 }}>{`Submitted: ${formatFirestoreTimestamp(
          data.metadata.created,
          'date'
        )}`}</Typography>
        <Typography variant='body2'>{`ID: ${submissionId}`}</Typography>
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Address
          </Typography>
          <Typography>{`${data.address?.addressLine1} ${data.address?.addressLine2}`}</Typography>
          <Typography>{`${data.address?.city}, ${data.address?.state} ${data.address?.postal}`}</Typography>
        </Box>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Contact
          </Typography>
          <RowItem title='Name' value={`${data.contact?.firstName} ${data.contact?.lastName}`} />
          <RowItem title='Email' value={`${data.contact?.email}`} />
        </Box>
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Limits & Deductible
          </Typography>
          <RowItem title='A: Building Limit' value={dollarFormat(data.limits?.limitA)} />
          <RowItem title={`B: Add'l Structures Limit`} value={dollarFormat(data.limits?.limitB)} />
          <RowItem title='C: Contents Limit' value={dollarFormat(data.limits?.limitC)} />
          <RowItem title='D: Additional Expenses Limit' value={dollarFormat(data.limits?.limitD)} />
          <RowItem title='Deductible' value={dollarFormat(data.deductible)} />
        </Box>
        <Box>
          <Typography variant='overline' color='text.secondary'>
            Additional Detailsaddress?.
          </Typography>
          <RowItem title='Prior Loss Count' value={data.priorLossCount} />
          <RowItem title='Exclusions' value={data.exclusions} />
          <RowItem title='FIPS' value={data.address?.countyFIPS || null} />
          <RowItem title='County' value={data.address?.countyName || null} />
        </Box>
      </Grid>

      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Property Data
          </Typography>
          <RowItem
            title='Replacement Cost'
            value={dollarFormat(data.ratingPropertyData?.replacementCost ?? '')}
          />
          <RowItem title='RCV Source User' value={data.rcvSourceUser ? 'true' : 'false'} />
          <RowItem
            title='Square Footage'
            value={numberFormat(data.ratingPropertyData?.sqFootage ?? '')}
          />
          <RowItem title='Year Built' value={data.ratingPropertyData?.yearBuilt} />
          <RowItem
            title='Distance To Coast (ft)'
            value={numberFormat(data.ratingPropertyData?.distToCoastFeet ?? '')}
          />
          <RowItem title='Property Code' value={data.ratingPropertyData?.propertyCode} />
          <RowItem title='CBRS Designation' value={data.ratingPropertyData?.CBRSDesignation} />
          <RowItem title='Basement' value={data.ratingPropertyData?.basement} />
          <RowItem title='Flood Zone' value={data.ratingPropertyData?.floodZone} />
          <RowItem title='Number of Stories' value={data.ratingPropertyData?.numStories} />
        </Box>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            AALs & Premium
          </Typography>
          <RowItem title='Inland AALs' value={data.AALs?.inland} />
          <RowItem title='Surge AALs' value={data.AALs?.surge} />
          <RowItem title='Tsunami AALs' value={data.AALs?.tsunami} />
          <RowItem
            title='Annual Premium'
            value={data.annualPremium ? dollarFormat(data.annualPremium) : null}
          />
        </Box>
      </Grid>

      <Grid xs>
        <Typography variant='overline' color='text.secondary'>
          Additional Details
        </Typography>
        {/* {data.ratingPropertyData?.spatialKeyDocId && (
          <Button
            size='small'
            sx={{ m: 1, ml: 0 }}
            onClick={() =>
              showDialog(
                COLLECTIONS.SK_RES,
                data.ratingPropertyData?.spatialKeyDocId!,
                'Spatial Key Property Data'
              )
            }
          >
            Show Spatial Key Data
          </Button>
        )} */}
        {data.propertyDataDocId && (
          <Button
            size='small'
            sx={{ m: 1, ml: 0 }}
            onClick={() =>
              showDialog(
                COLLECTIONS.PROPERTY_DATA_RES,
                data.propertyDataDocId!,
                'Property Data Response'
              )
            }
          >
            Show Property Data
          </Button>
        )}
        <ShowRatingDialog id={submissionId} btnProps={{ size: 'small', sx: { m: 1, ml: 0 } }} />
        <Button
          onClick={openGoogleMaps}
          size='small'
          sx={{ m: 1, ml: 0 }}
          endIcon={<OpenInNewRounded />}
          disabled={!data?.coordinates?.latitude}
        >
          Google Maps
        </Button>
      </Grid>
    </Grid>
  );
};
