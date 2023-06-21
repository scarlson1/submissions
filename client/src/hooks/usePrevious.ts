import { useEffect, useRef } from 'react';

export function usePrevious(val: any) {
  const prevRef = useRef();

  useEffect(() => {
    prevRef.current = val;
  });

  return prevRef.current;
}
