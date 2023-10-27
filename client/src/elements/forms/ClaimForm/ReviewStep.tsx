import { Box, Typography } from '@mui/material';
import { useFunctions } from 'reactfire';

import { submitClaim } from 'api';
import { DraftPolicyClaim, WithId } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';

interface ReviewStepProps {
  claim: WithId<Partial<DraftPolicyClaim>>;
  onError?: (msg: string) => void;
}

export const ReviewStep = ({ claim, onError }: ReviewStepProps) => {
  const functions = useFunctions();
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      // call cloud func to covert draft to submitted & send notifications
      const policyId = claim.policyId;
      const claimId = claim.id;
      if (!(policyId && claimId)) throw new Error('missing policy or claim ID');
      await submitClaim(functions, { policyId, claimId });
    } catch (err: any) {
      logDev('error submitting claim: ', err);
      onError && onError('error submitting quote');
    }
  });

  return (
    <Box>
      <Typography variant='body2' color='text.secondary' component='div'>
        <pre>{JSON.stringify(claim, null, 2)}</pre>
      </Typography>
      <WizardNavButtons />
    </Box>
  );
};
