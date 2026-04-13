import {
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  DrawerProps,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { forwardRef, ReactNode, useMemo, useState } from 'react';

import type { Policy, WithId } from '@idemand/common';
import { CloseRounded } from '@mui/icons-material';
import { DownloadFilesSVG } from 'assets/images';
import { Receivable } from 'common';
import { LineItem } from 'components';
import { FormattedAddress } from 'elements';
import { Item } from 'elements/cards';
import StripeReceivableCheckout from 'elements/forms/StripeReceivableCheckout';
import { useDocData, useDownloadStream, useSafeParams } from 'hooks';
import {
  compressedToAddress,
  dollarFormat,
  dollarFormat2,
  formatFirestoreTimestamp,
  formatPhoneNumber,
} from 'modules/utils';

// mobile swipeable drawer: https://mui.com/material-ui/react-drawer/#swipeable-edge

// TODO: get amounts from the actual invoice (in case receivable gets calculated wrong) ??

// TODO: on success --> redirect back to receivables for policy

export const ReceivableCheckout = () => {
  // const { isSmall } = useWidth();
  const { receivableId } = useSafeParams(['receivableId']);
  const { data } = useDocData<Receivable>('receivables', receivableId);
  if (!data) throw new Error(`Receivable not found ${receivableId}`);

  // TODO: return or redirect to receivable status / details if invoice is already paid

  // TODO: only use drawer on small screens ??
  // const [open, setOpen] = useState(true); // TODO: false on mobile

  // const toggleDrawer = useCallback(() => {
  //   setOpen((o) => !o);
  // }, []);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flex: '1 1 auto', p: { xs: 3, sm: 5, md: 8 } }}>
        <Container disableGutters maxWidth='sm'>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
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
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <MobileDrawer buttonTitle='View Details' anchor='right'>
              <ReceivableDetails data={data} />
            </MobileDrawer>
          </Box>
          <Divider sx={{ mt: { xs: 2, md: 6 }, mb: { xs: 3, sm: 5, md: 6 } }} />
          {/* TODO: handle async invoice events - either don't display unless paymentIntentId, or show loading indicator ?? */}
          {/* TODO: error boundary to create new invoice depending on error ?? */}
          {data.paid ? (
            <Stack direction='column' spacing={2} sx={{ mx: 'auto' }}>
              <Typography>Invoice has already been paid</Typography>
              {/* <Button></Button> */}
            </Stack>
          ) : (
            <StripeReceivableCheckout data={data} />
          )}
        </Container>
      </Box>
      <Box sx={{ flex: '1 1 auto', display: { xs: 'none', md: 'block' } }}>
        <Paper
          sx={{
            // flex: '1 1 auto',
            height: '100%',
            p: { xs: 3, sm: 5, md: 8 },
            background: (theme) => theme.palette.background.paper,
          }}
        >
          <ReceivableDetails data={data} />
        </Paper>
      </Box>

      {/* <Drawer anchor='right' open={open} onClose={toggleDrawer} variant='persistent'>
        <ReceivableDetails data={data} />
      </Drawer> */}
    </Box>
  );
};

function MobileDrawer({
  anchor = 'right',
  buttonTitle,
  children,
}: {
  anchor: DrawerProps['anchor'];
  buttonTitle: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='small' sx={{ maxHeight: 30 }}>
        {buttonTitle}
      </Button>
      <Drawer anchor={anchor} open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width:
              anchor === 'top' || anchor === 'bottom'
                ? 'auto'
                : { xs: `calc(100vw - 40px)`, sm: 480 },
            p: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setOpen(false)} size='small'>
              <CloseRounded fontSize='inherit' />
            </IconButton>
          </Box>
          {children}
        </Box>
      </Drawer>
    </>
  );
}

const currentMS = new Date().getTime();

function ReceivableDetails({ data }: { data: WithId<Receivable> }) {
  const { data: policy } = useDocData<Policy>('policies', data.policyId);

  const locationCount = useMemo(
    () =>
      Object.values(policy.locations || {}).filter(
        (lcn) => !lcn.cancelEffDate || lcn.cancelEffDate.toMillis() > currentMS,
      ).length,
    [policy],
  );

  const billingEntityLcnCount = useMemo(
    () => Object.keys(data.locations).length,
    [data],
  );

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
            'date',
          )} - ${formatFirestoreTimestamp(policy.effectiveDate, 'date')}`}
        />
        <Item
          label='Total # locations'
          value={locationCount ? `${locationCount}` : '--'}
        />
        {/* <Item label="Term premium" value={data.} /> */}
      </Box>
      <Divider sx={{ my: { xs: 3, sm: 4, md: 5 } }} />
      <Box sx={{ pb: 4 }}>
        <Typography variant='overline' color='text.tertiary' sx={{ py: 5 }}>
          Billing Entity
        </Typography>
        <Item
          label='Name'
          value={data.billingEntityDetails?.name || 'Not saved'}
        />
        <Item
          label='Email'
          value={data.billingEntityDetails?.email || 'Not saved'}
        />
        <Item
          label='Phone'
          value={
            formatPhoneNumber(data.billingEntityDetails?.phone || '') ||
            'Not saved'
          }
        />
        {/* <Item label="Term premium" value={data.} /> */}
      </Box>
      {/* TODO: get line items from actual invoice instead of receivable ?? */}
      <Box sx={{ pb: 4 }}>
        {data.lineItems.map((l, i) => (
          <LineItem
            label={l.displayName}
            value={l.amount / 100}
            key={`${l.displayName}-${i}`}
          />
        ))}
        <LineItem label='Total Due' value={data.totalAmount / 100} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='overline' color='text.tertiary'>
          Locations
        </Typography>
        {/* TODO: billing entity locations different from policy */}
        <Typography
          variant='body2'
          color='text.tertiary'
          fontSize='0.825rem'
        >{`${billingEntityLcnCount || '--'} location(s)`}</Typography>
      </Box>
      {/* TODO: location cards virtual scroll ?? or infinite scroll ?? */}
      {/* could use live static map (no view changes) use cords instead of fetching doc */}
      {/* or single map with all location pins ?? */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(data.locations || {}).map(([lcnId, lcn]) => (
          <Box
            sx={{ py: 2, display: 'flex', justifyContent: 'space-between' }}
            key={lcnId}
          >
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
  ref,
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
      />
    </Box>
  );
});
