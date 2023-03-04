import React from 'react';
import { Breakpoint, Container, ContainerProps, Typography } from '@mui/material';
import { FormikErrors, FormikHelpers } from 'formik';

export interface StepProps {
  validationSchema?: { [key: string]: any };
  children: JSX.Element | JSX.Element[]; // React.ReactNode;
  label?: React.ReactNode; // string;
  stepperNavLabel?: string;
  onSubmit?: (values: any, helpers: FormikHelpers<any>) => void;
  mutateOnSubmit?: (values: any, helpers: FormikHelpers<any>, initVals: any) => any;
  initialErrors?: FormikErrors<any>;
  maxWidth?: Breakpoint | false;
  containerProps?: ContainerProps;
  // setLoading: (value: boolean) => void;
}
// other props to consider: withIcons, withNumbers, iconColor, etc.

export const Step: React.FC<StepProps> = ({ children, label, maxWidth = 'sm', containerProps }) => {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={true}
      sx={{ px: '0 !important' }}
      {...containerProps}
    >
      {label && typeof label === 'string' && (
        <Typography variant='h6' gutterBottom align='center' sx={{ py: 3 }}>
          {label}
        </Typography>
      )}
      {label && typeof label !== 'string' && <>{label}</>}
      {children}
    </Container>
  );
};

export default Step;
