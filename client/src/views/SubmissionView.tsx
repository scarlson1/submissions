import React, { useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { ArrowBackIosRounded } from '@mui/icons-material';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { spatialKeyCollection, submissionsCollection } from 'common/firestoreCollections';
import { Submission } from 'common/types';
import { formatFirestoreTimestamp } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { ConfirmationDialog } from 'components';

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
    const submissionRef = doc(submissionsCollection, params.submissionId);

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
  const data = useLoaderData() as Submission;
  const navigate = useNavigate();
  const confirm = useConfirmation();

  const handleShowSKDialog = useCallback(
    async (docId: string) => {
      console.log('fetching dk data for: ', docId);
      const skSnap = await getDoc(doc(spatialKeyCollection, docId));
      const skData = skSnap.data();
      if (!skSnap.exists() || !skData) {
        return toast.error(`Failed to fetch SK data for ID ${docId}`);
      }

      confirm({
        variant: 'info',
        title: 'SpatialKey Data',
        catchOnCancel: false,
        component: (
          <ConfirmationDialog
            onAccept={() => {}}
            onClose={() => {}}
            open={false}
            dialogProps={{ maxWidth: 'sm' }}
            // requiredClaims={['iDemandAdmin']}
          >
            <Typography variant='body2' color='text.secondary' component='div'>
              <pre>{JSON.stringify(skData, undefined, 2)}</pre>
            </Typography>
          </ConfirmationDialog>
        ),
      });
    },
    [confirm]
  );

  return (
    <Grid container spacing={8}>
      <Grid xs={12}>
        <Box sx={{ display: 'flex' }}>
          <IconButton
            size='small'
            onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SUBMISSIONS }))}
            sx={{ mr: 3 }}
            color='primary'
          >
            <ArrowBackIosRounded fontSize='inherit' />
          </IconButton>
          <Typography color='warning.main' variant='h5' gutterBottom>
            TODO: SubmissionView
          </Typography>
        </Box>

        <Typography variant='body2' sx={{ pt: 3 }}>{`Submitted: ${formatFirestoreTimestamp(
          data.metadata.created,
          'date'
        )}`}</Typography>
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
          <RowItem title='A: Building Limit' value={data.limitA} />
          <RowItem title={`B: Add'l Structures Limit`} value={data.limitB} />
          <RowItem title='C: Contents Limit' value={data.limitC} />
          <RowItem title='D: Additional Expenses Limit' value={data.limitD} />
          <RowItem title='Deductible' value={data.deductible} />
        </Box>
        <Box>
          <Typography variant='overline' color='text.secondary'>
            Additional Details
          </Typography>
          <RowItem title='Prior Loss Count' value={data.priorLossCount} />
          <RowItem title='Exclusions' value={data.exclusions} />
          {/* <Typography>{`Prior Loss Count: ${data.priorLossCount}`}</Typography>
          <Typography>{`exclusions: ${data.exclusions}`}</Typography> */}
        </Box>
      </Grid>

      <Grid xs={12} sm={6} md={4} lg={3}>
        <Box sx={{ pb: 3 }}>
          <Typography variant='overline' color='text.secondary'>
            Spatial Key Data
          </Typography>
          <RowItem title='Replacement Cost' value={data.replacementCost} />
          <RowItem title='Square Footage' value={data.sqFootage} />
          <RowItem title='Year Built' value={data.yearBuilt} />
          <RowItem title='Distance To Coast' value={data.distToCoastFeet} />
          <RowItem title='Property Code' value={data.propertyCode} />
          <RowItem title='CBRS Designation' value={data.CBRSDesignation} />
          <RowItem title='Basement' value={data.basement} />
          <RowItem title='Flood Zone' value={data.floodZone} />
          <RowItem title='Number of Stories' value={data.numStories} />
        </Box>
      </Grid>
      {data.spatialKeyDocId && (
        <Grid xs>
          <Button onClick={() => handleShowSKDialog(data.spatialKeyDocId!)}>
            Show Spatial Key Data
          </Button>
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
