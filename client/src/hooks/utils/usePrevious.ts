import { useEffect, useRef } from 'react';

export function usePrevious<T>(val?: T) {
  const prevRef = useRef<T>();

  useEffect(() => {
    prevRef.current = val;
  });

  return prevRef.current;
}
