import { useCallback } from 'react';

import {
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormHelperText,
  Switch,
  SwitchProps,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';

export interface FormikSwitchProps extends SwitchProps {
  name: string;
  label: string;
  formControlLabelProps?: Partial<FormControlLabelProps>;
  formikConfig?: Partial<FieldHookConfig<any>>;
}

export const FormikSwitch = ({
  name,
  label,
  formControlLabelProps,
  formikConfig,
  ...rest
}: FormikSwitchProps) => {
  const [field, meta, { setValue }] = useField({ name, ...formikConfig, type: 'checkbox' });

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setValue(checked);
    },
    [setValue]
  );

  return (
    <FormControl error={meta.touched && Boolean(meta.error)}>
      <FormControlLabel
        control={<Switch {...field} {...rest} onChange={handleChange} />}
        label={label}
        componentsProps={{ typography: { variant: 'body2', px: 2 } }}
        {...formControlLabelProps}
      />
      {meta.touched && Boolean(meta.error) && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};
