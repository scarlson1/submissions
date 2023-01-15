import { Box, Typography } from '@mui/material';
import React from 'react';

// TODO:
//    - email user once quote is submitted (received submission, keep an eye out for email with quote)
//    - run quote manually & populate quote info
//    - email user with quote (link to review)
//    - ViewQuote -> button to checkout (this component)

// SHORT TERM WORKAROUND STAGES:

// STAGE 0:
//    - before this view is complete: email quote with direct link to epay

// STAGE 1:
//    - link to prefilled epay page
//    - until in app stripe of epay flow is built

// STAGE 2:
//    - build out payment flow in app

export const Checkout = () => {
  return (
    <Box>
      <Typography variant='h5'>Checkout</Typography>
      <Typography color='warning.main' variant='body2'>
        TODO: load quote info and allow user to submit payment ??
      </Typography>
    </Box>
  );
};
