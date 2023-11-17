import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useLocalStorage } from './useLocalStorage';

// TODO: move logic to toggle button context

// TODO: store "view" preference in local storage ??
export const DataViewType = z.enum(['cards', 'grid', 'map']);
export type TDataViewType = z.infer<typeof DataViewType>;

// const getInitTabView = <T extends string>(
//   searchParam: string | null,
//   options: string[],
//   defaultValue: T
// ): T => (options.includes(searchParam || '') ? (searchParam as T) : defaultValue);
const getInitTabView = <T extends string>(
  queryKey: string,
  searchParam: string | null,
  options: string[],
  defaultValue: T
): T => {
  if (typeof window === 'undefined') return defaultValue;
  // if (!searchParam) return defaultValue;
  let storageVal;
  try {
    storageVal = localStorage.getItem(queryKey);
    if (!storageVal) localStorage.setItem(queryKey, defaultValue);
  } catch (e) {}
  let val = searchParam || storageVal;
  console.log(
    'GET INIT TAB VIEW (search, defaultValue, storage): ',
    searchParam,
    defaultValue,
    storageVal
  );
  return options.includes(val || '') ? (val as T) : defaultValue;
};

export const useSearchParamToggle = <T extends string>(
  queryKey: string,
  options: T[],
  defaultValue: T
) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<T | null>(
    getInitTabView<T>(queryKey, searchParams.get(queryKey), options, defaultValue)
  );
  const [, setStorageVal] = useLocalStorage<T>(
    queryKey,
    (searchParams.get(queryKey) as T) || defaultValue
  );

  const handleViewChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newView: T | null) => {
      newView && setView(newView);
      newView && setSearchParams({ [queryKey]: newView });
      newView && setStorageVal(newView);
    },
    [setSearchParams, queryKey]
  );

  return [view, handleViewChange] as const;
};
