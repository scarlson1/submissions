import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CancellationRequest } from 'common';
import { ErrorFallback } from 'components';
import { LoadingComponent } from 'components/layout';
import { usePrevious } from 'hooks/utils';
import { createChangeRequest } from 'modules/db';
import { CancelWizard } from './CancelWizard';

// TODO: optional locationId for policy cancellation ??

interface CancelFormProps {
  policyId: string;
  locationId?: string | null;
}

export default function CancelForm({ policyId, locationId }: CancelFormProps) {
  const prev = usePrevious(policyId);
  const prevLcnId = usePrevious(locationId);
  const [changeRequestResource, setChangeRequestResource] =
    useState<ReturnType<typeof createChangeRequest<CancellationRequest>>>();

  useEffect(() => {
    if (!changeRequestResource && (policyId !== prev || locationId !== prevLcnId)) {
      setChangeRequestResource(
        createChangeRequest<CancellationRequest>(policyId, { locationId: locationId || '' })
      );
    }
  }, [policyId, locationId, prev, prevLcnId, changeRequestResource]);

  // TODO: uncomment once wrapped in error boundary
  // const handleReset = useCallback(
  //   () => {
  //     setChangeRequestResource(createChangeRequest(policyId))
  //   },
  //   [policyId],
  // )

  if (!changeRequestResource) return null;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingComponent />}>
        <CancelWizard
          policyId={policyId}
          cancelScope={locationId ? 'location' : 'policy'}
          changeRequestDocResource={changeRequestResource}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
