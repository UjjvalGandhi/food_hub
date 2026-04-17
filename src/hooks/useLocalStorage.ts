import { useState, useCallback } from "react";

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (val: T) => void;
  removeValue: () => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [value, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (val: T) => {
      try {
        setStoredValue(val);
        window.localStorage.setItem(key, JSON.stringify(val));
      } catch (error) {
        console.error(`[useLocalStorage] Error setting key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  return { value, setValue, removeValue };
}
