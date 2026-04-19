// select location before rerouting to ClaimNew (required location before loading component)
// select location -> redirect to /policies/policyId/locationId/claims/new

import type { Policy, WithId } from '@idemand/common';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  Chip,
  Container,
  Stack,
  Typography,
  type ChipProps,
} from '@mui/material';
import { ErrorFallback, LoadingSpinner, PageMeta } from 'components';
import { format, startOfDay } from 'date-fns';
import { FormattedAddress } from 'elements';
import ClaimForm from 'elements/forms/ClaimForm';
import { orderBy, Timestamp, where } from 'firebase/firestore';
import { useClaims, useCollectionData, useDocData } from 'hooks';
import { getPoliciesQueryProps } from 'modules/db/query';
import {
  calcPolicyStatus,
  compressedToAddress,
  dollarFormat,
} from 'modules/utils';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import invariant from 'tiny-invariant';

// refactor options

// always start with policy pass location ID as optional search param
// --> create claim doc once location is selected ?? or create without location ??

export const ClaimNewFromPolicy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramPolicyId = searchParams.get('policyId');
  const paramLcnId = searchParams.get('locationId');

  const [policyId, setPolicyId] = useState(() => paramPolicyId || '');
  const [lcnId, setLcnId] = useState(() => paramLcnId || '');

  if (!policyId)
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          <ChoosePolicy
            onSelect={(id) => {
              setPolicyId(id);
              setSearchParams({ policyId: id });
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );

  if (!lcnId)
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          <ChooseLocation
            onSelect={(id) => {
              setLcnId(id);
              setSearchParams((prev) => {
                prev.set('locationId', id);
                return prev;
              });
            }}
            policyId={policyId}
          />
        </Suspense>
      </ErrorBoundary>
    );

  // TODO: dont allow submitting another claim for same property while on is already open ??

  return <NewClaim policyId={policyId} locationId={lcnId} />;
};

// const nowMS = Date.now();

const startOfToday = startOfDay(new Date());

