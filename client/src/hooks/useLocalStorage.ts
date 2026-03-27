import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | undefined>(() => {
    if (typeof window === 'undefined') {
      console.log('returning from undefined window');
      return initialValue;
    }
    try {
      const item = localStorage.getItem(key);

      // return item ? JSON.parse(item) : initialValue;
      return item ? (item as T) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value?: T | ((val?: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        // localStorage.setItem(key, JSON.stringify(valueToStore));
        if (typeof valueToStore === 'string') localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
