import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// TODO:  use zustand ??
// benefits: only need one instance of useWidth
// downside: must have instance of useWidth

// import { create } from 'zustand';
// interface WidthStore {
//   isMobile: boolean;
//   isSmall: boolean;
//   setSizes: (width: number) => void;
// }
// export const useWidthStore = create<WidthStore>((set) => ({
//   isMobile: window.innerWidth <= 480,
//   isSmall: window.innerWidth <= 768,
//   // increasePopulation: () => set((state) => ({ bears: state.bears + 1 }))
//   setSizes: (width: number) => set(() => ({ isMobile: width <= 480, isSmall: width <= 768 })),
// }));

// DEFAULT 480 AS MOBILE WIDTH BREAKPOINT
// mobileWidth?: number
export const useWidth = () => {
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  // const [isMobile, isSmall ] = useWidthStore((state) => [state.isMobile, state. isSmall]);
  // const [setSizes] = useWidthStore((state) => [state.setSizes]);

  const tid: { current: NodeJS.Timeout | null } = useRef(null);

  const handleWindowSizeChange = useCallback(() => {
    clearTimeout(tid.current as NodeJS.Timeout);

    // debounce
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
    // setSizes(width)
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
