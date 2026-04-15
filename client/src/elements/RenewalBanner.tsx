import {
  AutorenewRounded,
  BlockRounded,
  ErrorOutlineRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Chip } from '@mui/material';
import { differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import type { Policy } from '@idemand/common';
import { createPath, ROUTES } from 'router';

interface RenewalBannerProps {
  policy: Policy;
}

/**
 * Displays a contextual renewal status banner on the Policy detail view.
 *
 * - Expiring (no renewalStatus yet): informational prompt
 * - pending: renewal is being processed
 * - quoted: action required — link to the renewal quote
 * - non_renewed: carrier notice
 * - lapsed: coverage gap warning
 * - bound: silent (renewal is complete, no banner needed)
 */
export const RenewalBanner = ({ policy }: RenewalBannerProps) => {
  const navigate = useNavigate();

  const { renewalStatus, renewalQuoteId, expirationDate, cancelEffDate } = policy;

  // Cancelled policies do not display a renewal banner
  if (cancelEffDate) return null;
  // Bound renewals need no banner — the new policy is the source of truth
  if (renewalStatus === 'bound') return null;

  const now = new Date();
  const expDate = expirationDate?.toDate?.();
  const daysUntilExpiry = expDate ? differenceInDays(expDate, now) : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry >= 0;
  const hasAlreadyExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  // Nothing to show if policy isn't near expiration and has no renewal activity
  if (!renewalStatus && !isExpiringSoon && !hasAlreadyExpired) return null;

  if (renewalStatus === 'lapsed') {
    return (
      <Alert
        severity='error'
        icon={<ErrorOutlineRounded />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Coverage Lapsed</AlertTitle>
        This policy has expired without renewal. You no longer have active flood coverage.
        Contact your agent or{' '}
        <Button
          size='small'
          variant='text'
          color='error'
          sx={{ p: 0, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
          onClick={() =>
            navigate(
              createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }),
            )
          }
        >
          start a new submission
        </Button>
        {' '}to obtain new coverage.
      </Alert>
    );
  }

  if (renewalStatus === 'non_renewed') {
    return (
      <Alert
        severity='warning'
        icon={<BlockRounded />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Policy Non-Renewed</AlertTitle>
        {expDate
          ? `This policy will not be renewed. Coverage ends ${expDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
          : 'This policy will not be renewed.'}
        {' '}Please contact your agent to discuss alternative coverage options.
      </Alert>
    );
  }

  if (renewalStatus === 'quoted' && renewalQuoteId) {
    const urgency = daysUntilExpiry !== null && daysUntilExpiry <= 7;
    return (
      <Alert
        severity={urgency ? 'error' : 'warning'}
        icon={<AutorenewRounded />}
        action={
          <Button
            color={urgency ? 'error' : 'warning'}
            size='small'
            variant='outlined'
            onClick={() =>
              navigate(
                createPath({ path: ROUTES.QUOTE_VIEW, params: { quoteId: renewalQuoteId } }),
              )
            }
          >
            Review & Renew
          </Button>
        }
        sx={{ mb: 3 }}
      >
        <AlertTitle>
          {urgency ? 'Urgent: ' : ''}Renewal Quote Ready
        </AlertTitle>
        {daysUntilExpiry !== null
          ? `Your policy expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. `
          : ''}
        Review your renewal quote and complete payment to maintain continuous coverage.
      </Alert>
    );
  }

  if (renewalStatus === 'pending') {
    return (
      <Alert
        severity='info'
        icon={<AutorenewRounded />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Renewal In Progress</AlertTitle>
        {daysUntilExpiry !== null
          ? `Your policy expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. `
          : ''}
        Your renewal quote is being prepared and will be available for review shortly.
      </Alert>
    );
  }

  // Expiring soon with no renewal activity yet
  if (isExpiringSoon && !renewalStatus) {
    return (
      <Alert
        severity='info'
        icon={<WarningAmberRounded />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Policy Expiring Soon</AlertTitle>
        {`Your policy expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. `}
        Your renewal quote will be prepared automatically. You will be notified when it is ready.
      </Alert>
    );
  }

  return null;
};
