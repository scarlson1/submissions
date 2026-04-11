import type { WithId } from '@idemand/common';
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
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';

import { fallbackImages, Quote } from 'common';
import { LineItem } from 'components';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import {
  addToDate,
  dollarFormat,
  formatDate,
  formatFirestoreTimestamp,
} from 'modules/utils';

// TODO:
//    - show location summary
//    - display costs by billing entity (use accordion to open details ??)
//    - view billing details --> open side panel with billing by entity

interface ReviewStepProps {
  onSubmit: () => Promise<void>;
  quote: WithId<Quote>;
}

// TODO: before review step -- calculate totals by billing entity ??

export const ReviewStep = ({ onSubmit, quote }: ReviewStepProps) => {
  const { handleStep } = useWizard();
  if (!quote.quoteTotal) throw new Error('issue calculating quote total');

  handleStep(async () => {
    try {
      console.log('calling handle step');
      await onSubmit(); // onSubmit should not catch error ?? need to pass to wizard to throw to prevent next step
    } catch (err: any) {
      console.log('err: ', err);
    }
  });

  return (
    <Container maxWidth='sm' disableGutters>
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
          alt={`${quote?.address?.addressLine1} map`}
          image={quote?.imageURLs?.satellite || fallbackImages[0]}
          title={`${quote?.address?.addressLine1} map`}
        />
        <Box
          sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}
        >
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography variant='h6'>{quote.address.addressLine1}</Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              fontSize='0.775rem'
            >
              {`Effective: ${formatFirestoreTimestamp(quote.effectiveDate, 'date') || '--'} - ${
                formatDate(
                  addToDate({ years: 1 }, quote.effectiveDate?.toDate()),
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
                  label={dollarFormat(quote.limits?.limitA)}
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
                  label={dollarFormat(quote.limits?.limitB)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Contents Coverage Limit' placement='top'>
                <Chip
                  icon={<WeekendRounded />}
                  label={dollarFormat(quote.limits?.limitC)}
                  size='small'
                />
              </Tooltip>
            </Grid>

            <Grid xs='auto'>
              <Tooltip title='Living Expenses Coverage Limit' placement='top'>
                <Chip
                  icon={<BedRounded />}
                  label={dollarFormat(quote.limits.limitD)}
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
      {/* TODO: collapse line items for each billing entity */}
      <Box sx={{ py: 5 }}>
        <LineItem label='Premium' value={quote.annualPremium} />
        {quote.fees.map((fee) => (
          <LineItem
            key={`${fee.displayName}-${fee.value}`}
            label={fee.displayName}
            value={fee.value}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {quote.taxes.map((tax) => (
          <LineItem
            key={`${tax.displayName}-${tax.value}`}
            label={tax.displayName}
            value={tax.value}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        ))}
        {/* {cardDetails && cardDetails.type === 'card' && (
          <LineItem
            label='Card processing fees (3.5%)'
            value={data.cardFee}
            labelTypographyProps={{ sx: { ml: 4 }, fontSize: '0.8rem' }}
            valueTypographyProps={{ fontWeight: 'regular', fontSize: '0.8rem' }}
          />
        )} */}
        {/* <LineItem label='Total' value={total} withDivider={false} /> */}
        <LineItem label='Total' value={quote.quoteTotal} withDivider={false} />
      </Box>
      {quote.notes && quote.notes.length > 0 && (
        <Box>
          <Divider sx={{ my: 3 }} />
          <Typography sx={{ py: 2 }}>Underwriter Notes</Typography>
          {quote.notes.map(({ note }) => (
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
      {/* TODO: collapse - view by billing entity */}
      {/* TODO: next steps */}
      {/* <Box typography='body2' color='text.secondary' sx={{ maxHeight: 400, overflowY: 'auto' }}>
        <pre>{JSON.stringify(quote, null, 2)}</pre>
      </Box> */}
      <Box sx={{ py: 2 }}>
        <WizardNavButtons buttonText='bind policy' variant='contained' />
      </Box>
    </Container>
  );
};
