import React from 'react';
import { Box, Typography } from '@mui/material';
import { FormikErrors, FormikHelpers } from 'formik';

export interface StepProps {
  validationSchema?: { [key: string]: any };
  children: JSX.Element | JSX.Element[]; // React.ReactNode;
  label?: React.ReactNode; // string;
  stepperNavLabel?: string;
  onSubmit?: (values: any, helpers: FormikHelpers<any>) => void;
  mutateOnSubmit?: (values: any, helpers: FormikHelpers<any>, initVals: any) => any;
  initialErrors?: FormikErrors<any>;
  // setLoading: (value: boolean) => void;
}
// other props to consider: withIcons, withNumbers, iconColor, etc.

export const Step: React.FC<StepProps> = ({ children, label }) => {
  return (
    <Box>
      {label && typeof label === 'string' && (
        <Typography variant='h6' gutterBottom align='center' sx={{ py: 3 }}>
          {label}
        </Typography>
      )}
      {label && typeof label !== 'string' && <>{label}</>}
      {children}
    </Box>
  );
};

export default Step;
