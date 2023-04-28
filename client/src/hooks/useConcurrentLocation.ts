import { useEffect, useState, useTransition } from 'react';
import { Location, useLocation } from 'react-router-dom';

export const useConcurrentLocation = (): Location & { isPending: boolean } => {
  const originalLocation = useLocation();
  const [location, setLocation] = useState(originalLocation);
  const [isPending, startTransition] = useTransition();

  // useEffect(() => {
  //   if (
  //     location.pathname !== originalLocation.pathname ||
  //     location.search !== originalLocation.search
  //   ) {
  //     startTransition(() => {
  //       setLocation(originalLocation);
  //     });
  //   }
  // }, [originalLocation.pathname, originalLocation.search]);

  useEffect(() => {
    // if the path or search params change, mark this is a navigational transition
    setLocation((oldLocation) =>
      oldLocation.pathname !== location.pathname || oldLocation.search !== location.search
        ? location
        : oldLocation
    );
  }, [location]);

  useEffect(() => {
    // tell concurrent mode to pause UI rendering for a moment
    startTransition(() => {});
  }, [location]);

  return {
    ...location,
    isPending,
  };
};
