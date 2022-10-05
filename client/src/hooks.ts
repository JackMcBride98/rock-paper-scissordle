import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function getStorageValue<T>(key: string, defaultValue: T): T {
  // getting stored value
  try {
    const saved = localStorage.getItem(key);
    const initial = saved !== null ? JSON.parse(saved) : defaultValue;
    if (initial.lastWin) {
      initial.lastWin = new Date(initial.lastWin);
    }
    return initial || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    // storing input name
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }, [key, value]);

  return [value, setValue];
};
