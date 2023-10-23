import { AccountBalanceRounded } from '@mui/icons-material';
import { Box, Card, CardContent, Skeleton, Typography, useTheme } from '@mui/material';
import { PaymentMethod } from 'common';
import { MdPayments } from 'react-icons/md';
import { RiMastercardFill, RiVisaLine } from 'react-icons/ri';

// TODO: finish component & move to components/elements dir
// TODO: useCardDetails in component & wrap in suspense w/ fallback skeleton ??

const getPaymentIcon = (pmtType: any, color: any) => {
  const sizeProps = { size: 28, style: { fill: color } };
  switch (pmtType) {
    case 'MasterCard':
      return <RiMastercardFill {...sizeProps} />;
    case 'Visa':
      return <RiVisaLine {...sizeProps} />;
    case 'Ach':
      return (
        // <div style={{ fontSize: sizeProps.size, ...sizeProps.style}}>
        // <AccountBalanceRounded fontSize='inherit' />
        // </div>
        <AccountBalanceRounded sx={{ fontSize: sizeProps.size, color: sizeProps.style.fill }} />
      );
    default:
      return <MdPayments {...sizeProps} />;
  }
};

export interface PaymentCardProps {
  // id: string;
  cardDetails: PaymentMethod | null;
  loading: boolean;
  error: string | null;
}

export const PaymentCard = ({ cardDetails, loading, error }: PaymentCardProps) => {
  const theme = useTheme();
  // const { cardDetails, loading, error } = useCardDetails(id);

  if (loading)
    return (
      <Box sx={{ display: 'flex', maxWidth: 400, p: 2, width: '100%' }}>
        <Skeleton variant='circular' height={50} width={50} />
        <Box sx={{ pl: 2, flex: '1 1 auto' }}>
          <Skeleton variant='rounded' width='100%' height={20} />
          <Skeleton variant='text' width={100} sx={{ fontSize: '1rem' }} />
        </Box>
      </Box>
    );

  return (
    <Card sx={{ display: 'flex', maxWidth: 400 }}>
      <Box
        sx={{
          m: 2,
          p: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.primaryDark[800]
              : theme.palette.grey[100],
          minHeight: 50,
          minWidth: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 1,
        }}
      >
        {getPaymentIcon(cardDetails?.transactionType, theme.palette.grey[500])}
      </Box>
      <CardContent sx={{ flex: '1 0 auto', p: 3 }}>
        <Typography variant='subtitle2'>
          {error
            ? 'Error loading payment method details'
            : `${cardDetails?.transactionType}  ${cardDetails?.maskedAccountNumber}`}
        </Typography>

        <Typography variant='body2' color='text.secondary' fontSize='0.775rem'>
          {cardDetails?.expiration ?? cardDetails?.accountHolder}
        </Typography>
      </CardContent>
      {/* <Box sx={{ p: 2, pl: 1 }}>
        <IconButtonMenu
          menuItems={[{ label: 'Details', action: () => console.log('button clicked') }]}
          menuProps={{
            id: 'payment-menu',
            anchorOrigin: { horizontal: 'right', vertical: 'center' },
          }}
          iconButtonProps={{
            color: 'default',
            'aria-label': 'payment method menu',
            size: 'small',
          }}
          buttonIcon={<MoreVertRounded fontSize='inherit' />}
        />
      </Box> */}
    </Card>
  );
};
