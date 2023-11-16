import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

// TODO: store "view" preference in local storage ??
export const DataViewType = z.enum(['cards', 'grid', 'map']);
export type TDataViewType = z.infer<typeof DataViewType>;

// const getInitTabView = <T extends string>(
//   searchParam: string | null,
//   options: string[],
//   fallback: T
// ): T => (options.includes(searchParam || '') ? (searchParam as T) : fallback);
const getInitTabView = <T extends string>(
  searchParam: string | null,
  options: string[],
  fallback: T
): T => {
  if (typeof window === 'undefined') return fallback;
  if (!searchParam) return fallback;
  let storageVal;
  try {
    storageVal = localStorage.getItem(searchParam);
    if (!storageVal) localStorage.setItem(searchParam, fallback);
  } catch (e) {}
  let val = searchParam || storageVal;
  return options.includes(val || '') ? (val as T) : fallback;
};

export const useSearchParamToggle = <T extends string>(
  searchKey: string,
  options: T[],
  fallback: T
) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<T | null>(
    getInitTabView<T>(searchParams.get(searchKey), options, fallback)
  );

  const handleViewChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newView: T | null) => {
      newView && setView(newView);
      newView && setSearchParams({ [searchKey]: newView });
    },
    [setSearchParams, searchKey]
  );

  return [view, handleViewChange] as const;
};
