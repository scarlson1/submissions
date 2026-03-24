import { CancelRounded, CheckCircleRounded } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Badge,
  Box,
  BoxProps,
  Button,
  CardContentProps,
  CardProps,
  Divider,
  Unstable_Grid2 as Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ApartmentRentSVG,
  AtHomeSVG,
  ChillingSVG,
  CoffeeSVG,
  SecureLoginSVG,
  UnderConstructionSVG,
} from 'assets/images';
import { ANALYTICS_EVENTS, Quote, QUOTE_STATUS } from 'common';
import {
  FlexCard,
  FlexCardContent,
  IconButtonMenu,
  LineItem,
  PageMeta,
} from 'components';
import { useAnalyticsEvent, useDocData } from 'hooks';
import { dollarFormat } from 'modules/utils/helpers';
import { createPath, ROUTES } from 'router';

export const ViewQuote = () => {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  if (!quoteId) throw new Error('missing quoteId');

  const { data } = useDocData<Quote>('quotes', quoteId);
  if (!data) throw new Error('Quote not found'); // TODO: error boundary ??
  const logEvent = useAnalyticsEvent();

  const isExpired = data.quoteExpirationDate
    ? data.quoteExpirationDate?.toMillis() < new Date().getTime()
    : false;

  useEffect(() => {
    if (!data) return;
    logEvent(ANALYTICS_EVENTS.VIEW_QUOTE, {
      page_location: window.location.href,
      page_path: window.location.pathname,
      value: data.quoteTotal,
      product: data.product,
    });
  }, [data, logEvent]);

  return (
    <Box>
      <PageMeta title={`iDemand - Quote ${quoteId}`} />
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography variant='h5' gutterBottom>
            Quote
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontSize: '0.8rem', textTransform: 'uppercase', pb: 4 }}
          >{`Quote ID: ${quoteId}`}</Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button
            variant='contained'
            sx={{ maxHeight: 34 }}
            onClick={() =>
              navigate(
                createPath({ path: ROUTES.QUOTE_BIND, params: { quoteId } }),
              )
            }
            disabled={data.status !== QUOTE_STATUS.AWAITING_USER || isExpired}
          >
            Continue to bind
          </Button>
          <IconButtonMenu
            menuItems={[
              {
                label: 'Start a new quote',
                action: createPath({
                  path: ROUTES.SUBMISSION_NEW,
                  params: { productId: 'flood' },
                }),
              },
              {
                label: 'Contact us',
                action: createPath({ path: ROUTES.CONTACT }),
              },
              {
                label: 'Stripe Bind',
                action: `/admin/stripe-test/quote/bind/${quoteId}`,
              },
            ]}
            menuProps={{
              id: 'quote-action-menu',
              anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
            }}
          />
        </Stack>
      </Box>
      <Typography variant='h4' align='center' gutterBottom>
        iDemand Flood Insurance
      </Typography>
      <Typography
        variant='subtitle1'
        color='text.secondary'
        align='center'
        gutterBottom
      >{`${
        data?.address.addressLine1
      } ${data?.address.addressLine2 ? data?.address.addressLine2 + ', ' : ','} ${
        data?.address.city
      } ${data?.address.state} ${data?.address.postal}`}</Typography>

      {data && (
        <>
          <Box
            sx={{
              borderRadius: '50%',
              aspectRatio: '1 / 1',
              backgroundColor: (theme) => theme.palette.primary.main,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mx: 'auto',
              width: 'fit-content',
              my: { xs: 3, sm: 4, md: 5 },
              // mb: { xs: 3, md: 5 },
            }}
          >
            <Box sx={{ p: 3 }}>
              <Badge
                badgeContent={`.${
                  data?.quoteTotal
                    ? data.quoteTotal.toString().split('.')[1] || '00'
                    : '00'
                }`}
                color='primary'
                sx={{ '& .MuiBadge-badge': { mt: '0.75rem', right: -4 } }}
              >
                <Typography
                  variant='h5'
                  sx={{
                    px: 4,
                    color: (theme) =>
                      theme.palette.getContrastText(theme.palette.primary.main),
                  }}
                >
                  {dollarFormat(
                    data?.quoteTotal
                      ? data.quoteTotal.toString().split('.')[0]
                      : '',
                  )}
                </Typography>
              </Badge>
              <Typography
                component='div'
                variant='overline'
                textAlign='center'
                sx={{
                  color: (theme) =>
                    theme.palette.getContrastText(theme.palette.primary.main),
                  lineHeight: '1rem',
                }}
              >
                Annually
              </Typography>
            </Box>
          </Box>
          <Box sx={{ maxWidth: 340, mx: 'auto' }}>
            <LineItem
              label='Building Coverage'
              value={data.limits.limitA}
              formatVal={dollarFormat}
              withDivider={false}
            />
            <LineItem
              label='Additional Structures Coverage'
              value={data.limits.limitB}
              formatVal={dollarFormat}
              withDivider={false}
            />
            <LineItem
              label='Contents Coverage'
              value={data.limits.limitC}
              formatVal={dollarFormat}
              withDivider={false}
            />
            <LineItem
              label='Living Expenses Coverage'
              value={data.limits.limitD}
              formatVal={dollarFormat}
              withDivider={false}
            />
            <LineItem
              label='Deductible'
              value={data.deductible}
              formatVal={dollarFormat}
              withDivider={false}
            />
            {/* TODO: state could be expired & bound --> don't show button if already bound ?? */}
            {isExpired ? (
              <Button
                variant='contained'
                fullWidth
                onClick={() =>
                  navigate(
                    createPath({
                      path: ROUTES.SUBMISSION_NEW,
                      params: { productId: 'flood' },
                    }),
                  )
                }
                sx={{ my: 2 }}
              >
                Get a new quote
              </Button>
            ) : (
              <Button
                variant='contained'
                fullWidth
                onClick={() => navigate('bind')}
                sx={{ my: 2 }}
                disabled={
                  data.status !== QUOTE_STATUS.AWAITING_USER || isExpired
                }
              >
                Looks Good! Let's continue
              </Button>
            )}
            <Button
              size='small'
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.QUOTE_BIND_EPAY,
                    params: { quoteId },
                  }),
                )
              }
              disabled={data.status !== QUOTE_STATUS.AWAITING_USER || isExpired}
            >
              Epay Bind (legacy)
            </Button>

            {data.status !== QUOTE_STATUS.AWAITING_USER && !isExpired && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ py: 2 }}
              >{`status: ${data.status}`}</Typography>
            )}
            {isExpired && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ py: 2 }}
              >{`status: expired`}</Typography>
            )}
            {data.notes && data.notes.length > 0 && (
              <Box sx={{ py: 2 }}>
                {data.notes.map(({ note }, i) => (
                  <Alert
                    severity='info'
                    sx={{ borderColor: 'transparent' }}
                    key={`uw-note-${i}`}
                  >
                    {note}
                  </Alert>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}
      <Divider sx={{ my: 8 }} />
      <Typography
        variant='overline'
        component='h6'
        fontWeight='medium'
        align='center'
        sx={{ pb: 5 }}
      >
        Coverage Highlights
      </Typography>
      <Grid container spacing={6} sx={{ mb: { xs: 4, md: 8, lg: 10 } }}>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Primary building structure'
            content='Roof, siding, drywall, framing, plumbing, electrical'
            renderSvgImg={(props: any) => (
              <AtHomeSVG preserveAspectRatio='xMidYMin meet' {...props} />
            )}
            tooltipText='Building Coverage (limit A)'
            active={true}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Appliances'
            content='Refrigerator, stove'
            renderSvgImg={(props: any) => (
              <CoffeeSVG preserveAspectRatio='xMidYMin meet' {...props} />
            )}
            tooltipText='Contents Coverage (limit C)'
            active={data.limits.limitC > 0}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Furniture & furnishings'
            content='Couches, rugs, tables, beds'
            renderSvgImg={(props: any) => <ChillingSVG {...props} />}
            tooltipText='Contents Coverage (limit C)'
            active={data.limits.limitC > 0}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Your belongings'
            content='Clothes, electronics'
            renderSvgImg={(props: any) => <SecureLoginSVG {...props} />}
            tooltipText='Contents Coverage (limit C)'
            active={data.limits.limitC > 0}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Secondary structures'
            content='Fence, shed, detached garage, carport'
            renderSvgImg={(props: any) => <UnderConstructionSVG {...props} />}
            tooltipText='Additional Structures Coverage (limit B)'
            active={data.limits.limitB > 0}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <HighlightCard
            title='Temporary housing'
            content='Housing expense if necessary to stay somewhere while your home is being repaired'
            renderSvgImg={(props: any) => <ApartmentRentSVG {...props} />}
            tooltipText='Additional expenses coverage (limit D)'
            active={data.limits.limitD > 0}
          />
        </Grid>
      </Grid>

      {/* <Box sx={{ py: 15 }}>
        <ReactJson
          src={data}
          theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          style={{ background: 'transparent', fontSize: '0.8rem' }}
          iconStyle='circle'
          enableClipboard
          collapseStringsAfterLength={30}
        />
      </Box> */}
    </Box>
  );
};

export interface HighlightCardProps {
  title?: string;
  content: React.ReactNode;
  renderSvgImg: (props?: any) => any;
  active?: boolean;
  tooltipText: string;
  svgProps?: any;
  cardProps?: CardProps;
  cardContentProps?: CardContentProps;
  svgContainerProps?: BoxProps;
  children?: React.ReactNode;
}

export function HighlightCard({
  title,
  content,
  renderSvgImg,
  active = true,
  tooltipText,
  svgProps,
  cardProps,
  cardContentProps,
  svgContainerProps,
  children,
}: HighlightCardProps) {
  return (
    <Box
      sx={{
        zIndex: 10,
        opacity: !!active ? 1 : 0.5,
        borderRadius: 1,
        height: '100%',
        maxWidth: 400,
        mx: 'auto',
        background: (theme) =>
          !!active
            ? 'transparent'
            : theme.palette.mode === 'dark'
              ? alpha(theme.palette.grey[800], 0.5)
              : theme.palette.grey[200],
      }}
    >
      <FlexCard
        {...cardProps}
        sx={{
          ...cardProps?.sx,
        }}
      >
        <FlexCardContent
          {...cardContentProps}
          sx={{ display: 'flex', pb: 3, ...cardContentProps?.sx }}
        >
          <Box
            {...svgContainerProps}
            sx={{
              flex: '0 0 auto',
              textAlign: 'center',
              height: { xs: '50px', sm: '60px', md: '68px' },
              width: { xs: '50px', sm: '60px', md: '68px' },
              ...svgContainerProps?.sx,
            }}
          >
            {renderSvgImg({
              width: '100%',
              height: '100%',
              preserveAspectRatio: 'xMidYMin meet',
              ...svgProps,
            })}
          </Box>
          <Box sx={{ flex: '1 1 auto', pl: 4 }}>
            <Box sx={{ display: 'flex' }}>
              <Typography
                variant='h6'
                fontSize='1rem !important'
                component='div'
                sx={{ pb: 1, flex: '1 0 auto' }}
              >
                {title}
              </Typography>

              <Tooltip title={tooltipText} placement='top'>
                {!!active ? (
                  <CheckCircleRounded
                    color='success'
                    fontSize='small'
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <CancelRounded
                    color='error'
                    fontSize='small'
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Tooltip>
            </Box>

            <Typography
              variant='body2'
              color='text.secondary'
              fontSize='0.825rem'
              component='div'
            >
              {content}
            </Typography>
            {children}
          </Box>
        </FlexCardContent>
      </FlexCard>
    </Box>
  );
}
