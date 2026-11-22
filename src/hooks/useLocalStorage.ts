import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

// Keep each key owned by one hook instance in App; descendants receive props.
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate: (value: unknown) => value is T,
): readonly [T, Dispatch<SetStateAction<T>>, string | null] {
  const [loaded] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return { value: initialValue, error: null };
      const parsed: unknown = JSON.parse(raw);
      if (!validate(parsed)) throw new Error("Format data tidak sesuai");
      return { value: parsed, error: null };
    } catch {
      return {
        value: initialValue,
        error: `Data ${key} tidak dapat dibaca. Nilai awal digunakan.`,
      };
    }
  });
  const [value, setValue] = useState<T>(loaded.value);
  const [writeError, setWriteError] = useState<string | null>(null);
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setWriteError(null);
    } catch {
      setWriteError(
        `Data ${key} belum tersimpan. Penyimpanan browser penuh atau tidak tersedia.`,
      );
    }
  }, [key, value]);
  return [value, setValue, writeError ?? loaded.error] as const;
}
