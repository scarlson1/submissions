import { useState, useEffect, useCallback } from 'react';

export const useKeyPress = (targetKey: string, onPress?: (e: KeyboardEvent) => void): boolean => {
  const [keyPressed, setKeyPressed] = useState(false);

  const downHandler = useCallback(
    // ({ key }: KeyboardEvent): void => {
    (e: KeyboardEvent): void => {
      if (e.key === targetKey) {
        setKeyPressed(true);
        if (onPress) onPress(e);
      }
    },
    [targetKey, onPress]
  );

  const upHandler = useCallback(
    ({ key }: KeyboardEvent): void => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    },
    [targetKey]
  );

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
    // }, [downHandler, upHandler]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return keyPressed;
};
