import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { PickingInfo } from 'deck.gl/typed';

import { ILocation } from 'common';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';

export function renderEventTooltip(info?: PickingInfo) {
  if (!info) return null;

  return (
    <Box sx={{ px: 2, borderRadius: 0.5, zIndex: 2000 }}>
      <Typography variant='body2' fontWeight='fontWeightMedium'>
        {info.object?.properties?.event || ''}
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{
          maxWidth: 300,
          overflowX: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {info.object?.properties?.areaDesc || ''}
      </Typography>
      {info.object?.properties?.effective ? (
        <Typography variant='body2' color='text.secondary'>
          Effective: {format(new Date(info.object?.properties?.effective), 'MM/dd/yyyy h a')}
        </Typography>
      ) : null}
      {info.object && info.object?.properties?.status !== 'Actual' ? (
        <Typography
          variant='body2'
          color='warning.main'
          fontWeight='fontWeightMedium'
        >{`Status: ${info.object?.properties?.status}`}</Typography>
      ) : null}
    </Box>
  );
}

// TODO: make policy clickable / Link ??
export function renderLocationTooltip(info?: PickingInfo) {
  const location = info?.object as ILocation;
  if (!location) return;

  return (
    <Box>
      <Typography variant='body1' fontWeight='fontWeightMedium'>
        {location.address?.addressLine1}
      </Typography>
      {location.policyId ? (
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.725rem' }}>
          {`policy ID: ${location.policyId}`}
        </Typography>
      ) : null}
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`${formatFirestoreTimestamp(location.effectiveDate, 'date')} - ${formatFirestoreTimestamp(
        location.expirationDate,
        'date'
      )}`}</Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`TIV: ${dollarFormat(location.TIV)}`}</Typography>
    </Box>
  );
}
