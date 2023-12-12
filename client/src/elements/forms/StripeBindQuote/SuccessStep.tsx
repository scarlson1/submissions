import { Box, Button, Typography } from '@mui/material';
import { Policy } from 'common';
import { useDocData } from 'hooks';
import { useNavigate } from 'react-router-dom';

// show success messaging with billing info
// show payables once loaded

export const SuccessStep = ({ policyId }: { policyId: string }) => {
  const navigate = useNavigate();
  const { data } = useDocData<Policy>('policies', policyId);

  // TODO: sticky button at bottom to continue to payables view ?? (make wizard button sticky ??)
  return (
    <Box>
      <Button onClick={() => navigate(`/admin/stripe-test/payables/${policyId}`)}>Payments</Button>
      <Typography align='center' sx={{ py: 8 }}>
        TODO: success step{' '}
      </Typography>
      TODO: payables (use collapse or react spring so they enter gradually)
    </Box>
  );
};

// const PayablesList = () => {

// }
