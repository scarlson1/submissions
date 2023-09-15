import { LoadingButton, LoadingButtonProps } from '@mui/lab';
import { Box, Button, Container } from '@mui/material';
import { useFormikContext } from 'formik';

import { useWizard } from 'hooks';

export type WizardNavButtonProps = LoadingButtonProps & {
  buttonText?: string;
  prevButtonText?: string;
};

export const WizardNavButtons = ({
  buttonText,
  prevButtonText = 'previous',
  ...props
}: WizardNavButtonProps) => {
  const { nextStep, previousStep, isLoading, isFirstStep, isLastStep, maxWidth } = useWizard();
  const defaultBtnTxt = isLastStep ? 'submit' : 'next';

  return (
    <Container maxWidth={maxWidth}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        {isFirstStep ? null : <Button onClick={() => previousStep()}>{prevButtonText}</Button>}
        <LoadingButton
          onClick={() => nextStep()}
          {...props}
          sx={{ ml: 'auto', ...(props?.sx || {}) }}
          loading={isLoading || props?.loading}
        >
          {buttonText || defaultBtnTxt}
        </LoadingButton>
      </Box>
    </Container>
  );
};

type FormikWizardNavButtonsProps = WizardNavButtonProps;

export const FormikWizardNavButtons = (props: FormikWizardNavButtonsProps) => {
  const { isValid, isSubmitting, isValidating } = useFormikContext();

  return <WizardNavButtons disabled={!isValid} loading={isSubmitting || isValidating} {...props} />;
};
