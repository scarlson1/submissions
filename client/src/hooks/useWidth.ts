import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// TODO:  use zustand ??

// import { create } from 'zustand';

// interface DimensionsStore {
//   isMobile: boolean;
//   isSmall: boolean;
//   setSizes: (width: number) => void;
// }

// export const useAlgoliaStore = create<DimensionsStore>((set) => ({
//   isMobile: window.innerWidth <= 480,
//   isSmall: window.innerWidth <= 768,
//   // increasePopulation: () => set((state) => ({ bears: state.bears + 1 }))
//   setSizes: (width: number) => set(state => ({ isMobile: width <= 480, isSmall: width <= 768 })),
// }));

// DEFAULT 480 AS MOBILE WIDTH BREAKPOINT

export const useWidth = (mobileWidth?: number) => {
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  const tid: { current: NodeJS.Timeout | null } = useRef(null);

  const handleWindowSizeChange = useCallback(() => {
    clearTimeout(tid.current as NodeJS.Timeout);

    tid.current = setTimeout(() => {
      // console.log(`setting width (${window.innerWidth})`);
      setWidth(window.innerWidth);
    }, 250);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    };
  }, [handleWindowSizeChange]);

  useEffect(() => {
    setIsMobile(width <= 480);
    setIsSmall(width <= 768);
  }, [width]);

  const memoedValue = useMemo(
    () => ({
      isMobile,
      isSmall,
      // width,
    }),
    [isSmall, isMobile] //, width]
  );

  return { ...memoedValue };
};

// Could use different approach for isMobile:
// typeof navigator !== 'undefined' && /(android)/i.test(navigator.userAgent) and iphone, etc.
