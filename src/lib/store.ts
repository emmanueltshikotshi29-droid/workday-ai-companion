import { useEffect, useState } from "react";

export type Activity = { id: string; type: "email" | "plan" | "research" | "chat"; title: string; at: number };

const EVT = "wa-store";

export function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

/** Hydration-safe localStorage state. */
export function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setValue(readLS(key, fallback));
    setReady(true);
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === key) setValue(readLS(key, fallback));
    };
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T | ((p: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      writeLS(key, next);
      return next;
    });
  };
  return [value, set, ready] as const;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function logActivity(type: Activity["type"], title: string) {
  const list = readLS<Activity[]>("wa.activity", []);
  writeLS("wa.activity", [{ id: uid(), type, title, at: Date.now() }, ...list].slice(0, 50));
  const stats = readLS<Record<string, number>>("wa.stats", {});
  stats[type] = (stats[type] ?? 0) + 1;
  writeLS("wa.stats", stats);
}
