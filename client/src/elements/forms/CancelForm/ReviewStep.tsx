import { Typography } from '@mui/material';
import { useAsyncToast, useWizard } from 'hooks';

// TODO: reuse ReviewStepComponent ??
// need to add custom props to grey out or add "cancel" banner over location card ??

export interface ReviewStepProps {
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ onSubmit }: ReviewStepProps) => {
  const toast = useAsyncToast({ position: 'top-right' });
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      toast.loading('saving...');
      await onSubmit();
      toast.success('saved!');
    } catch (err: any) {
      console.log('ERR: ', err);
      toast.error('An error occurred');
    }
  });

  return (
    <Typography variant='h5' color='warning.main' align='center' sx={{ py: 10 }}>
      TODO: review step
    </Typography>
  );
};
