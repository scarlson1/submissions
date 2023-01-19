import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
  Container,
} from '@mui/material';
import Lottie from 'lottie-react';
import { useLoaderData, useNavigate } from 'react-router-dom';

import * as CheckmarkLottie from 'assets/checkmark.json';
import { ROUTES, createPath } from 'router';
import { Submission } from 'common/types';

// TODO: "Are you an agent? Get in touch..."
// TODO: create account

const submissionFAQs = () => {
  return <Box>TODO: FAQ accordion</Box>;
};

export const SuccessStep: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as Submission;
  // TODO: typing loader data
  console.log('data: ', data);

  return (
    <Container maxWidth='sm' sx={{ py: { xs: 3, sm: 4, md: 6, lg: 8 } }}>
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
                <Typography
                  variant='overline'
                  color='text.secondary'
                  textAlign='right'
                  sx={{ lineHeight: 1.4 }}
                >
                  Address
                </Typography>
                <Typography variant='subtitle2' textAlign='right'>
                  {`${data?.addressLine1}${data.addressLine2 ? ' ' + data.addressLine2 + ' ' : ''}`}
                </Typography>
                <Typography variant='subtitle2' textAlign='right'>
                  {`${data.city}, ${data.state} ${data.postal}`}
                </Typography>
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Submission Received!
            </Typography>

            <Typography variant='body2' color='text.secondary' sx={{ p: 4 }} gutterBottom>
              {data.firstName ? `Thanks, ${data.firstName}! ` : 'Thank you!'} We'll send the quote
              for your review shortly. If you have any question or need to get in touch, please
              don't hesitate to reach out.
            </Typography>
            <Divider flexItem sx={{ mt: 3, mb: -4 }} />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Box>
            {/* <Button
              onClick={() => navigate(createPath({ path: ROUTES.CONTACT }), { replace: true })}
              sx={{ ml: 2 }}
            >
              Contact Us
            </Button> */}
            <Button
              onClick={() =>
                navigate(createPath({ path: ROUTES.SUBMISSION_NEW }), { replace: true })
              }
              sx={{ ml: 2 }}
            >
              New Quote
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
};
