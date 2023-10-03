import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from 'components';
import { LoadingComponent } from 'components/layout';
import { useSafeParams } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { createChangeRequest } from 'modules/db';
import { LocationChangeWizard } from './WizardForm';

export const LocationChange = () => {
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);
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

export const TestLocationChange = ({
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

// function Header() {
//   return (
// <Typography variant='h6' align='center' sx={{ pb: 4 }}>
//   Location Change Request
// </Typography>
//   );
// }
