import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from 'components';
import { LoadingComponent } from 'components/layout';
import { useSafeParams } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { createChangeRequest } from 'modules/db';
import { LocationChangeWizard } from './LocationChangeWizard';

// TODO: delete (was used when change location had dedicated route)
export const LocationChangeWrapper = () => {
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);

  return <LocationChange policyId={policyId} locationId={locationId} />;
};

export const LocationChange = ({
  policyId,
  locationId,
}: {
  policyId: string;
  locationId: string;
}) => {
  const prev = usePrevious(policyId);

  const [changeRequestResource, setChangeRequestResource] =
    useState<ReturnType<typeof createChangeRequest>>();

  useEffect(() => {
    if (!changeRequestResource && policyId !== prev) {
      console.log('calling change request resource function');

      setChangeRequestResource(createChangeRequest(policyId));
    }
  }, [policyId, prev, changeRequestResource]);

  // TODO: pass to onReset prop of ErrorBoundary once comfortable reset works (on only pass in certain situations ??)
  // const createNewChangeRequest = useCallback(
  //   () => {
  //    setChangeRequestResource(createChangeRequest(policyId))
  //   },
  //   [policyId],
  // )

  if (!changeRequestResource) return null;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingComponent />}>
        <LocationChangeWizard
          changeRequestDocResource={changeRequestResource}
          policyId={policyId}
          locationId={locationId}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
