import { LaunchRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  DrawerProps,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import type { Receivable, WithId } from '@idemand/common';
import { getChipProps } from 'modules/muiGrid/gridColumnDefs';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';
import { createPath, ROUTES } from 'router';

interface ReceivableDetailDrawerProps extends Omit<DrawerProps, 'children'> {
  receivable: WithId<Receivable> | null;
  onClose: () => void;
}

export const ReceivableDetailDrawer = ({
  receivable,
  onClose,
  ...drawerProps
}: ReceivableDetailDrawerProps) => {
  const navigate = useNavigate();

  const handlePayCheckout = () => {
    if (!receivable) return;
    navigate(
      createPath({
        path: ROUTES.POLICY_RECEIVABLE_CHECKOUT,
        params: { receivableId: receivable.id },
      }),
    );
    onClose();
  };

  const handlePayHosted = () => {
    if (!receivable?.hostedInvoiceUrl) return;
    window.open(receivable.hostedInvoiceUrl, '_blank', 'noreferrer noopener');
  };

  const isOutstanding = receivable?.status === 'outstanding';
  const canPayCheckout = isOutstanding && !!receivable?.paymentIntentId;
  const canPayHosted = isOutstanding && !!receivable?.hostedInvoiceUrl;

  return (
    <Drawer anchor='right' onClose={onClose} {...drawerProps}>
      <Box
        sx={{
          width: { xs: '100vw', sm: 420 },
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%',
        }}
        role='presentation'
      >
        {receivable ? (
          <>
            {/* Header */}
            <Stack direction='row' alignItems='center' spacing={1.5}>
              <Typography variant='h6' sx={{ flex: 1 }}>
                {receivable.invoiceNumber
                  ? `Invoice #${receivable.invoiceNumber}`
                  : 'Invoice'}
              </Typography>
              <Chip
                label={receivable.status}
                size='small'
                variant='outlined'
                {...getChipProps(receivable.status)}
              />
            </Stack>

            {/* Meta */}
            <Stack spacing={0.5}>
              {receivable.billingEntityDetails?.name && (
                <Typography variant='body2' color='text.secondary'>
                  Billed to: {receivable.billingEntityDetails.name}
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                Due:{' '}
                {formatFirestoreTimestamp(receivable.dueDate, 'date')}
              </Typography>
            </Stack>

            <Divider />

            {/* Line items */}
            <Stack spacing={1}>
              <Typography variant='overline' color='text.secondary'>
                Breakdown
              </Typography>
              {receivable.lineItems.map((item, i) => (
                <Stack
                  key={i}
                  direction='row'
                  justifyContent='space-between'
                  spacing={2}
                >
                  <Typography variant='body2'>{item.displayName}</Typography>
                  <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                    {dollarFormat(item.amount / 100)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Divider />

            {/* Totals */}
            <Stack spacing={0.75}>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body1' fontWeight={600}>
                  Total
                </Typography>
                <Typography variant='body1' fontWeight={600}>
                  {dollarFormat(receivable.totalAmount / 100)}
                </Typography>
              </Stack>
              {receivable.totalAmountPaid > 0 && (
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2' color='text.secondary'>
                    Amount paid
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {dollarFormat(receivable.totalAmountPaid / 100)}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Actions */}
            {(canPayCheckout || canPayHosted || receivable.invoicePdfUrl) && (
              <>
                <Divider />
                <Stack spacing={1}>
                  {canPayCheckout && (
                    <Button variant='contained' onClick={handlePayCheckout} fullWidth>
                      Pay now
                    </Button>
                  )}
                  {!canPayCheckout && canPayHosted && (
                    <Button
                      variant='contained'
                      onClick={handlePayHosted}
                      endIcon={<LaunchRounded />}
                      fullWidth
                    >
                      Pay now
                    </Button>
                  )}
                  {receivable.invoicePdfUrl && (
                    <Button
                      variant='outlined'
                      href={receivable.invoicePdfUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      fullWidth
                    >
                      Download invoice
                    </Button>
                  )}
                  {receivable.hostedReceiptUrl && (
                    <Button
                      variant='text'
                      href={receivable.hostedReceiptUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      endIcon={<LaunchRounded />}
                      fullWidth
                    >
                      View receipt
                    </Button>
                  )}
                </Stack>
              </>
            )}
          </>
        ) : null}
      </Box>
    </Drawer>
  );
};
