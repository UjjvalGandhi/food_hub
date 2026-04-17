"use client";

import { useState, useEffect } from "react";

/**
 * Delays updating a value until after a specified delay.
 * Useful for search inputs, filters, and API debouncing.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
