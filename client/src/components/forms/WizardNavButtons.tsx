import { LoadingButton } from '@mui/lab';
import { Box, Button, Container } from '@mui/material';

import { useWizard } from 'hooks';

export const WizardNavButtons = () => {
  const { nextStep, previousStep, isLoading, isFirstStep, maxWidth } = useWizard();
  // const formikCtx = useFormikContext();
  // const isValid = formikCtx ? formikCtx.isValid : true;

  return (
    <Container maxWidth={maxWidth}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        {isFirstStep ? <Box /> : <Button onClick={() => previousStep()}>Previous</Button>}
        <LoadingButton
          onClick={() => nextStep()}
          loading={isLoading}
          // disabled={!isValid}
        >
          Next
        </LoadingButton>
      </Box>
    </Container>
  );
};
