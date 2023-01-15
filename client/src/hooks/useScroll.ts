import { useCallback } from 'react';

// stop scroll if user scrolls:
// window.addEventListener("scroll", this.handleScroll)
// if (event.isTrusted) {
//   // human gesture
// } else {
//   // automated
// }

export const useScroll = () => {
  const scrollToTop = useCallback(() => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      // fallback for older browsers
      window.scrollTo(0, 0);
    }
    return null;
  }, []);

  // add scrollToBottom ??

  return { scrollToTop };
};
