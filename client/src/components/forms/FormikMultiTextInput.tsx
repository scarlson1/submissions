import { Box, Chip, ChipProps, Stack, StackProps, TextField, TextFieldProps } from '@mui/material';
import { FieldHookConfig, useField } from 'formik';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useKeyPress } from 'hooks/utils';
import { isValidEmail } from 'modules/utils/helpers';

export type FormikMultiTextInputProps = TextFieldProps & {
  name: string;
  formikConfig?: Partial<FieldHookConfig<any>>;
  stackProps?: StackProps;
  chipProps?: ChipProps;
};

export const FormikMultiTextInput = ({
  name,
  formikConfig,
  helperText,
  variant = 'outlined',
  stackProps,
  chipProps,
  ...props
}: FormikMultiTextInputProps) => {
  const [inputVal, setInputVal] = useState('');
  const [field, meta, { setValue, setTouched }] = useField<string[]>({
    name,
    multiple: true,
    ...formikConfig,
  });

  const handleAddEmail = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const val = inputVal.trim().toLowerCase();

      if (!val || !isValidEmail(val)) {
        return toast.error('Invalid email', { position: 'bottom-center' });
      }
      if (field.value.includes(val))
        return toast.error('Email already added', { position: 'bottom-center' });

      setValue([...field.value, val]);
      setInputVal('');
    },
    [field.value, inputVal, setValue]
  );

  useKeyPress(['Tab', 'Enter', ',', ' '], handleAddEmail);

  const handleDelete = useCallback(
    (val: string) => () => {
      setValue(field.value.filter((e) => e !== val));
    },
    [field.value, setValue]
  );

  return (
    <Box>
      <TextField
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={() => setTouched(true)}
        // onBlur={field.onBlur}
        variant={variant}
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched && meta.error ? meta.error : helperText || null}
        {...props}
      />
      <Stack
        spacing={1}
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ py: 2, ...stackProps?.sx }}
        {...stackProps}
      >
        {field.value?.map((e: string) => (
          <Chip label={e} onDelete={handleDelete(e)} key={e} {...chipProps} />
        ))}
      </Stack>
    </Box>
  );
};
