import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { PickingInfo } from 'deck.gl';

import type {
  ILocation,
  Policy,
  PolicyLocation,
  Quote,
  WithId,
} from '@idemand/common';
import { Submission } from 'common';
import {
  dollarFormat,
  formatDate,
  formatFirestoreTimestamp,
} from 'modules/utils';

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
          Effective:{' '}
          {format(
            new Date(info.object?.properties?.effective),
            'MM/dd/yyyy h a',
          )}
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
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.725rem' }}
        >
          {`policy ID: ${location.policyId}`}
        </Typography>
      ) : null}
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`${formatFirestoreTimestamp(location.effectiveDate, 'date')} - ${formatFirestoreTimestamp(
        location.expirationDate,
        'date',
      )}`}</Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`TIV: ${dollarFormat(location.TIV)}`}</Typography>
    </Box>
  );
}

export function renderPolicyLocationTooltip(info: PickingInfo) {
  const location = info?.object as PolicyLocation & {
    lcnId: string;
    policyId: string;
    policy: Omit<Policy, 'locations'>;
  };
  if (!location) return null;

  return (
    <Box>
      <Typography variant='body1' fontWeight='fontWeightMedium'>
        {location.address?.s1}
      </Typography>
      {location.policy?.namedInsured?.displayName ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.725rem' }}
        >{`Insured: ${location.policy?.namedInsured?.displayName}`}</Typography>
      ) : null}
      {location.annualPremium ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.725rem' }}
        >{`Premium: ${dollarFormat(location.annualPremium)}`}</Typography>
      ) : null}
      {location.policyId ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.725rem' }}
        >
          {`Policy ID: ${location.policyId}`}
        </Typography>
      ) : null}
    </Box>
  );
}

const currentMS = new Date().getTime();

export function renderQuoteTooltip(info: PickingInfo) {
  const quote = info?.object as WithId<Quote>;
  if (!quote) return null;

  const isExpired = quote.quoteExpirationDate?.toMillis() < currentMS;
  const status = isExpired ? 'expired' : quote.status;

  return (
    <Box>
      <Typography variant='body1' fontWeight='fontWeightMedium'>
        {quote.address?.addressLine1}
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`status: ${status}`}</Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`Expiration: ${formatDate(quote.quoteExpirationDate?.toDate())}`}</Typography>
    </Box>
  );
}

export function renderSubmissionTooltip(info: PickingInfo) {
  const submission = info?.object as WithId<Submission>;
  if (!submission) return null;

  return (
    <Box>
      <Typography variant='body1' fontWeight='fontWeightMedium'>
        {submission.address?.addressLine1 || ''}
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.725rem' }}
      >{`Contact: ${submission.contact?.email || ''}`}</Typography>
      {submission.metadata.created ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.725rem' }}
        >{`Created: ${formatDate(submission.metadata.created.toDate()) || ''}`}</Typography>
      ) : null}
    </Box>
  );
}
