import { Box } from '@mui/material';

import { Quote, WithId } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';

// TODO:
//    - show location summary
//    - display costs by billing entity (use accordion to open details ??)

interface ReviewStepProps {
  onSubmit: () => Promise<void>;
  quote: WithId<Quote>;
}

export const ReviewStep = ({ onSubmit, quote }: ReviewStepProps) => {
  const { handleStep } = useWizard();

  handleStep(async () => {
    console.log('calling handle step');
    await onSubmit();
  });

  return (
    <Box>
      <Box typography='body2' color='text.secondary' sx={{ maxHeight: 400, overflowY: 'auto' }}>
        <pre>{JSON.stringify(quote, null, 2)}</pre>
      </Box>
      <Box sx={{ py: 2 }}>
        <WizardNavButtons />
      </Box>
    </Box>
  );
};
