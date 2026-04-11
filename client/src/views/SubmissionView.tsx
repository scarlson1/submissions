import {
  ArrowBackIosRounded,
  DataObjectRounded,
  DescriptionRounded,
  FloodRounded,
  GppBadRounded,
  HomeWorkRounded,
  InsightsRounded,
  MoreHorizRounded,
  PersonRounded,
  PolicyRounded,
  ReceiptLongRounded,
  RoomRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { doc, getDoc, orderBy, where } from 'firebase/firestore';
import { MouseEvent, ReactNode, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { SubmissionStatus, type TCollection } from '@idemand/common';
import { RatingData } from 'common';
import { Submission } from 'common/types';
import { ClaimsGuard } from 'components';
import {
  useAsyncToast,
  useDocData,
  useFetchFirestore,
  useFloodFactor,
  useJsonDialog,
  useSafeParams,
  useShowJson,
  useUpdateDoc,
} from 'hooks';
import { noop } from 'lodash';
import {
  dollarFormat,
  formatFirestoreTimestamp,
  numberFormat,
} from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

type StatusTone = 'default' | 'success' | 'warning' | 'error' | 'info';

const formatDisplayValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (typeof value === 'string') return value.trim() || '—';
  return `${value}`;
};

const formatBoolean = (value: boolean | number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  return Boolean(value) ? 'Yes' : 'No';
};

const formatCurrencyValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '—';
  return dollarFormat(value);
};

const formatNumberValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '—';
  return numberFormat(value);
};

const formatCityStatePostal = (
  city: string | null | undefined,
  state: string | null | undefined,
  postal: string | null | undefined,
) => {
  const locality = [city, state].filter(Boolean).join(', ');
  return [locality, postal].filter(Boolean).join(' ');
};

const formatAddressValue = (value: unknown) => {
  if (!value) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  if (typeof value !== 'object') return formatDisplayValue(value);

  const address = value as {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postal?: string | null;
  };

  const street = [address.addressLine1, address.addressLine2]
    .filter(Boolean)
    .join(', ');
  const locality = formatCityStatePostal(
    address.city,
    address.state,
    address.postal,
  );
  return [street, locality].filter(Boolean).join(' · ') || '—';
};

const getStatusTone = (
  status?: Submission['status'] | string | null,
): StatusTone => {
  switch (status) {
    case 'quoted':
      return 'success';
    case 'under_review':
    case 'pending_info':
      return 'warning';
    case 'cancelled':
    case 'ineligible':
      return 'error';
    case 'submitted':
      return 'info';
    default:
      return 'default';
  }
};

const formatStatusLabel = (status?: string | null) => {
  if (!status) return 'Unknown';

  return status
    .split('_')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
};

const SectionCard = ({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.08)}`,
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2.5} sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack
          direction='row'
          spacing={1.5}
          alignItems='flex-start'
          justifyContent='space-between'
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant='overline'
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {eyebrow}
            </Typography>
            <Typography variant='h6' sx={{ mt: 0.5 }}>
              {title}
            </Typography>
            {description ? (
              <Typography variant='body2' sx={{ mt: 0.5, maxWidth: 640 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {icon ? (
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 1.5,
                color: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
};

const DataRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Stack
    direction='row'
    spacing={2}
    alignItems='flex-start'
    justifyContent='space-between'
    sx={{ py: 1.25 }}
  >
    <Typography variant='body2' color='text.secondary' sx={{ minWidth: 0 }}>
      {label}
    </Typography>
    <Typography
      variant='body1'
      sx={{
        textAlign: 'right',
        fontWeight: 600,
        maxWidth: '60%',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </Typography>
  </Stack>
);

const DataGroup = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: ReactNode }>;
}) => (
  <Box>
    <Typography
      variant='caption'
      sx={{
        color: 'text.tertiary',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </Typography>
    <Box sx={{ mt: 1.25 }}>
      {rows.map((row, index) => (
        <Box key={`${title}-${row.label}`}>
          {index > 0 ? <Divider /> : null}
          <DataRow label={row.label} value={row.value} />
        </Box>
      ))}
    </Box>
  </Box>
);

const MetricTile = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        p: 2.25,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.08 : 0.5)}`,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.04)} 0%, ${alpha(
                theme.palette.common.white,
                0.02,
              )} 100%)`
            : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.94)} 0%, ${alpha(
                theme.palette.primary.main,
                0.04,
              )} 100%)`,
        backdropFilter: 'blur(18px)',
      }}
    >
      <Typography
        variant='caption'
        sx={{
          display: 'block',
          color: 'text.secondary',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography variant='h5' sx={{ mt: 1, mb: helper ? 0.75 : 0 }}>
        {value}
      </Typography>
      {helper ? <Typography variant='body2'>{helper}</Typography> : null}
    </Box>
  );
};

