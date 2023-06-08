import React, { useCallback } from 'react';
import { doc, getDoc, getFirestore, orderBy, where } from 'firebase/firestore';
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
import { ArrowBackIosRounded, OpenInNewRounded } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { Submission } from 'common/types';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { useDocData, useFetchFirestore, useJsonDialog } from 'hooks';
import { COLLECTIONS, RatingData } from 'common';

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

export const RowItem: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
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

export const SubmissionView: React.FC = () => {
  const { submissionId } = useParams();
  const { data, status } = useDocData<Submission>('SUBMISSIONS', submissionId!);
  const navigate = useNavigate();
  const dialog = useJsonDialog();

  const showDialog = useCallback(
    async (collection: string, docId: string, title: string) => {
      const snap = await getDoc(doc(getFirestore(), collection, docId));

      const d = snap.data();
      if (!snap.exists() || !d) {
        return toast.error(`Failed to fetch data for doc ID ${docId}`);
      }

      dialog(d, title);
    },
    [dialog]
  );

  const handleCreateQuote = useCallback(() => {
    navigate({
      pathname: createPath({
        path: ADMIN_ROUTES.QUOTE_NEW,
        params: { productId: 'flood', submissionId: `${submissionId}` },
      }),
      // search: createSearchParams({
      //   submissionId: `${submissionId}`,
      // }).toString(),
    });
  }, [navigate, submissionId]);

  const openGoogleMaps = useCallback(() => {
    let { latitude, longitude } = data.coordinates;
    if (!(latitude && longitude)) return toast.error('Missing coordinates');
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`);
  }, [data]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (!submissionId) throw new Error('Missing submission ID');

  return (
    <Grid container spacing={8}>
      <Grid xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
            <IconButton
              size='small'
              onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SUBMISSIONS }))}
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
            Spatial Key Data
          </Typography>
          <RowItem
            title='Replacement Cost'
            value={dollarFormat(data.ratingPropertyData?.replacementCost ?? '')}
          />
          <RowItem title='RCV Source User' value={data.rcvSourceUser || '--'} />
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
            AAL & Premium
          </Typography>
          <RowItem title='Inland AAL' value={data.inlandAAL} />
          <RowItem title='Surge AAL' value={data.surgeAAL} />
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
            onClick={() => showDialog('attom', data.propertyDataDocId!, 'Attom Property Data')}
          >
            Show Attom Data
          </Button>
        )}
        <ShowRatingDialog id={submissionId} btnProps={{ size: 'small', sx: { m: 1, ml: 0 } }} />
        <Button
          onClick={openGoogleMaps}
          size='small'
          sx={{ m: 1, ml: 0 }}
          endIcon={<OpenInNewRounded />}
        >
          Google Maps
        </Button>
      </Grid>
    </Grid>
  );
};
