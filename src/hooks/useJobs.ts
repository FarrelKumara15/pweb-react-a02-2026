import { useEffect, useState } from "react";
import type { DataSource, JobListing } from "../types";
import { fetchJobs } from "../services/jobService";

type JobState =
  | { status: "loading" }
  | { status: "success"; jobs: JobListing[] }
  | { status: "error"; message: string; fallbackJobs: JobListing[] | null };
export function useJobs(source: DataSource) {
  const [state, setState] = useState<JobState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // A slow network must eventually expose Retry/Fallback as well.
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let active = true;
    setState({ status: "loading" });
    async function load() {
      try {
        const jobs = await fetchJobs(source, controller.signal);
        if (active) setState({ status: "success", jobs });
      } catch (error: unknown) {
        if (!active) return;
        const message = controller.signal.aborted
          ? "Permintaan melewati batas waktu 12 detik."
          : error instanceof Error
            ? error.message
            : "Tidak dapat mengambil lowongan.";
        setState({ status: "error", message, fallbackJobs: null });
        // Keep the live API error visible while attempting local data automatically.
        if (source === "live" && !controller.signal.aborted) {
          try {
            const fallbackJobs = await fetchJobs("local", controller.signal);
            if (active) setState({ status: "error", message, fallbackJobs });
          } catch {
            /* The explicit local-source button remains available. */
          }
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [source, attempt]);
  return { state, retry: () => setAttempt((current) => current + 1) };
}
