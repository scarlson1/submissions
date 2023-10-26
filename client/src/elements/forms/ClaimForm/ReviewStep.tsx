import { Box, Typography } from '@mui/material';

import { DraftPolicyClaim } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';

interface ReviewStepProps {
  claim: Partial<DraftPolicyClaim>;
  onError?: (msg: string) => void;
}

export const ReviewStep = ({ claim, onError }: ReviewStepProps) => {
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      // call cloud func to covert draft to submitted & send notifications
      alert('TODO: handle submit');
    } catch (err: any) {
      logDev('error submitting claim: ', err);
      onError && onError('error submitting quote');
    }
  });

  return (
    <Box>
      <Typography variant='body2' color='text.secondary'>
        <pre>{JSON.stringify(claim, null, 2)}</pre>
      </Typography>
      <WizardNavButtons />
    </Box>
  );
};
