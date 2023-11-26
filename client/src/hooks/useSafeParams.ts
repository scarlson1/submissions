import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export type SafeParams<Key extends string = string> = {
  readonly [key in Key]: string;
};

export const useSafeParams = (checkParams: string[]) => {
  let params = useParams();

  // TODO: replace invariant and pass user friendly message
  // checkParams.forEach((k) => invariant(params[k]));
  checkParams.forEach((k) => {
    if (!params[k]) throw new Error(`missing required url param (${k})`);
  });

  return useMemo(() => params, [params]) as Readonly<SafeParams<string>>;
};
