import { RefreshRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  CardContent,
  Unstable_Grid2 as Grid,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useFunctions } from 'reactfire';

import type { Organization as Org } from '@idemand/common';
import { triggerPortfolioExposure } from 'api';
import { useAsyncToast, useClaims } from 'hooks';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';

function formatPercent(val: number) {
  return `${(val * 100).toFixed(1)}%`;
}

function formatHours(hours: number) {
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = Math.floor(hours / 24);
  const remaining = Math.round(hours % 24);
  return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`;
}

function formatPeriod(period: string) {
  const [start, end] = period.split('/');
  return `${start} – ${end}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
          {label}
        </Typography>
        <Typography variant='h5' fontWeight={600}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function TriggerExposureButton() {
  const functions = useFunctions();
  const { claims } = useClaims();
  const toast = useAsyncToast();
  const [loading, setLoading] = useState(false);

  if (!claims?.iDemandAdmin) return null;

  const handleTrigger = async () => {
    try {
      setLoading(true);
      toast.loading('Running portfolio exposure...');
      const { data } = await triggerPortfolioExposure(functions);
      toast.success(
        `Done — ${data.bucketCount} buckets, $${(data.totalTiv / 1_000_000).toFixed(1)}M TIV, ${data.alertsRaised} alerts`,
      );
    } catch (e: any) {
      toast.error(e?.message || 'Failed to trigger portfolio exposure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      onClick={handleTrigger}
      loading={loading}
      size='small'
      variant='outlined'
      startIcon={<RefreshRounded />}
    >
      Recompute Exposure
    </LoadingButton>
  );
}

export function OrgFunnelStats({ org }: { org: Org }) {
  const funnel = org.analytics?.funnel;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TriggerExposureButton />
      </Box>

      {!funnel ? (
        <Typography variant='body2' color='text.secondary' sx={{ py: 6, textAlign: 'center' }}>
          No analytics data yet. Data is updated weekly.
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant='subtitle2' color='text.secondary'>
              {formatPeriod(funnel.period)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Updated {formatFirestoreTimestamp(funnel.lastUpdated)}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { label: 'Submissions', value: funnel.submissionCount.toLocaleString() },
              { label: 'Sub → Quote Rate', value: formatPercent(funnel.submissionToQuoteRate) },
              { label: 'Quote → Bind Rate', value: formatPercent(funnel.quoteToBind) },
              { label: 'Avg Time to Bind', value: formatHours(funnel.avgHoursToBind) },
              { label: 'Avg Term Premium', value: dollarFormat(funnel.avgTermPremium) },
              { label: 'Cancellation Rate', value: formatPercent(funnel.cancellationRate) },
            ].map(({ label, value }) => (
              <Grid key={label} xs={12} sm={6} md={4}>
                <StatCard label={label} value={value} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
