import { useMemo } from 'react';

import type {
  DraftAddLocationRequest,
  ILocation,
  WithId,
} from '@idemand/common';
import { ReviewStepComponent } from '../LocationChangeForm/ReviewStep';

interface ReviewStepProps {
  changeRequest: DraftAddLocationRequest;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ changeRequest, ...props }: ReviewStepProps) => {
  const locations = useMemo(() => {
    return Object.entries(changeRequest.endorsementChanges || {}).map(
      ([id, lcn]) => ({
        ...lcn,
        id,
      }),
    ) as WithId<ILocation>[];
  }, [changeRequest]);

  return (
    <ReviewStepComponent
      changeRequest={changeRequest}
      locations={locations}
      {...props}
    />
  );
};
