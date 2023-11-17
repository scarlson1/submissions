import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

// use zustand instead ?? any scenario where used in two places on same view ?? or don't want to sync for all views ??

interface ToggleButtonContext<T extends string> {
  idPrefix: string;
  value: string;
  // handleToggleChange: (event: React.MouseEvent<HTMLElement>, newValue: T | null) => void;
  // options: T[];
}

const ToggleButtonContext = createContext<ToggleButtonContext<string> | null>(null);
// if (process.env.NODE_ENV !== 'production') {
//   Context.displayName = 'TabContext';
// }

function useUniquePrefix() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(`mui-p-${Math.round(Math.random() * 1e5)}`);
  }, []);
  return id;
}

// interface ToggleButtonProviderProps<T extends string> { children: ReactNode; value: T }
interface ToggleButtonProviderProps<T extends string> {
  children: ReactNode;
  // queryKey: string;
  // options: T[];
  // defaultValue: T;
  value: T;
}

export default function ToggleButtonProvider<T extends string = string>({
  children,
  value,
}: // queryKey,
// options,
// defaultValue,
ToggleButtonProviderProps<T>) {
  const idPrefix = useUniquePrefix();
  // const [value, handleToggleChange] = useSearchParamToggle(queryKey, options, defaultValue);

  // @ts-ignore // TODO: fix type
  const context = useMemo<ToggleButtonContext<T>>(() => {
    return { idPrefix, value } as ToggleButtonContext<T>;
  }, [idPrefix, value]);

  // // @ts-ignore // TODO: fix type
  // const context = useMemo<ToggleButtonContext<T>>(() => {
  //   return { idPrefix, value, handleToggleChange, options } as ToggleButtonContext<T>;
  // }, [idPrefix, value, handleToggleChange, options]);

  // @ts-ignore // TODO: need to use string instead of generic ?? can't pass generic to createContext ??
  return <ToggleButtonContext.Provider value={context}>{children}</ToggleButtonContext.Provider>;
}

export function useToggleContext() {
  const context = useContext(ToggleButtonContext);
  if (context === null) {
    throw new TypeError('useToggleContext must be within ToggleButtonProvider');
  }

  return context;
}

export function getPanelId<T extends string = string>(
  context: ToggleButtonContext<T>,
  value: string
) {
  const { idPrefix } = context;
  if (idPrefix === null) {
    return null;
  }
  return `${context.idPrefix}-P-${value}`;
}

export function getTabId<T extends string = string>(
  context: ToggleButtonContext<T>,
  value: string
) {
  const { idPrefix } = context;
  if (idPrefix === null) {
    return null;
  }
  return `${context.idPrefix}-T-${value}`;
}