// {constraints}: {constraints: QueryFieldFilterConstraint[]}
function ChoosePolicy({ onSelect }: { onSelect: (policyId: string) => void }) {
  const { user, claims } = useClaims();
  invariant(user);
  const { constraints } = useMemo(
    () => getPoliciesQueryProps(user, claims),
    [user, claims],
  );
  const { data: policies } = useCollectionData<Policy>('policies', [
    ...constraints,
    where('effectiveDate', '<', Timestamp.fromDate(startOfToday)),
    orderBy('metadata.created', 'desc'),
  ]);

  // allow claims to be submitted after expiration

  // const policies = useMemo(
  //   () =>
  //     rawPolicies.filter(
  //       (p) =>
  //         p.effectiveDate.toMillis() < nowMS &&
  //         p.expirationDate.toMillis() > nowMS,
  //     ),
  //   [rawPolicies],
  // );

  if (!policies || !policies.length) {
    return (
      <Stack direction='column' spacing={3} sx={{ maxWidth: 460, mx: 'auto' }}>
        <Typography variant='h6' gutterBottom sx={{ mx: 'auto' }}>
          No active policies found
        </Typography>
        <Button
          component={RouterLink}
          to={createPath({ path: ROUTES.CONTACT })}
        >
          Contact Support
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        flexDisplay: 'flex',
        direction: 'column',
        alignItems: 'center',
        maxWidth: 460,
        mx: 'auto',
      }}
    >
      <Typography gutterBottom variant='h4' sx={{ flexShrink: 0 }}>
        Select a policy
      </Typography>
      <Stack
        spacing={2}
        sx={{
          pb: 3,
        }}
      >
        {policies.map((p) => (
          <SelectCard
            key={p.id}
            id={p.id}
            title={`Policy ${p.id}`}
            subtitle={
              <Stack
                sx={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  color='text.secondary'
                  variant='subtitle2'
                  sx={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >{`${p.namedInsured.displayName} | ${p.namedInsured.email}`}</Typography>
                <Stack direction='row' spacing={2}>
                  <Typography color='text.tertiary' variant='body2'>
                    {Object.values(p.locations)[0]?.address?.s1}
                  </Typography>
                  {Boolean(Object.keys(p.locations)[1]) ? (
                    <Typography
                      color='text.tertiary'
                      variant='body2'
                    >{`+${Object.keys(p.locations).length - 1} more locations`}</Typography>
                  ) : null}
                </Stack>
              </Stack>
            }
            secondaryAction={<Chip {...getChipProps(p)} size='small' />}
            onSelect={onSelect}
            imgSrc={p.imageURLs?.satellite || ''}
          />
        ))}
      </Stack>
    </Box>
  );
}

function getChipProps(p: WithId<Policy>): ChipProps {
  const status = calcPolicyStatus(p);
  let color: ChipProps['color'] = 'primary';

  switch (status) {
    case 'cancelled':
      // case 'expired':
      color = 'default';
      break;
    case 'expired':
      color = 'warning';
      break;
    case 'pending':
      color = 'secondary';
      break;
    default:
      break;
  }

  return {
    label: status,
    color,
  };
}

function ChooseLocation({
  onSelect,
  policyId,
}: {
  onSelect: (policyId: string) => void;
  policyId: string;
}) {
  const { data: policy } = useDocData<Policy>('policies', policyId);

  return (
    <Box
      sx={{
        flexDisplay: 'flex',
        direction: 'column',
        alignItems: 'center',
        maxWidth: 460,
        mx: 'auto',
      }}
    >
      <Typography gutterBottom variant='h4' sx={{ flexShrink: 0 }}>
        Select a Location
      </Typography>
      <Stack
        spacing={2}
        sx={{
          pb: 3,
        }}
      >
        {Object.entries(policy.locations).map(([lcnId, lcn]) => (
          <SelectCard
            key={lcnId}
            id={lcnId}
            title={`${lcn.address.s1} ${lcn.address.s2 || ''}`}
            // subtitle={`${dollarFormat(lcn.annualPremium)}/yr`}
            subtitle={
              <Stack
                sx={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  color='text.secondary'
                  variant='subtitle2'
                  sx={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >{`Policy ${policy.id}`}</Typography>
                <Stack direction='row' spacing={2}>
                  <Typography color='text.tertiary' variant='body2'>
                    {`${dollarFormat(lcn.annualPremium)}/yr`}
                  </Typography>
                </Stack>
                {lcn.cancelEffDate &&
                lcn.cancelEffDate.toMillis() < startOfToday.getTime() ? (
                  <Typography color='warning.main'>{`Location cancellation date: ${format(lcn.cancelEffDate.toDate(), 'MM/dd/yyyy')}`}</Typography>
                ) : null}
              </Stack>
            }
            onSelect={() => onSelect(lcnId)}
            imgSrc={policy.imageURLs?.satellite || ''}
            secondaryAction={
              <Chip
                label={'active'}
                color={
                  lcn.cancelEffDate &&
                  lcn.cancelEffDate.toMillis() < startOfToday.getTime()
                    ? 'warning'
                    : 'primary'
                }
                size='small'
                sx={{ ml: 2 }}
              />
            }
          />
        ))}
      </Stack>
    </Box>
  );
}

function SelectCard({
  id,
  onSelect,
  title,
  subtitle,
  imgSrc,
  secondaryAction,
}: {
  id: string;
  onSelect: (id: string) => void;
  imgSrc: string;
  title: string;
  subtitle: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <Card sx={{ display: 'flex', minWidth: { xs: 300, sm: 400, md: 420 } }}>
      <CardMedia
        component='img'
        sx={{ width: 120, minWidth: 120 }}
        src={imgSrc}
        alt='Location satellite image'
      />
      <CardActionArea
        onClick={() => onSelect(id)}
        sx={{ minWidth: 0, overflow: 'hidden' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 2, sm: 3 },
            pl: { xs: 3, sm: 4 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant='h6'
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {title}
            </Typography>
            {secondaryAction}
          </Box>

          <Typography
            component='div'
            color='text.secondary'
            variant='subtitle1'
            sx={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

// TODO: reuse - same as ClaimNew except props instead of url params
function NewClaim({
  policyId,
  locationId,
}: {
  policyId: string;
  locationId: string;
}) {
  const { data: policy } = useDocData<Policy>('policies', policyId);

  useEffect(() => {
    if (policy) {
      let lcns = Object.keys(policy.locations);
      if (!lcns.includes(locationId))
        throw new Error(
          `location ${locationId} does not exist in policy ${policyId}`,
        );
    }
  }, [policy, policyId, locationId]);

  const lcnSummary = useMemo(() => {
    return locationId ? policy.locations[locationId] : null;
  }, [policy, locationId]);

  return (
    <>
      <PageMeta title={`iDemand - New Claim ${policyId}`} />
      <Container maxWidth='xl' disableGutters sx={{ py: { xs: 1, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            // flexDirection: { xs: 'row-reverse', sm: 'row' },
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            pt: 1,
            pb: 2,
            px: 2,
          }}
        >
          <Typography
            variant='overline'
            color='text.secondary'
            sx={{
              lineHeight: 1.5,
              display: { xs: 'none', sm: 'inline-block' },
            }}
          >{`Policy: ${policyId}`}</Typography>
          <Typography variant='h6'>New Claim</Typography>
          {lcnSummary ? (
            <FormattedAddress
              address={compressedToAddress(lcnSummary.address)}
              variant='body2'
              color='text.secondary'
              align='right'
            />
          ) : null}
        </Box>
        <Container maxWidth='sm' sx={{ py: { xs: 3, sm: 4, md: 6 } }}>
          <ClaimForm policyId={policyId} locationId={locationId} />
        </Container>
      </Container>
    </>
  );
}
