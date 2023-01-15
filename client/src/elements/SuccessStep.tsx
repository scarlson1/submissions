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

import * as CheckmarkLottie from 'assets/checkmark.json';
import { useNavigate } from 'react-router-dom';

// TODO: "Are you an agent? Get in touch..."
// TODO: create account

export const SuccessStep: React.FC = () => {
  const navigate = useNavigate();

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
                <Typography variant='subtitle2'>Generating quote</Typography>
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
                  123 Main St.
                </Typography>
                <Typography variant='subtitle2' textAlign='right'>
                  Nash, TN 12345
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
              Thank you! We'll send the quote for your review shortly. If you have any question or
              need to get in touch, please don't hesitate to reach out.
            </Typography>
            <Divider flexItem sx={{ mt: 3, mb: -4 }} />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Box>
            <Button onClick={() => navigate('/contact', { replace: true })} sx={{ ml: 2 }}>
              Contact Us
            </Button>
            <Button onClick={() => navigate('/quotes/new', { replace: true })} sx={{ ml: 2 }}>
              New Quote
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
};
