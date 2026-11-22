import type { DataSource, JobListing } from "../types";
import { isJob } from "../utils/validation";

export const REMOTIVE_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
export async function fetchJobs(
  source: DataSource,
  signal: AbortSignal,
): Promise<JobListing[]> {
  const url =
    source === "live"
      ? REMOTIVE_URL
      : `${import.meta.env.BASE_URL}magang-fallback.json`;
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Sumber lowongan merespons HTTP ${response.status}.`);
  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("jobs" in data) ||
    !Array.isArray(data.jobs) ||
    !data.jobs.every(isJob)
  ) {
    throw new Error("Format data lowongan tidak valid.");
  }
  return data.jobs;
}
