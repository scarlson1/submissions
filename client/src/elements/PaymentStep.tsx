import React, { useCallback } from 'react';
import {
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemButtonProps,
  ListItemIcon,
  ListItemProps,
  ListItemText,
  ListItemTextProps,
  Typography,
} from '@mui/material';
import { useFormikContext } from 'formik';
import { AccountBalanceRounded, AddCardRounded, CreditCardRounded } from '@mui/icons-material';
import * as yup from 'yup';

import AddPaymentDialog from './AddPaymentDialog';
import { PaymentMethod } from 'common';

export const billingValidation = yup.object().shape({
  paymentMethodId: yup.string().required('Payment method required'),
});

export type RadioListVal = string | number | { [key: string]: any };

export interface RadioListItemProps {
  listItemProps?: ListItemProps;
  listItemButtonProps?: ListItemButtonProps;
  listItemTextProps?: ListItemTextProps;
  value: RadioListVal;
  onClick: (newValue: RadioListVal) => void | ((newValue: RadioListVal) => Promise<void>);
  selected?: boolean;
}

export const RadioListItem: React.FC<RadioListItemProps> = ({
  listItemProps,
  listItemButtonProps,
  listItemTextProps,
  value,
  onClick,
  selected = false,
}) => {
  const labelId = `Option - ${value}`;

  return (
    <ListItem key={`key-${labelId}`} disablePadding sx={{ py: 2 }} {...listItemProps}>
      <ListItemButton
        role={undefined}
        onClick={() => onClick(value)}
        dense
        selected={selected}
        sx={{ borderRadius: 1, border: `1px solid transparent` }}
        {...listItemButtonProps}
      >
        <ListItemIcon>
          <Checkbox
            edge='start'
            checked={selected}
            tabIndex={-1}
            disableRipple
            inputProps={{ 'aria-labelledby': labelId }}
          />
        </ListItemIcon>
        <ListItemText
          id={labelId}
          primary={`Line item ${value}`}
          secondary={`Account ${value}`}
          primaryTypographyProps={{
            fontSize: 13,
            fontWeight: 'fontWeightMedium',
            color: 'text.primary',
          }}
          secondaryTypographyProps={{
            fontSize: 13,
            fontWeight: 'fontWeightRegular',
            color: 'text.secondary',
          }}
          {...listItemTextProps}
        />
      </ListItemButton>
    </ListItem>
  );
};

export interface PaymentStepProps {
  pmtOptions: PaymentMethod[];
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ pmtOptions }) => {
  const { values, setFieldValue } = useFormikContext<any>();

  const handleToggle = useCallback(
    (value: RadioListVal) => {
      const newValue = values.paymentMethodId === value ? '' : value;
      setFieldValue('paymentMethodId', newValue);
    },
    [setFieldValue, values]
  );

  const handleMethodAdded = useCallback(
    (data: PaymentMethod) => {
      setFieldValue('paymentMethodId', data.id);
    },
    [setFieldValue]
  );

  return (
    <Box>
      <Typography align='center' gutterBottom>
        Select a saved payment method or add a new one.
      </Typography>

      <Box
        sx={{
          maxWidth: 360,
          maxHeight: 340,
          overflowY: 'auto',
          mx: 'auto',
          my: 4,
          borderRadius: 1,
        }}
      >
        {pmtOptions.length > 0 ? (
          <List>
            {pmtOptions.map((o, i, a) => (
              <RadioListItem
                key={`option-key-${i}`}
                value={o.id}
                onClick={handleToggle}
                selected={values.paymentMethodId?.indexOf(o.id) !== -1}
                listItemProps={{
                  // divider: a.length !== i + 1,
                  divider: true,
                  secondaryAction:
                    o.type === 'card' ? <CreditCardRounded /> : <AccountBalanceRounded />,
                }}
                listItemButtonProps={{}}
                listItemTextProps={{
                  primary: `${o.transactionType}  |  ${o.accountHolder}`,
                  secondary: `${o.maskedAccountNumber?.replaceAll('X', '*')}`,
                }}
              />
            ))}
          </List>
        ) : (
          <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ my: 5 }}>
            No saved payment methods found
          </Typography>
        )}
      </Box>
      <AddPaymentDialog
        openButtonText='Add Payment Method'
        buttonProps={{ variant: 'text', startIcon: <AddCardRounded />, sx: { mx: 'auto' } }}
        cb={handleMethodAdded}
        containerProps={{ sx: { my: 2, display: 'flex', justifyContent: 'center' } }}
      />
    </Box>
  );
};
