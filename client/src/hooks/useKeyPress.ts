import { useState, useEffect, useCallback, useMemo } from 'react';

export const useKeyPress = (
  targetKey: string | string[],
  onPress?: (e: KeyboardEvent) => void
): boolean => {
  const [keyPressed, setKeyPressed] = useState(false);
  const monitoredKeys = useMemo(() => {
    if (typeof targetKey === 'string') return [targetKey];
    return targetKey;
  }, [targetKey]);

  const downHandler = useCallback(
    // ({ key }: KeyboardEvent): void => {
    (e: KeyboardEvent): void => {
      // if (e.key === targetKey) {
      if (monitoredKeys.indexOf(e.key) !== -1) {
        setKeyPressed(true);
        if (onPress) onPress(e);
      }
    },
    [monitoredKeys, onPress] // targetKey
  );

  const upHandler = useCallback(
    ({ key }: KeyboardEvent): void => {
      // if (key === targetKey) {
      if (monitoredKeys.indexOf(key) !== -1) {
        setKeyPressed(false);
      }
    },
    [monitoredKeys] // [targetKey]
  );

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    // console.log('SETTING LISTENERS');

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [downHandler, upHandler]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Empty array ensures that effect is only run on mount and unmount

  return keyPressed;
};
