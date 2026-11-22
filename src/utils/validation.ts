import type { Application, JobListing } from "../types";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
export const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const optionalString = (value: unknown) =>
  value === undefined || typeof value === "string";
export function isJob(value: unknown): value is JobListing {
  return (
    record(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.company_name === "string" &&
    typeof value.category === "string" &&
    typeof value.candidate_required_location === "string" &&
    typeof value.salary === "string" &&
    stringArray(value.tags)
  );
}
export function isApplication(value: unknown): value is Application {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.company === "string" &&
    typeof value.role === "string" &&
    ["Remote", "Hybrid", "Onsite"].includes(String(value.workMode)) &&
    [
      "WISHLIST",
      "APPLIED",
      "SCREENING",
      "INTERVIEW",
      "OFFER",
      "REJECTED",
      "GHOSTED",
    ].includes(String(value.status)) &&
    stringArray(value.requiredSkills) &&
    typeof value.lastUpdatedAt === "string" &&
    Number.isFinite(Date.parse(value.lastUpdatedAt)) &&
    optionalString(value.cvVersion) &&
    optionalString(value.appliedDate) &&
    optionalString(value.interviewDateTime) &&
    (value.salaryOffer === undefined ||
      (typeof value.salaryOffer === "number" &&
        Number.isFinite(value.salaryOffer))) &&
    Array.isArray(value.checklist) &&
    value.checklist.every(
      (item) =>
        record(item) &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.done === "boolean",
    ) &&
    Array.isArray(value.activityLogs) &&
    value.activityLogs.every(
      (item) =>
        record(item) &&
        typeof item.id === "string" &&
        typeof item.timestamp === "string" &&
        typeof item.message === "string",
    )
  );
}
export const applicationArray = (value: unknown): value is Application[] =>
  Array.isArray(value) && value.every(isApplication);
