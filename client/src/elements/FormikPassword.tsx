import React, { useState } from 'react';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { FormikTextField } from 'components/forms';
import { FormikTextFieldProps } from 'components/forms/FormikTextField';

export const FormikPassword: React.FC<Partial<FormikTextFieldProps>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormikTextField
      label='Password'
      type={showPassword ? 'text' : 'password'}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              aria-label='toggle password visibility'
              onClick={() => setShowPassword((prev) => !prev)}
              onMouseDown={(e) => e.preventDefault()}
              edge='end'
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
        autoComplete: 'new-password',
      }}
      {...props}
      name='password'
    />
  );
};

export default FormikPassword;
