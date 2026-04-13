import {
  BedRounded,
  FenceRounded,
  HouseRounded,
  WeekendRounded,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { useFormikContext } from 'formik';
import { useEffect, useMemo } from 'react';

import type { Quote, WithId } from '@idemand/common';
import { fallbackImages } from 'common';
import { LineItem } from 'components';
import { addToDate, dollarFormat, formatDate } from 'modules/utils';
import { BindQuoteValues } from './BindQuoteForm';
import { LogAnalyticsProps } from './NamedInsuredStep';
import { PaymentCard } from './PaymentCard';

interface ReviewStepProps extends LogAnalyticsProps {
  data: WithId<Quote>;
}

export function ReviewStep({ data, logAnalyticsStep }: ReviewStepProps) {
  const { values } = useFormikContext<BindQuoteValues>();
  // const { cardDetails, loading, error } = useCardDetails(values.paymentMethodId);
  // const { cardDetails, loading, error } = useCardDetails(values.billingEntities[0].id);
  // const cardDetails = values.billingEntities[0];

  useEffect(() => {
    logAnalyticsStep(3, 'bind quote review step');
  }, [logAnalyticsStep]);

  // TODO: handle no card details --> throw w/ error boundary instead of return null ??

  const cardDetails = useMemo(() => {
    const billingEntity = values.billingEntities[0];
    return billingEntity ? billingEntity.paymentMethods[0] : null;
  }, [values]);

  const total = useMemo(() => {
    const { quoteTotal, cardFee } = data;
    if (!cardDetails || !quoteTotal) return null;

    // TODO: payment method type not stored in policy instead of sub-collection of user --> could add "total" in backend
    let t: number = quoteTotal;
    if (cardFee && typeof cardFee === 'number' && cardDetails.type === 'card')
      t += cardFee;

    return t;
  }, [cardDetails, data]);
  // TODO: handle quoteTotal undefined

  // TODO: ePay fees. Fetch payment method details in this component & pass to card component (need "type" to show epay fees)
  // TODO: handle error vs loading state (move calculations to backend ??)
  if (!total) return <div>Loading...</div>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 4,
        }}
      >
        <Typography variant='overline' color='text.secondary'>
          Locations
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          fontWeight='regular'
          sx={{ fontSize: '0.8rem' }}
        >
          1 location
        </Typography>
      </Box>
      <Card sx={{ display: 'flex' }}>
        <CardMedia
          component='img'
          sx={{
            width: { xs: 120, sm: 130, md: 140 },
            minHeight: { xs: 100, sm: 120, md: 140 },
          }}
          alt={`${data?.address?.addressLine1} map`}
          image={data?.imageURLs?.satellite || fallbackImages[0]}
          title={`${data?.address?.addressLine1} map`}
        />
        <Box
          sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}
        >
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography variant='h6'>{data.address.addressLine1}</Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              fontSize='0.775rem'
            >
              {`Effective: ${formatDate(values.effectiveDate, `MMM dd, yy`) || '--'} - ${
                formatDate(
                  addToDate({ years: 1 }, values.effectiveDate),
                  `MMM dd, yy`,
                ) || '--'
              }`}
            </Typography>
          </CardContent>
          <Grid
            container
            columnSpacing={{ xs: 2, md: 2 }}
            rowSpacing={1}
            wrap='wrap'
            sx={{ pl: 2, pr: 1, pb: 2 }}
          >
            <Grid xs='auto'>
              <Tooltip title='Building Coverage Limit' placement='top'>
                <Chip
                  icon={<HouseRounded />}
                  label={dollarFormat(data.limits?.limitA)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip
                title='Additional Structures Coverage Limit'
                placement='top'
              >
                <Chip
                  icon={<FenceRounded />}
                  label={dollarFormat(data.limits?.limitB)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Contents Coverage Limit' placement='top'>
                <Chip
                  icon={<WeekendRounded />}
                  label={dollarFormat(data.limits?.limitC)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                <Chip
                  icon={<BedRounded />}
                  label={dollarFormat(data.limits.limitD)}
                  size='small'
                />
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Card>
      <Divider sx={{ my: 3 }} />
      <Typography variant='overline' color='text.secondary' sx={{ ml: 4 }}>
        Billing
      </Typography>
      {/* <PaymentCard id={values.paymentMethodId} /> */}
      {/* <PaymentCard cardDetails={cardDetails} loading={loading} error={error} /> */}
      <PaymentCard cardDetails={cardDetails} />
      <Box sx={{ py: 5 }}>
        <LineItem label='Premium' value={data.annualPremium} />
        {data.fees.map((fee) => (
          <LineItem
            key={`${fee.displayName}-${fee.value}`}
            label={fee.displayName}
            value={fee.value}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {data.taxes.map((tax) => (
          <LineItem
            key={`${tax.displayName}-${tax.value}`}
            label={tax.displayName}
            value={tax.value}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {cardDetails && cardDetails.type === 'card' && (
          <LineItem
            label='Card processing fees (3.5%)'
            value={data.cardFee}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        )}
        <LineItem label='Total' value={total} withDivider={false} />
      </Box>
      {data.notes && data.notes.length > 0 && (
        <Box>
          <Divider sx={{ my: 3 }} />
          <Typography sx={{ py: 2 }}>Underwriter Notes</Typography>
          {data.notes.map(({ note }) => (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ py: 1 }}
              key={`${note}`}
            >
              {note}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
