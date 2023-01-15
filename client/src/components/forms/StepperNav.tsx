import React from 'react';
import { Stepper, Step, StepLabel, StepButton, Box } from '@mui/material';

export interface StepperNavProps {
  activeStep: number;
  labels: any[];
  setStep: (index: number) => void;
}

export const StepperNav: React.FC<StepperNavProps> = ({ activeStep, labels, setStep }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {labels.map(({ navLabel }, index) => {
          return (
            <Step key={`nav-${navLabel}-${index}`} sx={{ '&:hover': { cursor: 'pointer' } }}>
              <StepButton onClick={() => setStep(index)}>
                <StepLabel>{navLabel}</StepLabel>
              </StepButton>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default StepperNav;