export const SubmissionView = () => {
  const theme = useTheme();
  const { submissionId } = useSafeParams(['submissionId']);
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const openFF = useFloodFactor((msg) => toast.error(msg));
  const dialog = useJsonDialog({ slotProps: { dialog: { maxWidth: 'md' } } });
  const showSubmissionJson = useShowJson<Submission>(
    'submissions',
    [],
    ({ id }) => `Submission ${id}`,
    null,
  );
  const { data } = useDocData<Submission>('submissions', submissionId);
  const { update: updateSubmission } = useUpdateDoc<Submission>(
    'submissions',
    noop,
    (msg) => toast.error(msg),
  );
  const { fetchData: fetchRatingData } = useFetchFirestore<RatingData>(
    'ratingData',
    [
      where('submissionId', '==', submissionId || ''),
      orderBy('metadata.created', 'desc'),
    ],
  );
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<HTMLElement | null>(null);

  const showDialog = useCallback(
    async (collection: TCollection, docId: string, title: string) => {
      try {
        const snap = await getDoc(doc(firestore, collection, docId));
        const docData = snap.data();

        if (!snap.exists() || !docData) {
          toast.error(`Failed to fetch data for doc ID ${docId}`);
          return;
        }

        dialog(docData, title);
      } catch (err: any) {
        const message = err?.message || 'Error fetching record';
        toast.error(message);
      }
    },
    [dialog, firestore],
  );

  const openSubJson = useCallback(
    () => showSubmissionJson(submissionId),
    [showSubmissionJson],
  );

  const handleCreateQuote = useCallback(
    () =>
      navigate({
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: `${submissionId}` },
        }),
      }),
    [navigate, submissionId],
  );

  const handleDecline = useCallback(
    () => async () => {
      try {
        toast.loading('saving status...');
        await updateSubmission(submissionId, {
          status: SubmissionStatus.enum.ineligible,
        });

        toast.success('saved'); // TODO: prompt "would you like to notify insured"
        toast.warn('saved - user has NOT been notified', { duration: 6000 });
      } catch (err: any) {
        console.log('err: ', err);
        toast.error('an error occurred');
      }
    },
    [updateSubmission, submissionId],
  );

  const handleOpenActionMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseActionMenu = useCallback(() => {
    setActionMenuAnchorEl(null);
  }, []);

  const openGoogleMaps = useCallback(() => {
    const latitude = data?.coordinates?.latitude;
    const longitude = data?.coordinates?.longitude;

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      toast.error('Missing coordinates');
      return;
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`,
      '_blank',
    );
  }, [data]);

  const handleShowRatingData = useCallback(async () => {
    handleCloseActionMenu();

    const ratingData = await fetchRatingData();

    if (!ratingData) {
      toast.warn('No rating documents found');
      return;
    }

    dialog(ratingData, 'Rating Data');
  }, [dialog, fetchRatingData, handleCloseActionMenu]);

  const handleShowPropertyData = useCallback(() => {
    handleCloseActionMenu();

    if (!data?.propertyDataDocId) {
      toast.error('Missing property data record');
      return;
    }

    showDialog(
      'propertyDataRes',
      data.propertyDataDocId,
      'Property Data Response',
    );
  }, [data?.propertyDataDocId, handleCloseActionMenu, showDialog]);

  const handleMenuCreateQuote = useCallback(() => {
    handleCloseActionMenu();
    handleCreateQuote();
  }, [handleCloseActionMenu, handleCreateQuote]);

  const handleMenuOpenMaps = useCallback(() => {
    handleCloseActionMenu();
    openGoogleMaps();
  }, [handleCloseActionMenu, openGoogleMaps]);

  if (!submissionId) throw new Error('Missing submission ID');

  if (!data) {
    return (
      <Typography variant='h6' textAlign='center'>
        {`Submission not found (ID: ${submissionId})`}
      </Typography>
    );
  }

  const statusTone = getStatusTone(data.status);
  const createdLabel = formatFirestoreTimestamp(data.metadata?.created, 'date');
  const addressLines = [
    data.address?.addressLine1,
    data.address?.addressLine2,
    formatCityStatePostal(
      data.address?.city,
      data.address?.state,
      data.address?.postal,
    ),
  ].filter(Boolean);
  const submissionImageUrl =
    data.imageURLs?.satellite ||
    data.imageURLs?.satelliteStreets ||
    data.imageURLs?.light ||
    data.imageURLs?.dark ||
    null;
  const limitA = data.limits?.limitA;
  const replacementCost = data.ratingPropertyData?.replacementCost ?? null;
  const limitRatio =
    replacementCost && limitA
      ? `${((limitA / replacementCost) * 100).toFixed(0)}% of RCV`
      : 'Ratio unavailable';

  const contactRows = [
    {
      label: 'Name',
      value: formatDisplayValue(
        `${data.contact?.firstName || ''} ${data.contact?.lastName || ''}`,
      ),
    },
    { label: 'Email', value: formatDisplayValue(data.contact?.email) },
  ];

  const addressRows = [
    {
      label: 'Street',
      value: formatDisplayValue(
        [data.address?.addressLine1, data.address?.addressLine2]
          .filter(Boolean)
          .join(', '),
      ),
    },
    {
      label: 'City / State / ZIP',
      value: formatDisplayValue(
        formatCityStatePostal(
          data.address?.city,
          data.address?.state,
          data.address?.postal,
        ),
      ),
    },
    { label: 'County', value: formatDisplayValue(data.address?.countyName) },
    { label: 'FIPS', value: formatDisplayValue(data.address?.countyFIPS) },
  ];

  const coverageRows = [
    {
      label: 'A: Building Limit',
      value: formatCurrencyValue(data.limits?.limitA),
    },
    {
      label: "B: Add'l Structures Limit",
      value: formatCurrencyValue(data.limits?.limitB),
    },
    {
      label: 'C: Contents Limit',
      value: formatCurrencyValue(data.limits?.limitC),
    },
    {
      label: 'D: Additional Expenses Limit',
      value: formatCurrencyValue(data.limits?.limitD),
    },
    { label: 'Deductible', value: formatCurrencyValue(data.deductible) },
  ];

  const underwritingRows = [
    {
      label: 'Prior Loss Count',
      value: formatDisplayValue(data.priorLossCount),
    },
    { label: 'Exclusions', value: formatDisplayValue(data.exclusions) },
    { label: 'Status', value: formatStatusLabel(data.status) },
    { label: 'Product', value: formatDisplayValue(data.product) },
    { label: 'Commission Source', value: formatDisplayValue(data.commSource) },
  ];

  const propertyRows = [
    {
      label: 'Replacement Cost',
      value: formatCurrencyValue(data.ratingPropertyData?.replacementCost),
    },
    { label: 'RCV Source User', value: formatBoolean(data.rcvSourceUser) },
    {
      label: 'Square Footage',
      value: formatNumberValue(data.ratingPropertyData?.sqFootage),
    },
    {
      label: 'Year Built',
      value: formatDisplayValue(data.ratingPropertyData?.yearBuilt),
    },
    {
      label: 'Distance To Coast (ft)',
      value: formatNumberValue(data.ratingPropertyData?.distToCoastFeet),
    },
    {
      label: 'Property Code',
      value: formatDisplayValue(data.ratingPropertyData?.propertyCode),
    },
    {
      label: 'CBRS Designation',
      value: formatDisplayValue(data.ratingPropertyData?.CBRSDesignation),
    },
    {
      label: 'Basement',
      value: formatDisplayValue(data.ratingPropertyData?.basement),
    },
    {
      label: 'Flood Zone',
      value: formatDisplayValue(data.ratingPropertyData?.floodZone),
    },
    {
      label: 'Number of Stories',
      value: formatDisplayValue(data.ratingPropertyData?.numStories),
    },
    {
      label: 'Elevation (m)',
      value: formatDisplayValue(data.ratingPropertyData?.elevation),
    },
    {
      label: 'Elevation Resolution',
      value: formatDisplayValue(data.elevationData?.resolution),
    },
    {
      label: 'Elevation Dataset',
      value: formatDisplayValue(data.elevationData?.data_source),
    },
  ];

  const premiumRows = [
    { label: 'Inland AALs', value: formatDisplayValue(data.AALs?.inland) },
    { label: 'Surge AALs', value: formatDisplayValue(data.AALs?.surge) },
    { label: 'Tsunami AALs', value: formatDisplayValue(data.AALs?.tsunami) },
    { label: 'Annual Premium', value: formatCurrencyValue(data.annualPremium) },
  ];

  const agentRows = [
    { label: 'Agent', value: formatDisplayValue(data.agent?.name) },
    { label: 'Agent Email', value: formatDisplayValue(data.agent?.email) },
    { label: 'Agency', value: formatDisplayValue(data.agency?.name) },
    {
      label: 'Agency Address',
      value: formatAddressValue(data.agency?.address),
    },
  ];

  return (
    <Box sx={{ pb: { xs: 6, md: 8 } }}>
      <Stack spacing={3}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: 1.5, md: 2 },
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 4 },
            color:
              theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(
                    theme.palette.background.default,
                    0.94,
                  )} 100%),
                   linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 46%),
                   radial-gradient(circle at top right, ${alpha(
                     theme.palette.secondary.main,
                     0.22,
                   )} 0%, transparent 34%)`
                : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.98)} 0%, ${alpha(
                    theme.palette.background.default,
                    0.92,
                  )} 100%),
                   linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 44%),
                   radial-gradient(circle at top right, ${alpha(
                     theme.palette.secondary.main,
                     0.28,
                   )} 0%, transparent 32%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            boxShadow: `0 28px 80px ${alpha(theme.palette.primary.main, 0.16)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(90deg, ${alpha(
                theme.palette.primary.main,
                0.05,
              )} 0 1px, transparent 1px 44px),
                repeating-linear-gradient(0deg, ${alpha(
                  theme.palette.primary.main,
                  0.05,
                )} 0 1px, transparent 1px 44px)`,
              maskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.35))',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 'auto -20% -32% 18%',
              height: 180,
              transform: 'rotate(-8deg)',
              background: alpha(theme.palette.primary.main, 0.08),
              filter: 'blur(18px)',
            },
          }}
        >
          <IconButton
            onClick={handleOpenActionMenu}
            aria-label='submission actions'
            sx={{
              position: 'absolute',
              top: 18,
              right: 18,
              zIndex: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.76),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
              },
            }}
          >
            <MoreHorizRounded />
          </IconButton>

          <Menu
            anchorEl={actionMenuAnchorEl}
            open={Boolean(actionMenuAnchorEl)}
            onClose={handleCloseActionMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <ClaimsGuard requiredClaims={['iDemandAdmin']}>
              <MenuItem onClick={handleMenuCreateQuote}>
                <ListItemIcon>
                  <PolicyRounded fontSize='small' />
                </ListItemIcon>
                Create Quote
              </MenuItem>
              <MenuItem
                onClick={handleDecline}
                disabled={data.status === SubmissionStatus.enum.quoted}
              >
                <ListItemIcon>
                  <GppBadRounded fontSize='small' />
                </ListItemIcon>
                Decline Submission
              </MenuItem>
              <MenuItem onClick={handleShowRatingData}>
                <ListItemIcon>
                  <DescriptionRounded fontSize='small' />
                </ListItemIcon>
                Show Rating Data
              </MenuItem>
              <MenuItem
                onClick={handleShowPropertyData}
                disabled={!data.propertyDataDocId}
              >
                <ListItemIcon>
                  <DescriptionRounded fontSize='small' />
                </ListItemIcon>
                Show Property Data
              </MenuItem>
              <MenuItem onClick={openSubJson}>
                <ListItemIcon>
                  <DataObjectRounded fontSize='small' />
                </ListItemIcon>
                Show JSON
              </MenuItem>
            </ClaimsGuard>
            <MenuItem
              onClick={handleMenuOpenMaps}
              disabled={
                data.coordinates?.latitude === null ||
                data.coordinates?.latitude === undefined ||
                data.coordinates?.longitude === null ||
                data.coordinates?.longitude === undefined
              }
            >
              <ListItemIcon>
                <RoomRounded fontSize='small' />
              </ListItemIcon>
              Google Maps
            </MenuItem>
            <MenuItem
              onClick={() => openFF(data.address)}
              disabled={!data?.address?.addressLine1}
            >
              <ListItemIcon>
                <FloodRounded fontSize='small' />
              </ListItemIcon>
              Flood Factor
            </MenuItem>
          </Menu>

          <Grid
            container
            spacing={3}
            alignItems='stretch'
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Grid xs={12} lg={submissionImageUrl ? 7 : 12}>
              <Stack spacing={3}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <IconButton
                    size='small'
                    onClick={() =>
                      navigate(createPath({ path: ROUTES.SUBMISSIONS }))
                    }
                    color='primary'
                    sx={{
                      backgroundColor: alpha(
                        theme.palette.background.paper,
                        0.72,
                      ),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      '&:hover': {
                        backgroundColor: alpha(
                          theme.palette.background.paper,
                          0.96,
                        ),
                      },
                    }}
                  >
                    <ArrowBackIosRounded fontSize='inherit' />
                  </IconButton>
                  <Typography
                    variant='overline'
                    sx={{
                      color: 'primary.main',
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                    }}
                  >
                    Flood Submission
                  </Typography>
                </Stack>

                <Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontFamily: '"General Sans", "IBM Plex Sans", sans-serif',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: 1.25,
                      maxWidth: 760,
                    }}
                  >
                    {addressLines[0] || 'Submission overview'}
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ maxWidth: 760, color: 'text.secondary' }}
                  >
                    {addressLines.slice(1).join(' · ') ||
                      'Review coverage, pricing, and property intelligence in one place.'}
                  </Typography>
                </Box>

                <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                  <Chip
                    label={formatStatusLabel(data.status)}
                    color={statusTone}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Submitted ${createdLabel || 'Unknown date'}`}
                    variant='outlined'
                  />
                  <Chip label={`ID ${submissionId}`} variant='outlined' />
                  {data.ratingPropertyData?.floodZone ? (
                    <Chip
                      label={`Zone ${data.ratingPropertyData.floodZone}`}
                      variant='outlined'
                    />
                  ) : null}
                </Stack>

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <MetricTile
                      label='Annual Premium'
                      value={
                        data.annualPremium !== null &&
                        data.annualPremium !== undefined
                          ? dollarFormat(data.annualPremium)
                          : 'Pending'
                      }
                      helper='Current quoted premium snapshot'
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <MetricTile
                      label='Building Limit'
                      value={formatCurrencyValue(data.limits?.limitA)}
                      helper={limitRatio}
                    />
                  </Grid>
                  <ClaimsGuard requiredClaims={['iDemandAdmin']}>
                    <Grid xs={12} sm={6}>
                      <MetricTile
                        label='Replacement Cost'
                        value={
                          data.ratingPropertyData?.replacementCost
                            ? dollarFormat(
                                data.ratingPropertyData.replacementCost,
                              )
                            : 'Unavailable'
                        }
                        helper={`Flood zone ${formatDisplayValue(data.ratingPropertyData?.floodZone)}`}
                      />
                    </Grid>
                  </ClaimsGuard>
                  <Grid xs={12} sm={6}>
                    <MetricTile
                      label='Deductible'
                      value={formatCurrencyValue(data.deductible)}
                      helper={`Prior losses ${formatDisplayValue(data.priorLossCount)}`}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            {submissionImageUrl ? (
              <Grid xs={12} lg={5}>
                <Box
                  sx={{
                    position: 'relative',
                    height: '100%',
                    minHeight: { xs: 240, md: 320 },
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    boxShadow: `0 22px 48px ${alpha(theme.palette.common.black, 0.18)}`,
                  }}
                >
                  <Box
                    component='img'
                    src={submissionImageUrl}
                    alt={`${data.address?.addressLine1 || 'Submission'} reference`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(10, 15, 24, 0.08) 0%, rgba(10, 15, 24, 0.72) 100%)',
                    }}
                  />
                  <Stack
                    spacing={0.75}
                    sx={{
                      position: 'absolute',
                      left: 18,
                      right: 18,
                      bottom: 18,
                      color: 'common.white',
                    }}
                  >
                    <Typography
                      variant='overline'
                      sx={{ color: alpha('#FFFFFF', 0.82) }}
                    >
                      Submission imagery
                    </Typography>
                    <Typography variant='h6'>
                      {data.address?.addressLine1 || 'Mapped location'}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: alpha('#FFFFFF', 0.82) }}
                    >
                      {data.imageURLs?.satellite ? 'Satellite' : 'Location'}{' '}
                      reference tied to this submission
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            ) : null}
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <Grid xs={12} lg={8}>
            <Stack spacing={3}>
              <SectionCard
                eyebrow='Identity'
                title='Property & contact'
                description='Core submission context, normalized into an easier review layout.'
                icon={<HomeWorkRounded fontSize='small' />}
              >
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <DataGroup title='Address' rows={addressRows} />
                  </Grid>
                  <Grid xs={12} md={6}>
                    <DataGroup title='Contact' rows={contactRows} />
                  </Grid>
                </Grid>
              </SectionCard>

              <SectionCard
                eyebrow='Coverage'
                title='Limits, deductible, and underwriting'
                description='Coverage values remain intact, but the hierarchy now makes the insurance picture much easier to scan.'
                icon={<PolicyRounded fontSize='small' />}
              >
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <DataGroup
                      title='Limits & deductible'
                      rows={coverageRows}
                    />
                  </Grid>
                  <Grid xs={12} md={6}>
                    <DataGroup
                      title='Underwriting context'
                      rows={underwritingRows}
                    />
                  </Grid>
                </Grid>
                <LimitAPctCheck
                  limitA={data.limits?.limitA}
                  rcv={data.ratingPropertyData?.replacementCost}
                />
              </SectionCard>

              <ClaimsGuard requiredClaims={['iDemandAdmin']}>
                <SectionCard
                  eyebrow='Property Intelligence'
                  title='Modeling inputs and risk signals'
                  description='Every property-data field from the temporary page is preserved here, with a stronger reading rhythm for analysts and underwriters.'
                  icon={<InsightsRounded fontSize='small' />}
                >
                  <Grid container spacing={3}>
                    <Grid xs={12}>
                      <DataGroup
                        title='Rating property data'
                        rows={propertyRows}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </ClaimsGuard>
            </Stack>
          </Grid>

          <Grid xs={12} lg={4}>
            <Stack spacing={3}>
              <ClaimsGuard requiredClaims={['iDemandAdmin']}>
                <SectionCard
                  eyebrow='Pricing'
                  title='AALs and premium'
                  description='Loss metrics and premium are grouped together so the financial signal sits in one place.'
                  icon={<ReceiptLongRounded fontSize='small' />}
                >
                  <DataGroup title='Pricing overview' rows={premiumRows} />
                </SectionCard>
              </ClaimsGuard>

              <SectionCard
                eyebrow='Distribution'
                title='Agent and agency'
                description='Submission routing details, when available.'
                icon={<PersonRounded fontSize='small' />}
              >
                <DataGroup title='Distribution details' rows={agentRows} />
              </SectionCard>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export function LimitAPctCheck({
  limitA,
  rcv,
}: {
  limitA?: number;
  rcv?: number | null;
}) {
  if (!(rcv && limitA)) return null;

  const pctOfRCV = limitA / rcv;
  const isAbove20Pct = pctOfRCV > 1.2;

  if (isAbove20Pct) {
    return (
      <Alert severity='warning' sx={{ mt: 2 }}>
        Building limit is {'>'} 20% above the replacement cost estimate.
      </Alert>
    );
  }

  return null;
}
