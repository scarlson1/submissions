import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const getInitTabView = <T extends string>(
  searchParam: string | null,
  options: string[],
  fallback: T
): T => (options.includes(searchParam || '') ? (searchParam as T) : fallback);

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
