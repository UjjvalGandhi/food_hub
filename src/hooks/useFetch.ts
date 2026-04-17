import { useState, useEffect, useCallback, useRef } from "react";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ data: null, isLoading: true, error: null });

    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as T;
      setState({ data: json, isLoading: false, error: null });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ data: null, isLoading: false, error: (err as Error).message });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
