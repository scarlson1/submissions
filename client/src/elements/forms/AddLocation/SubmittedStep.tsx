import { DoneRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Lottie from 'lottie-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { CheckmarkLottie } from 'assets';
import { AddLocationRequest, DraftAddLocationRequest } from 'common';
import { FormattedAddress } from 'elements/FormattedAddress';
import { ROUTES, createPath } from 'router';

interface SubmittedStepProps {
  data: DraftAddLocationRequest | AddLocationRequest;
}

export function SubmittedStep({ data }: SubmittedStepProps) {
  const navigate = useNavigate();
  const { locationChanges, policyId } = data;

  const handleNav = useCallback((path: string) => () => navigate(path), [navigate]);

  return (
    <Container maxWidth='sm' disableGutters>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1.4 }}>
                  Status
                </Typography>
                <Typography variant='subtitle2'>{data.status}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {locationChanges?.address ? (
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
                      address={locationChanges.address}
                      variant='subtitle2'
                      textAlign='right'
                    />
                  </>
                ) : null}
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Add Location Request Submitted
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ p: 4 }} gutterBottom>
              Your request to add a location has been submitted. Our team will review and notify you
              once approved.
            </Typography>
          </Box>
          <Divider sx={{ mt: 3, mb: -3 }} />
        </CardContent>
        <CardActions disableSpacing>
          <Stack direction='row' spacing={2} sx={{ ml: 'auto' }}>
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
              onClick={handleNav(createPath({ path: ROUTES.POLICY, params: { policyId } }))}
              startIcon={<DoneRounded />}
            >
              Done
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Container>
  );
}
