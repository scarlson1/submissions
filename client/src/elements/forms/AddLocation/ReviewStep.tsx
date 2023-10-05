import { Typography } from '@mui/material';

import { DraftAddLocationRequest } from 'common';
import { WizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';

// TODO: share w/ location change form ??

interface ReviewStepProps {
  data: DraftAddLocationRequest;
  onSubmit: () => Promise<void>;
  onError?: (msg: string) => void;
}

export function ReviewStep({ data, onSubmit, onError }: ReviewStepProps) {
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      await onSubmit();
    } catch (err: any) {
      console.log('Error: ', err);
      onError && onError('error submitting change request');
    }
  });

  return (
    <>
      <Typography variant='h5' color='warning.main' gutterBottom>
        TODO: review step
      </Typography>
      <Typography component='div' variant='body2' color='text.secondary' sx={{ p: 5 }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography>
      <WizardNavButtons buttonText='submit' />
    </>
  );
}
