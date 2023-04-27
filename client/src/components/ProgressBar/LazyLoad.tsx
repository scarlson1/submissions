import { useEffect } from 'react';
import nProgress from 'nprogress';

// source: https://stackoverflow.com/a/62148553

export const LazyLoad = () => {
  useEffect(() => {
    nProgress.start();

    return () => {
      nProgress.done();
    };
  });

  return '';
};

// USAGE

// <Suspense fallback={<LazyLoad />}>
