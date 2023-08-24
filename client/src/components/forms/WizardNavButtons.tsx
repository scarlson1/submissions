import { LoadingButton, LoadingButtonProps } from '@mui/lab';
import { Box, Button, Container } from '@mui/material';
import { useFormikContext } from 'formik';

import { useWizard } from 'hooks';
import { useEffect } from 'react';

export type WizardNavButtonProps = LoadingButtonProps;

export const WizardNavButtons = (props: WizardNavButtonProps) => {
  const { nextStep, previousStep, isLoading, isFirstStep, maxWidth } = useWizard();
  const formikCtx = useFormikContext();
  const isValid = formikCtx ? formikCtx.isValid : true;

  useEffect(() => {
    console.log('FORMIK CTX: ', formikCtx);
  }, [formikCtx]);

  return (
    <Container maxWidth={maxWidth}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        {isFirstStep ? null : <Button onClick={() => previousStep()}>Previous</Button>}
        <LoadingButton
          onClick={() => nextStep()}
          disabled={!isValid}
          {...props}
          sx={{ ml: 'auto', ...(props?.sx || {}) }}
          loading={isLoading || props?.loading}
        >
          Next
        </LoadingButton>
      </Box>
    </Container>
  );
};
