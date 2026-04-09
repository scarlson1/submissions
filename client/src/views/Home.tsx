import type { Product } from '@idemand/common';
import {
  ArrowForwardRounded,
  AutorenewRounded,
  FiberNewRounded,
  LocationOnRounded,
  PolicyRounded,
  RequestQuoteRounded,
  ShieldRounded,
  TrendingUpRounded,
  VerifiedRounded,
  WarningAmberRounded,
  WaterRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { keyframes, lighten, useTheme } from '@mui/material/styles';
import { useAuth } from 'context/AuthContext';
import { useClaims, useDocData } from 'hooks';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(62,224,127,0.5); }
  50%       { box-shadow: 0 0 14px rgba(62,224,127,0.9); }
`;

// ─── Full-bleed helper ────────────────────────────────────────────────────────
// Negates Layout's Container padding so background bleeds edge-to-edge.
// Layout applies px: { xs: 2, sm: 3, md: 4, lg: 6 } and pt: { xs: 2, sm: 3, md: 4, lg: 6 }
function FullBleed({
  children,
  sx = {},
}: {
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        mx: { xs: -2, sm: -3, md: -4, lg: -6 },
        px: { xs: 2, sm: 3, md: 4, lg: 6 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
  delay = 0,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  delay?: number;
}) {
  return (
    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      sx={{
        mb: 2.5,
        animation: `${fadeUp} 0.45s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <Typography
        color='text.tertiary'
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '0.025em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
      {action && (
        <Button
          size='small'
          endIcon={
            <ArrowForwardRounded sx={{ fontSize: '0.8rem !important' }} />
          }
          onClick={action.onClick}
          sx={{
            color: (theme) => theme.palette.info.light, // '#66B2FF',
            fontSize: '0.72rem',
            fontWeight: 600,
            px: 1.5,
            py: 0.5,
            minWidth: 0,
            '&:hover': { background: 'rgba(0,127,255,0.08)' },
          }}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  );
}

