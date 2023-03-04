import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useLoaderData, useNavigate } from 'react-router-dom';
import ReactJson from '@microlink/react-json-view';

import { SubmissionQuoteData, WithId } from 'common';

export const ViewQuote: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const data = useLoaderData() as WithId<SubmissionQuoteData>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography variant='h5' gutterBottom>
            Quote
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontSize: '0.8rem', textTransform: 'uppercase', pb: 4 }}
          >{`Quote ID: ${data.id}`}</Typography>
        </Box>
        <Button variant='contained' onClick={() => navigate('bind')}>
          Continue to bind
        </Button>
      </Box>
      <Typography variant='h4' align='center' gutterBottom>
        iDemand Flood Insurance
      </Typography>
      <Typography variant='subtitle1' color='text.secondary' align='center' gutterBottom>{`${
        data?.insuredAddress.addressLine1
      } ${data?.insuredAddress.addressLine2 ? data?.insuredAddress.addressLine2 + ', ' : ','} ${
        data?.insuredAddress.city
      } ${data?.insuredAddress.state} ${data?.insuredAddress.postal}`}</Typography>

      <ReactJson
        src={data}
        theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
        style={{ background: 'transparent', fontSize: '0.8rem' }}
        iconStyle='circle'
        enableClipboard
        collapseStringsAfterLength={30}
      />
    </Box>
  );
};
