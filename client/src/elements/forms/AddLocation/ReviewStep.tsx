import { useMemo } from 'react';

import { DraftAddLocationRequest } from 'common';
import { ReviewStepComponent } from '../LocationChangeForm/ReviewStep';

interface ReviewStepProps {
  changeRequest: DraftAddLocationRequest;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ changeRequest, ...props }: ReviewStepProps) => {
  const locations = useMemo(() => {
    return Object.entries(changeRequest.endorsementChanges || {}).map(([id, lcn]) => ({
      ...lcn,
      id,
    }));
  }, [changeRequest]);

  return <ReviewStepComponent changeRequest={changeRequest} locations={locations} {...props} />;
};
