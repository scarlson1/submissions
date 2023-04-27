import React from 'react';
import { useNProgress } from '@tanem/react-nprogress';

import { Bar } from './Bar';
import { Container } from './Container';

// TODO: useSpring to call start & done (instead of CSSTransition)
//https://codesandbox.io/s/github/tanem/react-nprogress/tree/master/examples/react-router-v6?file=/src/index.tsx
// https://github.com/tanem/react-nprogress

// react docs (suspense enabled router): https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router

const ProgressBar: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => {
  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating,
  });

  return (
    <Container animationDuration={animationDuration} isFinished={isFinished}>
      <Bar animationDuration={animationDuration} progress={progress} />
      {/*
      This example doesn't use a spinner component so the UI stays
      tidy. You're free to render whatever is appropriate for your
      use-case.
      */}
    </Container>
  );
};

export default ProgressBar;

// another example: https://github.com/remix-run/react-router/issues/8860#issuecomment-1217880719

// STACK OVERFLOW EXAMPLE

// TODO: try using pathhame as key ??
// OR use pathname to trigger page load ?? how would .done() be called ??

// import { Outlet } from 'react-router-dom';

// const AnimationLayout = () => {
//   const { pathname } = useLocation();
//   return (
//     <PageLayout>
//       <motion.div
//         key={pathname}
//         initial='initial'
//         animate='in'
//         variants={pageVariants}
//         transition={pageTransition}
//       >
//         <Outlet />
//       </motion.div>
//     </PageLayout>
//   );
// };
