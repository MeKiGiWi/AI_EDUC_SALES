import { Platform } from "react-native";
import { useState } from "react";

function readSession<T>(key: string, fallback: T): T {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") {
    return fallback;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeSession<T>(key: string, value: T): void {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return;
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [state, setStateRaw] = useState<T>(() => readSession(key, initialValue));

  function setState(value: T): void {
    writeSession(key, value);
    setStateRaw(value);
  }

  return [state, setState];
}
