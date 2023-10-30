import { DoneRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  Typography,
} from '@mui/material';
import { DocumentReference } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';

import { CheckmarkLottie } from 'assets';
import { COLLECTIONS, PolicyClaim } from 'common';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useDocData } from 'hooks';
import { ROUTES, createPath } from 'router';

// TODO: add link / accordion with faqs / process description

interface SuccessStepProps {
  policyId: string;
  claimId: string;
  claimRef: DocumentReference<PolicyClaim>;
}

export const SuccessStep = ({ policyId, claimId, claimRef }: SuccessStepProps) => {
  const navigate = useNavigate();
  const { data } = useDocData<PolicyClaim>('POLICIES', policyId, COLLECTIONS.CLAIMS, claimId);
  // const { data } = useFirestoreDocData<PolicyClaim>(claimRef, { idField: 'id' });

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
                <>
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    textAlign='right'
                    sx={{ lineHeight: 1.4 }}
                  >
                    Address
                  </Typography>
                  <FormattedAddress address={data.address} variant='subtitle2' textAlign='right' />
                </>
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Claim Submitted
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ p: 4 }} gutterBottom>
              We're sorry to hear about the damage. We'll work to get your claim processed as
              quickly and fairly as possible.
            </Typography>
          </Box>
          <Divider sx={{ mt: 3, mb: -3 }} />
        </CardContent>
        <CardActions disableSpacing>
          <Button
            onClick={() =>
              navigate(createPath({ path: ROUTES.POLICY, params: { policyId: data.policyId } }))
            }
            endIcon={<DoneRounded />}
            sx={{ ml: 'auto' }}
          >
            Done
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};
