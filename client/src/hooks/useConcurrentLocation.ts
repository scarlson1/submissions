import { useEffect, useState, useTransition } from 'react';
import { Location, useLocation } from 'react-router-dom';

export const useConcurrentLocation = (): Location & { isPending: boolean } => {
  const originalLocation = useLocation();
  const [location, setLocation] = useState(originalLocation);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      location.pathname !== originalLocation.pathname ||
      location.search !== originalLocation.search
    ) {
      startTransition(() => {
        setLocation(originalLocation);
      });
    }
  }, [originalLocation.pathname, originalLocation.search]);

  return {
    ...location,
    isPending,
  };
};
