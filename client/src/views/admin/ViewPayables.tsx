import { DataObjectRounded, LaunchRounded } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Unstable_Grid2 as Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { Payable, WithId } from 'common';
import { useCollectionData, useSafeParams, useShowJson } from 'hooks';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';
import { ROUTES, createPath } from 'router';

// temp component for testing payables data structure / joining payables data with location data
// get client secret for payment intent

// payment approaches:
//  - use url stripe hosted payment from invoice finalized event
//  - get payment intent from invoice finalized event & host our own checkout
//    - fetch client secret by sending payable ID ?? backend could create payment intent if necessary ?? or throw ??
//  - need handling for missing paymentIntent/payment URL (check payable created date, if later than x, report error ??)

// views to support:
//  - show all payables for agent/user/org
//  - show payables for specific policy
//  - view invoice details ?? use same route as make payment ?? show different views depending on invoice state (link stripe hosted url) ??
//  options:
//    - break into: payables card, then pass in data
// collapse card - expand to see location details (collapsed) (term premium), taxes, fees, total

export const ViewPayables = () => {
  const { policyId } = useSafeParams(['policyId']);
  const { data: payables } = useCollectionData<Payable>('payables', [
    where('policyId', '==', policyId),
  ]);

  return (
    <Box>
      <Typography
        align='center'
        variant='h5'
        gutterBottom
      >{`Payables for policy ${policyId}`}</Typography>
      <Grid container spacing={6}>
        {payables.map((p) => (
          <Grid key={p.id} xs={12} sm={6} lg={4} xl={3}>
            <PayableCard data={p} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// TODO: generate mapbox maps for invoice ?? or copy from policy ??
interface PayableCardProps {
  data: WithId<Payable>;
}

const PayableCard = ({ data }: PayableCardProps) => {
  const navigate = useNavigate();
  const showJson = useShowJson('payables'); // PRE_DEPLOY: delete (for dev testing)

  return (
    <Card sx={{ maxWidth: 400 }}>
      <CardActionArea onClick={() => alert('TODO: nav to payable view')}>
        <CardHeader
          avatar={
            <Avatar aria-label='billing entity'>{data.billingEntityDetails?.name || null}</Avatar>
          }
          // action={
          //   <IconButton aria-label='settings'>
          //     <MoreVertIcon />
          //   </IconButton>
          // }
          title={
            data.billingEntityDetails?.name ||
            data.billingEntityDetails?.email ||
            `Policy ${data.policyId}`
          }
          subheader={`Invoice #${data.invoiceNumber || ''}`}
          subheaderTypographyProps={{
            sx: {
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            },
          }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h6'>{dollarFormat(data.totalAmount / 100)}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {`Due ${formatFirestoreTimestamp(data.dueDate, 'date')}`}
              </Typography>
              {/* TODO: memo ?? */}
            </Box>
            <Typography variant='body2' color='text.tertiary' align='right'>{`${
              Object.keys(data.locations || {}).length
            } location(s)`}</Typography>
          </Box>
          {/* {data.paymentIntentId ? <StripePayableCheckout payableId={data.id} /> : null} */}
        </CardContent>
      </CardActionArea>
      <CardActions
        sx={{
          borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          justifyContent: 'space-between',
        }}
      >
        {/* TODO: expand more button (show line items) */}
        {/* TODO: download invoice icon button */}
        <IconButton size='small' onClick={() => showJson(data.id)}>
          <DataObjectRounded fontSize='inherit' />
        </IconButton>
        {data.paymentIntentId ? (
          <Button
            onClick={() =>
              navigate(
                createPath({ path: ROUTES.PAYABLE_CHECKOUT, params: { payableId: data.id } })
              )
            }
          >
            Pay now (checkout)
          </Button>
        ) : null}
        {data.hostedInvoiceUrl ? (
          <Button
            onClick={() => window.open(data.hostedInvoiceUrl!, '_blank', 'noreferrer noopener')}
            endIcon={<LaunchRounded />}
            // variant='contained'
          >
            Pay now
          </Button>
        ) : null}
      </CardActions>
    </Card>
  );
};
