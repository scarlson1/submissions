import {
  Checkbox,
  CheckboxProps,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Theme,
  TypographyProps,
} from '@mui/material';
import { SxProps } from '@mui/system';
import { FieldHookConfig, useField } from 'formik';

export interface FormikCheckboxProps {
  name: string;
  label: React.ReactNode;
  checkboxProps?: CheckboxProps;
  sx?: SxProps<Theme>;
  componentsProps?: {
    typography?: TypographyProps;
  };
  disabled?: boolean;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
  onChange?: (event: React.SyntheticEvent, checked: boolean) => void;
  value?: unknown;
  checked?: boolean;
  formikConfig?: Partial<FieldHookConfig<boolean>>;
}

export const FormikCheckbox = ({
  name,
  checkboxProps,
  formikConfig,
  ...props
}: FormikCheckboxProps) => {
  const [field, meta] = useField({ name, ...formikConfig, type: 'checkbox' });

  return (
    <FormControl error={meta.touched && Boolean(meta.error)}>
      <FormControlLabel
        {...props}
        checked={field.checked}
        control={<Checkbox {...field} {...checkboxProps} />}
      />
      {meta.touched && Boolean(meta.error) && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};

export default FormikCheckbox;
