import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Application } from "../types";
import { sameApplication } from "../utils/application";

export function useUndoDelete(
  applications: Application[],
  setApplications: Dispatch<SetStateAction<Application[]>>,
) {
  const [pending, setPending] = useState<{
    application: Application;
    index: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearTimer() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  useEffect(() => () => clearTimer(), []);
  function remove(id: string) {
    const index = applications.findIndex((app) => app.id === id);
    if (index < 0) return;
    clearTimer();
    setPending({ application: applications[index], index });
    setApplications((current) => current.filter((app) => app.id !== id));
    timerRef.current = setTimeout(() => {
      setPending(null);
      timerRef.current = null;
    }, 5000);
  }
  function undo() {
    if (!pending) return;
    clearTimer();
    const { application, index } = pending;
    setApplications((current) => {
      if (
        current.some(
          (app) =>
            app.id === application.id || sameApplication(app, application),
        )
      )
        return current;
      return [...current.slice(0, index), application, ...current.slice(index)];
    });
    setPending(null);
  }
  return { pending, remove, undo };
}
