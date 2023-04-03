import React, { useEffect } from 'react';
import NProgress from 'nprogress';

// https://stackoverflow.com/questions/56640899/use-nprogress-with-react-lazy

export const LazyLoad: React.FC = () => {
  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  });

  return <div></div>;
};

// <Suspense fallback={<LazyLoad />}></Suspense>