function MetricCard({
  value,
  label,
  sub,
  trend,
  delay = 0,
  onClick,
}: {
  value: string;
  label: string;
  sub?: string;
  trend?: { value: string; up: boolean };
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: { xs: 3, md: 3.5 },
        borderRadius: '14px',
        border: '1px solid rgba(99,179,255,0.13)',
        background:
          'linear-gradient(135deg, rgba(0,127,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        animation: `${fadeUp} 0.55s ease both`,
        animationDelay: `${delay}ms`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1.5px',
          background:
            'linear-gradient(90deg, transparent, rgba(0,127,255,0.45), transparent)',
        },
        ...(onClick && {
          '&:hover': {
            borderColor: 'rgba(99,179,255,0.28)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          },
        }),
      }}
    >
      <Typography
        variant='overline'
        color='text.tertiary'
        sx={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          mb: 1.5,
        }}
      >
        {label}
      </Typography>
      <Stack direction='row' alignItems='baseline' spacing={1.5}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '1.75rem', md: '2rem' },
            lineHeight: 1,
            // background: 'linear-gradient(135deg, #E7EBF0 30%, #99CCF3 100%)',
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'linear-gradient(rgba(0 0 0 / 0.1), rgba(0 0 0 / 0.1)), linear-gradient(254.86deg, rgba(0, 58, 117, 0.18) 0%, rgba(11, 13, 14, 0.3) 49.98%, rgba(0, 76, 153, 0.21) 100.95%)'
                : 'linear-gradient(rgba(255 255 255 / 0.3), rgba(255 255 255 / 0.3)), linear-gradient(254.86deg, rgba(194, 224, 255, 0.12) 0%, rgba(194, 224, 255, 0.12) 0%, rgba(255, 255, 255, 0.3) 49.98%, rgba(240, 247, 255, 0.3) 100.95%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {value}
        </Typography>
        {trend && (
          <Stack direction='row' alignItems='center' spacing={0.4}>
            <TrendingUpRounded
              sx={{
                fontSize: '0.85rem',
                // color: trend.up ? '#3EE07F' : '#FF505F',
                color: (theme) =>
                  trend.up
                    ? theme.palette.success.light
                    : theme.palette.error.light,
                transform: trend.up ? 'none' : 'scaleY(-1)',
              }}
            />
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                // color: trend.up ? '#3EE07F' : '#FF505F',
                color: (theme) =>
                  trend.up
                    ? theme.palette.success.light
                    : theme.palette.error.light,
              }}
            >
              {trend.value}
            </Typography>
          </Stack>
        )}
      </Stack>
      {sub && (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            fontSize: '0.72rem',
            mt: 0.75,
          }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function RenewalRow({
  address,
  insured,
  daysLeft,
  premium,
  delay = 0,
}: {
  address: string;
  insured: string;
  daysLeft: number;
  premium: string;
  delay?: number;
}) {
  const urgent = daysLeft <= 14;
  const pct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100));

  return (
    <Box
      sx={{
        py: 2.5,
        px: 3,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: urgent ? 'rgba(255,80,95,0.22)' : 'rgba(99,179,255,0.1)',
        background: urgent ? 'rgba(255,80,95,0.04)' : 'rgba(255,255,255,0.02)',
        animation: `${fadeUp} 0.5s ease both`,
        animationDelay: `${delay}ms`,
        transition: 'background 0.18s',
        '&:hover': {
          background: urgent ? 'rgba(255,80,95,0.07)' : 'rgba(0,127,255,0.04)',
        },
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        spacing={2}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{ mb: 0.5 }}
          >
            {urgent && (
              <WarningAmberRounded
                sx={{ fontSize: '0.82rem', color: '#FF7A86', flexShrink: 0 }}
              />
            )}
            <Typography
              color='text.secondary'
              sx={{
                fontSize: '0.83rem',
                fontWeight: 600,
                // color: '#CDD2D7',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {address}
            </Typography>
          </Stack>
          <Typography
            variant='body2'
            color='text.tertiary'
            sx={{
              fontSize: '0.72rem',
              // color: 'rgba(160,170,180,0.5)'
            }}
          >
            {insured}
          </Typography>
          <LinearProgress
            variant='determinate'
            value={pct}
            sx={{
              mt: 1.5,
              height: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': {
                bgcolor: urgent ? '#FF505F' : '#007FFF',
                borderRadius: 2,
              },
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: (theme) =>
                urgent ? theme.palette.error.light : theme.palette.info.light,
              mb: 0.5,
            }}
          >
            {daysLeft}d left
          </Typography>
          <Typography
            variant='body2'
            color='text.tertiary'
            sx={{ fontSize: '0.7rem' }}
          >
            {premium}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ActivityItem({
  label,
  meta,
  type,
  delay = 0,
}: {
  label: string;
  meta: string;
  type: 'quote' | 'policy' | 'submission' | 'renewal';
  delay?: number;
}) {
  const theme = useTheme();
  const colors: Record<string, string> = {
    quote: theme.palette.info.light, // '#66B2FF',
    policy: theme.palette.success.light, // '#3EE07F',
    submission: theme.palette.warning.light, // '#FFDC48',
    renewal: theme.palette.error.light, // '#FF7A86',
  };
  const labels: Record<string, string> = {
    quote: 'Quote',
    policy: 'Policy',
    submission: 'Submission',
    renewal: 'Renewal',
  };
  return (
    <Stack
      direction='row'
      alignItems='center'
      spacing={2.5}
      sx={{
        py: 1.75,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        animation: `${fadeUp} 0.45s ease both`,
        animationDelay: `${delay}ms`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: colors[type],
          flexShrink: 0,
          boxShadow: `0 0 5px ${colors[type]}80`,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          color='text.secondary'
          sx={{
            fontSize: '0.8rem',
            // color: '#B2BAC2',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
        <Typography color='text.tertiary' sx={{ fontSize: '0.68rem' }}>
          {meta}
        </Typography>
      </Box>
      <Chip
        label={labels[type]}
        size='small'
        sx={{
          height: 19,
          fontSize: '0.62rem',
          fontWeight: 600,
          bgcolor: `${colors[type]}18`,
          color: colors[type],
          border: `1px solid ${colors[type]}30`,
          flexShrink: 0,
        }}
      />
    </Stack>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
  primary = false,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
  delay?: number;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: { xs: 3, md: 3.5 },
        borderRadius: '14px',
        border: '1px solid',
        borderColor: (theme) =>
          primary ? 'rgba(0,127,255,0.42)' : theme.palette.divider, // primary ? 'rgba(0,127,255,0.42)' : 'rgba(99,179,255,0.1)',
        background: primary
          ? 'linear-gradient(135deg, rgba(0,127,255,0.15) 0%, rgba(0,57,117,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        animation: `${fadeUp} 0.5s ease both`,
        animationDelay: `${delay}ms`,
        '&:hover': {
          borderColor: primary
            ? 'rgba(0,127,255,0.72)'
            : 'rgba(99,179,255,0.24)',
          transform: 'translateY(-3px)',
          boxShadow: primary
            ? '0 14px 40px rgba(0,127,255,0.2)'
            : '0 8px 24px rgba(0,0,0,0.18)',
        },
        '&:hover .qa-arrow': { transform: 'translateX(3px)', opacity: 1 },
      }}
    >
      <Stack
        direction='row'
        alignItems='flex-start'
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            // background: primary
            //   ? 'linear-gradient(135deg, #007FFF, #0059B2)'
            //   : 'rgba(0,127,255,0.1)',
            background: (theme) =>
              primary
                ? `linear-gradient(135deg, ${theme.palette.primary[400]}, ${theme.palette.primary[900]})`
                : 'rgba(0,127,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // color: primary ? '#fff' : '#66B2FF',
            color: (theme) =>
              primary
                ? theme.palette.common.white
                : theme.palette.primary.light,
          }}
        >
          {icon}
        </Box>
        <ArrowForwardRounded
          className='qa-arrow'
          sx={{
            fontSize: '1rem',
            // color: primary ? '#66B2FF' : 'rgba(99,179,255,0.32)',
            color: (theme) =>
              primary
                ? theme.palette.primary.light
                : theme.palette.primary[200],
            opacity: 0.5,
            transition: 'all 0.2s ease',
          }}
        />
      </Stack>
      <Typography
        sx={{
          fontFamily: '"Syne", sans-serif',
          fontWeight: 700,
          fontSize: '0.92rem',
          // color: primary ? '#E7EBF0' : '#CDD2D7',
          color: (theme) =>
            primary
              ? theme.palette.getContrastText(theme.palette.primary.light)
              : theme.palette.text.tertiary,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        color='text.tertiary'
        sx={{
          fontSize: '0.74rem',
          lineHeight: 1.55,
        }}
      >
        {desc}
      </Typography>
    </Box>
  );
}

// ─── UNAUTHENTICATED LANDING ──────────────────────────────────────────────────
export function UnauthenticatedHome({ productId }: { productId: Product }) {
  const navigate = useNavigate();
  const { data } = useDocData<{ [key: string]: boolean }>('states', productId);

  const activeStateCount = useMemo(() => {
    if (!data) return 0;
    return Object.values(data).filter(Boolean).length;
  }, [data]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>

      {/* Hero — full bleed dark */}
      <FullBleed
        sx={{
          // background:
          //   'linear-gradient(180deg, #060e1a 0%, #0a1929 55%, #0d2240 100%)',
          background: (theme) => theme.palette.gradients.linearSubtle,
          pt: { xs: 14, md: 20 },
          pb: { xs: 12, md: 18 },
          mt: { xs: -2, sm: -3, md: -4, lg: -6 }, // undo Layout top padding
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,127,255,0.042) 1px, transparent 1px), linear-gradient(90deg, rgba(0,127,255,0.042) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            pointerEvents: 'none',
          }}
        />
        {/* Top radial glow */}
        <Box
          sx={{
            position: 'absolute',
            top: '-25%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1000px',
            height: '700px',
            background:
              'radial-gradient(ellipse, rgba(0,127,255,0.1) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth='lg' sx={{ position: 'relative' }}>
          <Box sx={{ mb: 4, animation: `${fadeUp} 0.4s ease both` }}>
            <Chip
              color='primary'
              variant='outlined'
              icon={
                <VerifiedRounded
                  // color='info'
                  sx={{
                    fontSize: '0.82rem !important',
                    // color: '#66B2FF !important',
                    // color: (theme) =>
                    //   `${theme.palette.primary.light} !important`,
                  }}
                />
              }
              label={`Licensed Surplus Lines ${activeStateCount ? `· ${activeStateCount} States` : ''}`}
              sx={{
                background: 'rgba(0,127,255,0.1)',
                // border: '1px solid rgba(0,127,255,0.26)',
                // border: (theme) => `1px solid ${theme.palette.primary.light}`,
                // color: (theme) => theme.palette.primary.light,
                // color: '#99CCF3',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.03em',
                height: 28,
              }}
            />
          </Box>

          <Typography
            variant='h1'
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontWeight: 800,
              fontSize: {
                xs: '2.8rem',
                sm: '3.8rem',
                md: '5.2rem',
                lg: '6rem',
              },
              lineHeight: 1.03,
              letterSpacing: '-0.025em',
              mb: 3.5,
            }}
          >
            <Box
              component='span'
              sx={{
                display: 'block',
                // color: '#E7EBF0',
                color: (theme) => lighten(theme.palette.text.tertiary, 0.2),
                animation: `${fadeUp} 0.5s ease both`,
                animationDelay: '60ms',
              }}
            >
              Flood insurance,
            </Box>
            <Box
              component='span'
              sx={{
                display: 'block',
                background:
                  'linear-gradient(90deg, #007FFF, #66B2FF, #3399FF, #007FFF)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shimmer} 5s linear infinite, ${fadeUp} 0.5s ease both`,
                animationDelay: '0s, 120ms',
              }}
            >
              reinvented.
            </Box>
          </Typography>

          <Typography
            variant='subtitle1'
            sx={{
              // color: 'rgba(178,186,194,0.72)',
              color: (theme) => theme.palette.text.tertiary,
              // fontSize: { xs: '1rem', md: '1.2rem' },
              maxWidth: 500,
              lineHeight: 1.6,
              mb: 6,
              animation: `${fadeUp} 0.5s ease both`,
              animationDelay: '180ms',
            }}
          >
            Accurate, bindable flood quotes in under 2 minutes. Built for agents
            and insureds who expect more from their coverage platform.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              animation: `${fadeUp} 0.5s ease both`,
              animationDelay: '260ms',
            }}
          >
            <Button
              size='large'
              variant='contained'
              endIcon={<ArrowForwardRounded />}
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                )
              }
              sx={{
                background: 'linear-gradient(135deg, #007FFF 0%, #0059B2 100%)',
                color: '#fff',
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                px: 5,
                py: 1.75,

                boxShadow: '0 8px 28px rgba(0,127,255,0.3)',
                border: '1px solid rgba(102,178,255,0.14)',
                transition: 'all 0.22s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #3399FF 0%, #007FFF 100%)',
                  boxShadow: '0 12px 40px rgba(0,127,255,0.45)',
                },
              }}
            >
              Get a free quote
            </Button>
            <Button
              variant='outlined'
              size='large'
              onClick={() => navigate(createPath({ path: ROUTES.AGENCY_NEW }))}
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 600,
                fontSize: '1rem',
                px: 5,
                py: 1.75,
              }}
            >
              Partner with us
            </Button>
          </Stack>
        </Container>
      </FullBleed>

      {/* Stats strip */}
      <FullBleed
        sx={{
          // background: '#0a1929',
          background: (theme) => theme.palette.background.paper,
          // borderTop: '1px solid rgba(0,127,255,0.1)',
          // borderBottom: '1px solid rgba(0,127,255,0.1)',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth='lg'>
          <Grid container spacing={3}>
            {[
              { value: '$40M+', label: 'Coverage written', delay: 0 },
              {
                value: activeStateCount || '',
                label: 'Active states',
                delay: 70,
              },
              { value: '< 2 min', label: 'Average quote time', delay: 140 },
              { value: '99.8%', label: 'Platform uptime', delay: 210 },
            ].map((s) => (
              <Grid xs={6} md={3} key={s.label}>
                <Box
                  sx={{
                    textAlign: 'center',
                    animation: `${fadeUp} 0.5s ease both`,
                    animationDelay: `${s.delay}ms`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '2.6rem' },
                      background:
                        'linear-gradient(135deg, #66B2FF 0%, #007FFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                      mb: 1,
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    sx={{
                      fontSize: '0.68rem',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </FullBleed>

      {/* Features section */}
      <FullBleed
        sx={{
          // background: '#07101e',
          background: (theme) => theme.palette.background.default,
          py: { xs: 10, md: 14 },
        }}
      >
        <Container maxWidth='lg'>
          <Box sx={{ textAlign: 'center', mb: { xs: 7, md: 10 } }}>
            <Typography
              variant='h3'
              color='text.secondary'
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                // color: '#E7EBF0',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
                animation: `${fadeUp} 0.5s ease both`,
              }}
            >
              Everything in one platform
            </Typography>
            <Typography
              color='text.tertiary'
              variant='subtitle1'
              sx={{
                maxWidth: 460,
                mx: 'auto',
                lineHeight: 1.72,
                animation: `${fadeUp} 0.5s ease both`,
                animationDelay: '70ms',
              }}
            >
              From first quote to bound policy to claims — managed in a single,
              purpose-built system.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: <WaterRounded />,
                title: 'Instant Flood Quotes',
                desc: 'Real-time property data and automated rating delivers bindable quotes without the back-and-forth.',
                delay: 0,
              },
              {
                icon: <VerifiedRounded />,
                title: 'Surplus Lines Expertise',
                desc: 'Comprehensive surplus lines coverage with state-specific compliance built in from day one.',
                delay: 80,
              },
              {
                icon: <PolicyRounded />,
                title: 'Full Policy Lifecycle',
                desc: 'Endorse, cancel, reinstate, and renew all from one interface — no manual paperwork.',
                delay: 160,
              },
              {
                icon: <ShieldRounded />,
                title: 'Agent & Agency Tools',
                desc: 'Dedicated portals with commission tracking, team management, and branded deliverables.',
                delay: 240,
              },
              {
                icon: <LocationOnRounded />,
                title: 'Portfolio Management',
                desc: 'Bulk quote and manage multi-location portfolios. Import, rate, and bind at scale.',
                delay: 320,
              },
              {
                icon: <TrendingUpRounded />,
                title: 'Real-Time Analytics',
                desc: 'Track premiums written, renewal pipelines, and loss ratios across your entire book.',
                delay: 400,
              },
            ].map((f) => (
              <Grid xs={12} sm={6} md={4} key={f.title}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2, // '14px',
                    // border: '1px solid rgba(99,179,255,0.1)',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    background: 'rgba(255,255,255,0.02)',
                    height: '100%',
                    animation: `${fadeUp} 0.5s ease both`,
                    animationDelay: `${f.delay}ms`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'rgba(99,179,255,0.22)',
                      background: 'rgba(0,127,255,0.04)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      background: 'rgba(0,127,255,0.1)',
                      border: '1px solid rgba(0,127,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#66B2FF',
                      mb: 2.5,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography
                    color='text.tertiary'
                    sx={{
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 700,
                      // color: '#CDD2D7',
                      mb: 1,
                    }}
                  >
                    {f.title}
                  </Typography>
                  <Typography variant='body2' color='text.tertiary'>
                    {f.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </FullBleed>

      {/* CTA footer */}
      <FullBleed
        sx={{
          background: 'linear-gradient(180deg, #07101e 0%, #050c18 100%)',
          borderTop: '1px solid rgba(0,127,255,0.09)',
          py: { xs: 10, md: 14 },
          borderRadius: 2,
        }}
      >
        <Container maxWidth='lg'>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                color: '#E7EBF0',
                mb: 1.5,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
              }}
            >
              Ready to get covered?
            </Typography>
            <Typography
              sx={{
                color: 'rgba(178,186,194,0.58)',
                mb: 5,
                maxWidth: 460,
                mx: 'auto',
                lineHeight: 1.72,
              }}
            >
              No commitment required. Get an accurate quote in minutes.
            </Typography>
            <Button
              variant='contained'
              size='large'
              endIcon={<ArrowForwardRounded />}
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                )
              }
              sx={{
                background: '#007FFF',
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                px: 6,
                py: 1.75,
                fontSize: '1rem',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: '#3399FF',
                  boxShadow: '0 10px 32px rgba(0,127,255,0.38)',
                },
              }}
            >
              Start a quote — it's free
            </Button>
          </Box>
        </Container>
      </FullBleed>
    </>
  );
}

