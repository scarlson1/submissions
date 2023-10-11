import { Box } from '@mui/material';

import { CancellationRequest } from 'common';
import { ReviewStepComponent } from '../LocationChangeForm/ReviewStep';

// TODO: reuse ReviewStepComponent ??
// need to add custom props to grey out or add "cancel" banner over location card ??

// TODO: location cards with react query infinite scroll ??
// how should locations be displayed for policy cancellation (many locations)

export interface ReviewStepProps {
  changeRequest: CancellationRequest;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ onSubmit, changeRequest }: ReviewStepProps) => {
  //  const locations = useMemo<WithId<ILocation>[]>(() => {
  //    let lcnChangesObj = merge(data.endorsementChanges || {}, data.amendmentChanges, {});

  //    return locationData.map((l) =>
  //      deepMergeOverwriteArrays(l, lcnChangesObj[l.id] || {})
  //    ) as WithId<ILocation>[];
  //  }, [locationData, data]);

  // const toast = useAsyncToast({ position: 'top-right' });
  // const { handleStep } = useWizard();

  // handleStep(async () => {
  //   try {
  //     toast.loading('saving...');
  //     await onSubmit();
  //     toast.success('saved!');
  //   } catch (err: any) {
  //     console.log('ERR: ', err);
  //     toast.error('An error occurred');
  //   }
  // });

  return (
    <Box>
      {/* <Typography variant='h5' color='warning.main' align='center' sx={{ py: 10 }}>
        TODO: review step
      </Typography> */}
      <ReviewStepComponent changeRequest={changeRequest} locations={[]} onSubmit={onSubmit} />
      {/* <Box
        sx={{
          flex: '0 0 auto',
          mt: 2,
          pt: 2,
          mb: -2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <WizardNavButtons />
      </Box> */}
    </Box>
  );
};
