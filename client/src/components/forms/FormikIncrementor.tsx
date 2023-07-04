import { useCallback } from 'react';

import {
  Box,
  IconButton,
  IconButtonProps,
  Stack,
  StackProps,
  Typography,
  TypographyProps,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';
import { AddRounded, RemoveRounded } from '@mui/icons-material';

export interface FormikIncrementorProps {
  name: string;
  formikConfig?: Partial<FieldHookConfig<any>>;
  incrementBy: number;
  min: number | null | undefined;
  max?: number;
  // label?: React.ReactNode;
  stackProps?: Partial<StackProps>;
  typographyProps?: Partial<TypographyProps>;
  // labelTypographyProps?: Partial<TypographyProps>;
  errorTypographyProps?: Partial<TypographyProps>;
  iconButtonProps?: Partial<IconButtonProps>;
  disableDecrease?: any;
  disableIncrease?: any;
  disabled?: boolean;
  valueFormatter?: (value: number | undefined) => React.ReactNode;
}

export const FormikIncrementor = ({
  name,
  formikConfig,
  incrementBy,
  min = 0,
  max,
  // label,
  stackProps,
  typographyProps,
  // labelTypographyProps,
  errorTypographyProps,
  iconButtonProps,
  disabled,
  valueFormatter,
}: FormikIncrementorProps) => {
  const [field, meta, helpers] = useField<number>({ name, ...formikConfig });

  const handleIncrease = useCallback(() => {
    helpers.setTouched(true);
    if (field.value && typeof field.value === 'number') {
      let newVal = field.value + incrementBy;
      if (!!max && newVal > max) return;

      helpers.setValue(newVal);
    }
  }, [incrementBy, max, field.value, helpers]);

  const handleDecrease = useCallback(() => {
    helpers.setTouched(true);
    if (field.value && typeof field.value === 'number') {
      let newVal = field.value - incrementBy;
      if (!!min && newVal < min) return;

      helpers.setValue(newVal);
    }
  }, [incrementBy, min, field.value, helpers]);

  return (
    <Box>
      <Stack
        direction='row'
        spacing={2}
        alignItems='center'
        justifyContent='center'
        my={1}
        {...stackProps}
      >
        <IconButton
          aria-label='decrease'
          color='primary'
          onClick={handleDecrease}
          disabled={(!!min && field.value <= min) || disabled}
          {...iconButtonProps}
        >
          <RemoveRounded />
        </IconButton>
        <Box sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
          <Typography variant='h5' {...typographyProps}>
            {valueFormatter ? valueFormatter(field.value) : field.value}
          </Typography>
        </Box>
        <IconButton
          aria-label='increase'
          color='primary'
          onClick={handleIncrease}
          disabled={(!!max && field.value >= max) || disabled}
          {...iconButtonProps}
        >
          <AddRounded />
        </IconButton>
      </Stack>
      {Boolean(meta.error) && meta.touched && (
        <Typography variant='body2' color='error.main' {...errorTypographyProps}>
          {meta.error}
        </Typography>
      )}
      {!Boolean(meta.error) && min && min === field.value && (
        <Typography
          variant='body2'
          color='text.secondary'
          align='center'
          sx={{ py: 1, fontSize: '0.8rem' }}
        >{`${valueFormatter ? valueFormatter(min) : min} minimum`}</Typography>
      )}
    </Box>
  );
};
