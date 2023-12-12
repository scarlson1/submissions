import { Box, Container, Divider, Paper, Tooltip, Typography } from '@mui/material';
import { DownloadFilesSVG } from 'assets/images';
import { Payable, Policy, WithId } from 'common';
import { LineItem } from 'components';
import { FormattedAddress } from 'elements';
import { Item } from 'elements/cards';
import StripePayableCheckout from 'elements/forms/StripePayableCheckout';
import { useDocData, useDownloadStream, useSafeParams } from 'hooks';
import {
  compressedToAddress,
  dollarFormat,
  dollarFormat2,
  formatFirestoreTimestamp,
  formatPhoneNumber,
} from 'modules/utils';
import { forwardRef, useMemo } from 'react';

// mobile swipeable drawer: https://mui.com/material-ui/react-drawer/#swipeable-edge

// TODO: get amounts from the actual invoice (incase payable gets calculated wrong) ??

export const PayableCheckout = () => {
  const { payableId } = useSafeParams(['payableId']);
  const { data } = useDocData<Payable>('payables', payableId);
  if (!data) throw new Error(`Payable not found ${payableId}`);
  // TODO: only use drawer on small screens ??
  // const [open, setOpen] = useState(true); // TODO: false on mobile

  // const toggleDrawer = useCallback(() => {
  //   setOpen((o) => !o);
  // }, []);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flex: '1 1 auto', p: { xs: 3, sm: 5, md: 8 } }}>
        <Container disableGutters maxWidth='sm'>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography
                variant='body2'
                color='text.tertiary'
                fontSize='0.75rem'
              >{`Invoice ${data.invoiceId}`}</Typography>
              <Typography variant='h4'>{`${dollarFormat2(data.totalAmount / 100)}`}</Typography>
              <Typography
                variant='subtitle2'
                color='text.secondary'
              >{`Due ${formatFirestoreTimestamp(data.dueDate, 'date')}`}</Typography>
            </Box>
            {data.invoiceId ? (
              <Box
                sx={{
                  py: 5,
                  // TODO: use parent's dimensions
                  height: { xs: 80, sm: 100, md: 120 },
                  flex: '0 0 auto',
                  pl: 3,
                }}
              >
                <Tooltip title='download invoice' placement='bottom'>
                  <DownloadPDF
                    filename={`iDemand Invoice ${data.invoiceId}.pdf`}
                    // invoiceId={data.invoiceId}
                    endpoint={`/stripe/invoice/${data.invoiceId}/download`}
                  />
                </Tooltip>
              </Box>
            ) : null}
          </Box>
          <Divider sx={{ my: { xs: 3, sm: 5, md: 6 } }} />
          <StripePayableCheckout data={data} />
        </Container>
      </Box>

      <Paper
        sx={{
          flex: '1 1 auto',
          p: { xs: 3, sm: 5, md: 8 },
          background: (theme) => theme.palette.background.paper,
        }}
      >
        <PayableDetails data={data} />
      </Paper>
      {/* <Drawer anchor='right' open={open} onClose={toggleDrawer} variant='persistent'>
        <PayableDetails data={data} />
      </Drawer> */}
    </Box>
  );
};

const currentMS = new Date().getTime();

function PayableDetails({ data }: { data: WithId<Payable> }) {
  const { data: policy } = useDocData<Policy>('policies', data.policyId);

  const locationCount = useMemo(
    () =>
      Object.values(policy.locations || {}).filter(
        (lcn) => !lcn.cancelEffDate || lcn.cancelEffDate.toMillis() > currentMS
      ).length,
    [policy]
  );

  const billingEntityLcnCount = useMemo(() => Object.keys(data.locations).length, [data]);

  return (
    <Box>
      <Box>
        <Typography variant='overline' color='text.tertiary' sx={{ py: 5 }}>
          Policy
        </Typography>
        <Item label='Policy ID' value={data.policyId} />
        <Item label='Named Insured' value={policy.namedInsured?.displayName} />
        <Item
          label='Effective'
          value={`${formatFirestoreTimestamp(
            policy.effectiveDate,
            'date'
          )} - ${formatFirestoreTimestamp(policy.effectiveDate, 'date')}`}
        />
        <Item label='Total # locations' value={locationCount ? `${locationCount}` : '--'} />
        {/* <Item label="Term premium" value={data.} /> */}
      </Box>
      <Divider sx={{ my: { xs: 3, sm: 4, md: 5 } }} />
      <Box sx={{ pb: 4 }}>
        <Typography variant='overline' color='text.tertiary' sx={{ py: 5 }}>
          Billing Entity
        </Typography>
        <Item label='Name' value={data.billingEntityDetails?.name || 'Not saved'} />
        <Item label='Email' value={data.billingEntityDetails?.email || 'Not saved'} />
        <Item
          label='Phone'
          value={formatPhoneNumber(data.billingEntityDetails?.phone || '') || 'Not saved'}
        />
        {/* <Item label="Term premium" value={data.} /> */}
      </Box>
      {/* TODO: get line items from actual invoice instead of payable ?? */}
      <Box sx={{ pb: 4 }}>
        {data.lineItems.map((l, i) => (
          <LineItem label={l.displayName} value={l.amount / 100} key={`${l.displayName}-${i}`} />
        ))}
        <LineItem label='Total Due' value={data.totalAmount / 100} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='overline' color='text.tertiary'>
          Locations
        </Typography>
        {/* TODO: billing entity locations different from policy */}
        <Typography variant='body2' color='text.tertiary' fontSize='0.825rem'>{`${
          billingEntityLcnCount || '--'
        } location(s)`}</Typography>
      </Box>
      {/* TODO: location cards virtual scroll ?? or infinite scroll ?? */}
      {/* could use live static map (no view changes) use cords instead of fetching doc */}
      {/* or single map with all location pins ?? */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(data.locations || {}).map(([lcnId, lcn]) => (
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between' }} key={lcnId}>
            <FormattedAddress
              address={compressedToAddress(lcn.address)}
              line2OverrideProps={{ color: 'text.secondary', variant: 'body2' }}
            />
            <Typography variant='body2' color='text.secondary' align='right'>
              {dollarFormat(lcn.termPremium)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const DownloadPDF = forwardRef(function DownloadPDF(
  { filename, endpoint, ...props }: { filename: string; endpoint: string },
  ref
) {
  const { downloadFile } = useDownloadStream('get');

  return (
    <Box
      {...props}
      ref={ref}
      onClick={() => downloadFile(filename, endpoint)}
      sx={{
        height: '100%',
        width: '100%',
        '& .paper': { fill: (theme) => theme.vars.palette.background.paper },
        '& .backgroundGrey': { fill: (theme) => theme.vars.palette.divider },
        '& .foregroundGrey': {
          fill: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.vars.palette.grey[700]
              : theme.vars.palette.grey[300],
        },
        '& .primary': { fill: (theme) => theme.vars.palette.primary.main },
        '& .foregroundGrey2': {
          fill: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.vars.palette.grey[700]
              : theme.vars.palette.grey[300],
        },
        '& .downloadArrow': {
          fill: (theme) => theme.palette.grey[100], // theme.vars.palette.text.primary,
        },
        '& svg:hover': {
          cursor: 'pointer',
        },
      }}
    >
      <DownloadFilesSVG
        height='100%'
        width='100%'
        preserveAspectRatio='xMidYMin meet'
        fill='red'
        // style={{ fill: 'red' }}
      />
    </Box>
  );
});
