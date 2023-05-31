import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import invariant from 'tiny-invariant';

export type SafeParams<Key extends string = string> = {
  readonly [key in Key]: string;
};

export const useSafeParams = (checkParams: string[]) => {
  let params = useParams();

  checkParams.forEach((k) => invariant(params[k]));

  return useMemo(() => params, [params]) as Readonly<SafeParams<string>>;
};
