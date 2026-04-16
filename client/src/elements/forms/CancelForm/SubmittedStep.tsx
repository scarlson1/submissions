import { DoneRounded } from '@mui/icons-material';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import Lottie from 'lottie-react';
import { Fragment, useMemo } from 'react';

import type { CancellationRequest, Policy } from '@idemand/common';
import { CheckmarkLottie } from 'assets';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useDialog } from 'hooks';
import { compressedToAddress } from 'modules/utils';

interface SubmittedStepProps {
  data: CancellationRequest;
  policy: Policy;
  title: string;
}

export function SubmittedStep({
  data,
  policy,
  title = 'Change Request Submitted',
}: SubmittedStepProps) {
  const { handleClose } = useDialog();
  const { locationId } = data;

  const address = useMemo(() => {
    if (!(locationId && policy?.locations)) return null;
    const policyLocation = policy.locations[locationId];
    return compressedToAddress(policyLocation?.address);
  }, [policy, locationId]);

  return (
    <Fragment>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant='overline'
              color='text.secondary'
              sx={{ lineHeight: 1.4 }}
            >
              Status
            </Typography>
            <Typography variant='subtitle2'>{data.status}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {address ? (
              <>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  textAlign='right'
                  sx={{ lineHeight: 1.4 }}
                >
                  Address
                </Typography>
                <FormattedAddress
                  address={address}
                  variant='subtitle2'
                  textAlign='right'
                />
              </>
            ) : null}
          </Box>
        </Box>
        {/* <Divider flexItem sx={{ my: 3 }} /> */}
        <Lottie
          animationData={CheckmarkLottie}
          loop={false}
          style={{ height: 100, width: 100, marginTop: -12 }}
        />
        <Typography variant='h5' gutterBottom>
          {title}
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ p: 4 }}
          gutterBottom
        >
          Your cancellation request has been submitted. Our team will review and
          notify you once it has been processed.
        </Typography>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
        {/* doesn't work - need to force refresh new doc id */}
        {/* <Button
              onClick={handleNav(
                createPath({ path: ROUTES.ADD_LOCATION_NEW, params: { policyId } })
              )}
              startIcon={<AddRounded />}
            >
              Add another
            </Button> */}

        <Button
          // onClick={handleNav(createPath({ path: ROUTES.POLICY, params: { policyId } }))}
          onClick={() => handleClose()}
          startIcon={<DoneRounded />}
        >
          Close
        </Button>
      </Stack>
    </Fragment>
  );
}