// ─── AUTHENTICATED DASHBOARD ──────────────────────────────────────────────────
// TODO: Replace placeholder data
export function AuthenticatedHome() {
  const navigate = useNavigate();
  const { user, claims } = useClaims();

  const isAdmin = claims?.iDemandAdmin;
  const isOrgAdmin = claims?.orgAdmin;
  const isAgent = claims?.agent;
  const isPowerUser = isAdmin || isOrgAdmin || isAgent;

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Upcoming renewals — wire to useCollectionData / useInfiniteDocs in production
  const renewals = [
    {
      address: '1420 Harbor View Dr, Tampa FL',
      insured: 'Michael Chen',
      daysLeft: 6,
      premium: '$2,840/yr',
    },
    {
      address: '88 Coastal Bend, Galveston TX',
      insured: 'Sarah Williams',
      daysLeft: 11,
      premium: '$1,920/yr',
    },
    {
      address: '301 Bayshore Blvd, Miami FL',
      insured: 'James Porter',
      daysLeft: 19,
      premium: '$3,560/yr',
    },
    {
      address: '7 Pelican Cove, Biloxi MS',
      insured: 'Linda Tran',
      daysLeft: 26,
      premium: '$1,140/yr',
    },
  ];

  const recentActivity = [
    {
      label: '12 Marsh Creek Rd — Quote issued',
      meta: '2 hours ago',
      type: 'quote' as const,
    },
    {
      label: 'Policy POL-00492 bound',
      meta: '5 hours ago',
      type: 'policy' as const,
    },
    {
      label: '340 Waterway Ave — New submission',
      meta: 'Yesterday 4:12 PM',
      type: 'submission' as const,
    },
    {
      label: 'Policy POL-00381 up for renewal',
      meta: 'Yesterday 9:00 AM',
      type: 'renewal' as const,
    },
    {
      label: '55 Tidal Flats — Quote issued',
      meta: '2 days ago',
      type: 'quote' as const,
    },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>

      {/* Header bar — full bleed */}
      {/* TODO: add gradient to theme */}
      {/* light: {
      palette: {
        gradient: {
          main: "linear-gradient(-39deg, #4991f8 0%, #4bc1ff 100%)",
          mainChannel: "0 0 0",
          light: "linear-gradient(135deg, #4aaffd 0%, #4992f8 100%)",
          lightChannel: "0 0 0",
          dark: "linear-gradient(135deg, #4cc2ff 0%, #4aa0fa 100%)",
          darkChannel: "0 0 0",
          contrastText: "#fff",
          contrastTextChannel: "0 0 0"
        }
      } */}
      <FullBleed
        sx={{
          // background:
          // 'linear-gradient(160deg, #060e1a 0%, #0a1929 65%, #0d2240 100%)',
          background: (theme) => theme.palette.gradients.linearSubtle,
          // background: (theme) =>
          //   theme.palette.mode === 'dark'
          //     ? `linear-gradient(160deg, ${theme.palette.primaryDark[900]} 0%,${theme.palette.primaryDark[800]} 65%, ${theme.palette.primaryDark[700]} 100%)`
          //     : `linear-gradient(160deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 65%, ${theme.palette.grey[300]} 100%)`,
          pt: { xs: 8, md: 10 },
          pb: { xs: 7, md: 9 },
          mb: { xs: 5, md: 7 },
          mt: { xs: -2, sm: -3, md: -4, lg: -6 },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`, // '1px solid rgba(0,127,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,127,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,127,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '-50%',
            right: '5%',
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(ellipse, rgba(0,57,117,0.16) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth='lg' sx={{ position: 'relative' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent='space-between'
            gap={3}
          >
            <Box>
              <Stack
                direction='row'
                alignItems='center'
                spacing={1.5}
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'success.light', // '#3EE07F',
                    animation: `${pulseGlow} 2.5s ease-in-out infinite`,
                  }}
                />
                <Typography
                  color='success.light'
                  sx={{
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    // color: '#6AE79C',
                    animation: `${fadeUp} 0.38s ease both`,
                  }}
                >
                  {greeting}
                </Typography>
              </Stack>
              <Typography
                color='text.primary'
                sx={{
                  fontFamily: '"Syne", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  // color: '#E7EBF0',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.1,
                  animation: `${fadeUp} 0.42s ease both`,
                  animationDelay: '50ms',
                }}
              >
                {firstName},{' '}
                <Box component='span' color='text.secondary' fontWeight={600}>
                  here's your overview.
                </Box>
              </Typography>
              {isPowerUser && (
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  sx={{
                    fontSize: '0.82rem',
                    // color: 'rgba(160,170,180,0.5)',
                    mt: 1,
                    animation: `${fadeUp} 0.42s ease both`,
                    animationDelay: '100ms',
                  }}
                >
                  {isAdmin
                    ? 'iDemand Admin'
                    : isOrgAdmin
                      ? 'Agency Admin'
                      : 'Agent'}{' '}
                  · iDemand Insurance
                </Typography>
              )}
            </Box>

            <Button
              variant='contained'
              startIcon={<FiberNewRounded />}
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                )
              }
              sx={{
                background: 'linear-gradient(135deg, #007FFF, #0059B2)',
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                borderRadius: '10px',
                px: 4,
                py: 1.5,
                fontSize: '0.95rem',
                boxShadow: '0 6px 20px rgba(0,127,255,0.26)',
                animation: `${fadeUp} 0.42s ease both`,
                animationDelay: '80ms',
                flexShrink: 0,
                '&:hover': {
                  background: 'linear-gradient(135deg, #3399FF, #007FFF)',
                },
              }}
            >
              New quote
            </Button>
          </Stack>
        </Container>
      </FullBleed>

      {/* Metrics row */}
      <Grid container spacing={2.5} sx={{ mb: { xs: 5, md: 6 } }}>
        <Grid xs={6} md={isPowerUser ? 3 : 4}>
          <MetricCard
            value='148'
            label='Active policies'
            trend={{ value: '+12%', up: true }}
            sub='vs. last month'
            delay={0}
            onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
          />
        </Grid>
        <Grid xs={6} md={isPowerUser ? 3 : 4}>
          <MetricCard
            value='23'
            label='Open quotes'
            sub='8 awaiting signature'
            delay={80}
            onClick={() => navigate(createPath({ path: ROUTES.QUOTES }))}
          />
        </Grid>
        {isPowerUser && (
          <Grid xs={6} md={3}>
            <MetricCard
              value='$1.2M'
              label='Premium written (30d)'
              trend={{ value: '+8.4%', up: true }}
              sub='vs. prior period'
              delay={160}
            />
          </Grid>
        )}
        <Grid xs={6} md={isPowerUser ? 3 : 4}>
          <MetricCard
            value='4'
            label='Renewing in 30 days'
            sub='2 require attention'
            delay={isPowerUser ? 240 : 160}
            onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
          />
        </Grid>
      </Grid>

      {/* Main content */}
      <Grid container spacing={3} sx={{ mb: { xs: 5, md: 6 } }}>
        {/* Renewals panel */}
        <Grid xs={12} md={isPowerUser ? 7 : 12}>
          <SectionHeader
            title='Upcoming renewals'
            action={{
              label: 'View all',
              onClick: () => navigate(createPath({ path: ROUTES.POLICIES })),
            }}
          />
          <Stack spacing={1.5}>
            {renewals.map((r, i) => (
              <RenewalRow key={r.address} {...r} delay={i * 55} />
            ))}
          </Stack>
        </Grid>

        {/* Right column — power users only */}
        {isPowerUser && (
          <Grid xs={12} md={5}>
            {/* Recent activity */}
            <Box
              sx={{
                p: 3,
                borderRadius: '14px',
                border: '1px solid rgba(99,179,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                mb: isAdmin ? 3 : 0,
              }}
            >
              <SectionHeader
                title='Recent activity'
                action={{
                  label: 'Submissions',
                  onClick: () =>
                    navigate(createPath({ path: ROUTES.SUBMISSIONS })),
                }}
              />
              {recentActivity.map((a, i) => (
                <ActivityItem key={a.label} {...a} delay={i * 45} />
              ))}
            </Box>

            {/* Admin shortcuts */}
            {isAdmin && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  border: '1px solid rgba(99,179,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <SectionHeader title='Admin shortcuts' />
                <Stack spacing={0.5}>
                  {[
                    {
                      label: 'Manage organizations',
                      path: createPath({ path: ADMIN_ROUTES.ORGANIZATIONS }),
                    },
                    {
                      label: 'Review agency applications',
                      path: createPath({ path: ADMIN_ROUTES.AGENCY_APPS }),
                    },
                    {
                      label: 'Configure taxes & licenses',
                      path: createPath({ path: ADMIN_ROUTES.SL_TAXES }),
                    },
                    {
                      label: 'View transactions',
                      path: createPath({ path: ADMIN_ROUTES.TRANSACTIONS }),
                    },
                    {
                      label: 'Import records',
                      path: createPath({ path: ADMIN_ROUTES.DATA_IMPORTS }),
                    },
                  ].map((item, i) => (
                    <Stack
                      key={item.label}
                      direction='row'
                      alignItems='center'
                      justifyContent='space-between'
                      onClick={() => navigate(item.path)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        animation: `${fadeUp} 0.4s ease both`,
                        animationDelay: `${i * 35}ms`,
                        transition: 'all 0.16s ease',
                        '&:hover': { background: 'rgba(0,127,255,0.07)' },
                        '&:hover .sc-arrow': {
                          opacity: 1,
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color: '#A0AAB4',
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <ArrowForwardRounded
                        className='sc-arrow'
                        sx={{
                          fontSize: '0.82rem',
                          color: '#66B2FF',
                          opacity: 0,
                          transition: 'all 0.16s ease',
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        )}
      </Grid>

      {/* Quick actions */}
      <Divider
        sx={{ mb: { xs: 5, md: 6 }, borderColor: 'rgba(99,179,255,0.08)' }}
      />
      <SectionHeader title='Quick actions' />
      <Grid container spacing={2.5}>
        <Grid xs={12} sm={6} md={3}>
          <QuickAction
            icon={<FiberNewRounded />}
            label='New Submission'
            desc='Start quoting a new flood risk property.'
            onClick={() =>
              navigate(
                createPath({
                  path: ROUTES.SUBMISSION_NEW,
                  params: { productId: 'flood' },
                }),
              )
            }
            primary
            delay={0}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <QuickAction
            icon={<RequestQuoteRounded />}
            label='My Quotes'
            desc='View, edit, and bind outstanding quotes.'
            onClick={() => navigate(createPath({ path: ROUTES.QUOTES }))}
            delay={70}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <QuickAction
            icon={<PolicyRounded />}
            label='Policies'
            desc='Access active policies and endorsements.'
            onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
            delay={140}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <QuickAction
            icon={<AutorenewRounded />}
            label='Submissions'
            desc='Track all submissions and their statuses.'
            onClick={() => navigate(createPath({ path: ROUTES.SUBMISSIONS }))}
            delay={210}
          />
        </Grid>
      </Grid>
    </>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export const Home = () => {
  const { isSignedIn, isAnonymous } = useAuth();
  if (isSignedIn && !isAnonymous) return <AuthenticatedHome />;
  return <UnauthenticatedHome productId='flood' />;
};

// import {
//   Box,
//   Container,
//   Unstable_Grid2 as Grid,
//   Typography,
// } from '@mui/material';
// import { Navigate } from 'react-router-dom';

// import { useAuth } from 'context/AuthContext';
// import { createPath, ROUTES } from 'router';

// // TODO: add UI state to authContext (admin, user, authedUser) ??

// export const Home = () => {
//   const {
//     // claims,
//     isSignedIn,
//     isAnonymous,
//   } = useAuth();

//   // if (!!claims?.iDemandAdmin)
//   //   return <Navigate to={createPath({ path: ADMIN_ROUTES.SUBMISSIONS })} replace={true} />;

//   if (isSignedIn && !isAnonymous)
//     return (
//       <Navigate to={createPath({ path: ROUTES.SUBMISSIONS })} replace={true} />
//     );

//   return (
//     <Navigate
//       to={createPath({
//         path: ROUTES.SUBMISSION_NEW,
//         params: { productId: 'flood' },
//       })}
//       replace={true}
//     />
//   );
// };

// // TODO: have home layout stretch entire screen

// export const HomeInProgress = () => {
//   return (
//     <Box>
//       <Container maxWidth='lg'>
//         <Grid container spacing={4}>
//           <Grid xs={12} sm={6}>
//             <Box>
//               {/* TODO: react-spring text animation:
//           https://themeisle.com/illustrations/?utm_source=themeisle&utm_medium=themeisle_blog&utm_campaign=free-illustrations */}
//               <Typography variant='h2' gutterBottom>
//                 High-quality coverage for your home
//               </Typography>
//               <Typography variant='subtitle1' color='text.secondary'>
//                 Lorem, ipsum dolor sit amet consectetur adipisicing elit. Dicta,
//                 illum, praesentium tenetur exercitationem voluptatem vero cum
//                 non provident iste repellendus pariatur necessitatibus,
//                 consequuntur aliquid doloribus numquam.
//               </Typography>
//             </Box>
//           </Grid>
//           <Grid xs={12} sm={6}>
//             {/* TODO: image */}
//           </Grid>
//         </Grid>
//       </Container>
//     </Box>
//   );
// };
