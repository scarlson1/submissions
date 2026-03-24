import { PaidRounded } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { where } from 'firebase/firestore';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';

import { CheckmarkLottie } from 'assets';
import { Policy, Receivable } from 'common';
import { useCollectionData, useDocData } from 'hooks';
import { createPath, ROUTES } from 'router';

// show success messaging with billing info
// show receivables once loaded

// or redirect to policy view & redo policy view to highlight receivables ??

export const SuccessStep = ({ policyId }: { policyId: string }) => {
  const navigate = useNavigate();
  const { data } = useDocData<Policy>('policies', policyId);

  // TODO: sticky button at bottom to continue to receivables view ?? (make wizard button sticky ?? don't use wizard buttons - don't want back button)
  return (
    <Container
      maxWidth='sm'
      disableGutters
      sx={{ py: { xs: 3, md: 5, lg: 8 } }}
    >
      {/* TODO: receivables (use collapse or react spring so they enter gradually) */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ lineHeight: 1.4 }}
                >
                  Policy ID
                </Typography>
                {/* TODO: don't use paymentStatus ?? too complicated if multiple billing entities */}
                <Typography variant='subtitle2'>{data.id}</Typography>
              </Box>
              <Box>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ lineHeight: 1.4 }}
                >
                  Payment Status
                </Typography>
                {/* TODO: don't use paymentStatus ?? too complicated if multiple billing entities */}
                <Typography variant='subtitle2'>
                  {data.paymentStatus}
                </Typography>
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Policy Bound!
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ p: 2 }}
              gutterBottom
            >
              Congratulations! Your policy has been bound. We're excited to have
              you with us.
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ p: 2 }}
              gutterBottom
            >
              Invoice(s) have been emailed to the provided billing email
              addresses. You may also complete the payment using the links below
              (it may take a moment to create the payment).
            </Typography>
          </Box>
        </CardContent>
        <CardActions
          sx={{
            justifyContent: 'space-between',
            borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          {/* TODO: don't display until invoice created ?? */}
          <Button
            onClick={() =>
              navigate(
                createPath({ path: ROUTES.POLICY, params: { policyId } }),
              )
            }
          >
            Done
          </Button>
          <Button
            onClick={() =>
              navigate(`/admin/stripe-test/receivables/${policyId}`)
            }
          >
            Payments
          </Button>
        </CardActions>
      </Card>
      <Box sx={{ py: 5 }}>
        <ReceivablesList policyId={policyId} />
      </Box>
    </Container>
  );
};

interface ReceivablesListProps {
  policyId: string;
}

const ReceivablesList = ({ policyId }: ReceivablesListProps) => {
  const navigate = useNavigate();
  const { data } = useCollectionData<Receivable>('receivables', [
    where('policyId', '==', policyId),
  ]);

  return (
    <Collapse in={data?.length > 0}>
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Invoices
          </Typography>
          <List sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
            {data.map((r) => (
              <ListItem
                secondaryAction={
                  <Button
                    onClick={() =>
                      navigate(
                        createPath({
                          path: ROUTES.POLICY_RECEIVABLE_CHECKOUT,
                          params: { receivableId: r.id },
                        }),
                      )
                    }
                    variant='contained'
                    // disabled={p.paid} show "Paid" instead of button ??
                  >
                    Pay
                  </Button>
                }
                divider
                key={r.id}
              >
                <ListItemAvatar>
                  <Avatar>
                    <PaidRounded />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    r.billingEntityDetails?.name ||
                    r.billingEntityDetails?.email ||
                    `Policy ${r.policyId}`
                  }
                  secondary={
                    r.invoiceNumber
                      ? `Invoice #${r.invoiceNumber}`
                      : `ID ${r.id}`
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Collapse>
  );
};
