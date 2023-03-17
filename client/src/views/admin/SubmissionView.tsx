import React, { useCallback } from 'react';
import { doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Box, Button, ButtonProps, IconButton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { ArrowBackIosRounded } from '@mui/icons-material';
import {
  createSearchParams,
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
  ratingCollection,
  spatialKeyCollection,
  submissionsCollection,
} from 'common/firestoreCollections';
import { Submission, WithId } from 'common/types';
import { dollarFormat, formatFirestoreTimestamp, numberFormat } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { useJsonDialog } from 'hooks';
import { withIdConverter } from 'common';

export const ShowRatingDialog = ({ id, btnProps }: { id?: string; btnProps?: ButtonProps }) => {
  const dialog = useJsonDialog();

  const handleShowRatingDialog = useCallback(async () => {
    const ratingQuery = query(ratingCollection, where('submissionId', '==', id));
    const ratingSnap = await getDocs(ratingQuery);
    if (ratingSnap.empty) return toast(`No rating documents found`);

    const ratingData = ratingSnap.docs.map((s) => ({ ...s.data(), id: s.id }));
    dialog(ratingData, 'Rating Data');
  }, [dialog, id]);

  if (!id) return null;

  return (
    <Button {...btnProps} onClick={() => handleShowRatingDialog()}>
      Show Rating Data
    </Button>
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

export const submissionLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const submissionRef = doc(submissionsCollection, params.submissionId).withConverter(
      withIdConverter<Submission>()
    );

    const snap = await getDoc(submissionRef);
    let data = snap.data();

    if (!snap.exists() || !data) {
      throw new Response('Not Found', { status: 404 });
    }

    return data;
  } catch (err) {
    throw new Response(`Error fetching submission (ID: ${params.submissionId})`);
  }
};

export const SubmissionView: React.FC = () => {
  const data = useLoaderData() as WithId<Submission>;
  const navigate = useNavigate();
  const dialog = useJsonDialog();

  const handleShowSKDialog = useCallback(
    async (docId: string) => {
      console.log('fetching dk data for: ', docId);
      const skSnap = await getDoc(doc(spatialKeyCollection, docId));
      const skData = skSnap.data();
      if (!skSnap.exists() || !skData) {
        return toast.error(`Failed to fetch SK data for ID ${docId}`);
      }
      dialog(skData, 'Spatial Key Data');
    },
    [dialog]
  );

  const handleCreateQuote = useCallback(() => {
    navigate({
      pathname: createPath({ path: ADMIN_ROUTES.QUOTE_NEW, params: { productId: 'flood' } }),
      search: createSearchParams({
        submissionId: `${data.id}`,
      }).toString(),
    });
  }, [navigate, data]);

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
        <Typography variant='body2'>{`ID: ${data.id}`}</Typography>
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Address
          </Typography>
          <Typography>{`${data.addressLine1} ${data.addressLine2}`}</Typography>
          <Typography>{`${data.city}, ${data.state} ${data.postal}`}</Typography>
        </Box>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Contact
          </Typography>
          <RowItem title='Name' value={`${data.firstName} ${data.lastName}`} />
          <RowItem title='Email' value={`${data.email}`} />
        </Box>
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Limits & Deductible
          </Typography>
          <RowItem title='A: Building Limit' value={dollarFormat(data.limitA)} />
          <RowItem title={`B: Add'l Structures Limit`} value={dollarFormat(data.limitB)} />
          <RowItem title='C: Contents Limit' value={dollarFormat(data.limitC)} />
          <RowItem title='D: Additional Expenses Limit' value={dollarFormat(data.limitD)} />
          <RowItem title='Deductible' value={dollarFormat(data.deductible)} />
        </Box>
        <Box>
          <Typography variant='overline' color='text.secondary'>
            Additional Details
          </Typography>
          <RowItem title='Prior Loss Count' value={data.priorLossCount} />
          <RowItem title='Exclusions' value={data.exclusions} />
          <RowItem title='FIPS' value={data.countyFIPS || null} />
          <RowItem title='County' value={data.countyName || null} />
          {/* <Typography>{`Prior Loss Count: ${data.priorLossCount}`}</Typography>
          <Typography>{`exclusions: ${data.exclusions}`}</Typography> */}
        </Box>
      </Grid>

      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Spatial Key Data
          </Typography>
          <RowItem title='Replacement Cost' value={dollarFormat(data.replacementCost ?? '')} />
          <RowItem title='Square Footage' value={numberFormat(data.sqFootage ?? '')} />
          <RowItem title='Year Built' value={data.yearBuilt} />
          <RowItem
            title='Distance To Coast (ft)'
            value={numberFormat(data.distToCoastFeet ?? '')}
          />
          <RowItem title='Property Code' value={data.propertyCode} />
          <RowItem title='CBRS Designation' value={data.CBRSDesignation} />
          <RowItem title='Basement' value={data.basement} />
          <RowItem title='Flood Zone' value={data.floodZone} />
          <RowItem title='Number of Stories' value={data.numStories} />
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
      {data.spatialKeyDocId && (
        <Grid xs>
          <Button
            size='small'
            sx={{ m: 1 }}
            onClick={() => handleShowSKDialog(data.spatialKeyDocId!)}
          >
            Show Spatial Key Data
          </Button>
          <ShowRatingDialog id={data.id} btnProps={{ size: 'small', sx: { m: 1 } }} />
        </Grid>
      )}

      {/* <Grid xs={12}>
        <Typography component='div' variant='body2' color='text.secondary'>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Typography>
      </Grid> */}
    </Grid>
  );
};
