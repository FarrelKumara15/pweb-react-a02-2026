import type { Application, NewApplication, WorkMode } from "../types";

export const normalize = (text: string) => text.trim().toLowerCase();
export function uniqueSkills(skills: string[]) {
  return skills
    .map((skill) => skill.trim())
    .filter(
      (skill, index, all) =>
        skill !== "" &&
        all.findIndex((item) => normalize(item) === normalize(skill)) === index,
    );
}
export function sameApplication(
  a: Pick<Application, "company" | "role">,
  b: Pick<Application, "company" | "role">,
) {
  return (
    normalize(a.company) === normalize(b.company) &&
    normalize(a.role) === normalize(b.role)
  );
}
export function skillMatch(requiredSkills: string[], kaptenSkills: string[]) {
  const required = uniqueSkills(requiredSkills);
  const owned = new Set(kaptenSkills.map(normalize));
  const matched = required.filter((skill) => owned.has(normalize(skill)));
  const missing = required.filter((skill) => !owned.has(normalize(skill)));
  return {
    matched,
    missing,
    score: required.length
      ? Math.round((matched.length / required.length) * 100)
      : 0,
  };
}
export function createApplication(input: NewApplication): Application {
  const now = new Date().toISOString();
  return {
    ...input,
    company: input.company.trim(),
    role: input.role.trim(),
    requiredSkills: uniqueSkills(input.requiredSkills),
    id: crypto.randomUUID(),
    lastUpdatedAt: now,
    checklist: [],
    activityLogs: [
      {
        id: crypto.randomUUID(),
        timestamp: now,
        message: `Lamaran dibuat dengan status ${input.status}.`,
      },
    ],
  };
}
export function inferWorkMode(location: string): WorkMode {
  if (/hybrid/i.test(location)) return "Hybrid";
  if (/onsite|on-site/i.test(location)) return "Onsite";
  return "Remote";
}
export function isGhostingRisk(application: Application, now = Date.now()) {
  return (
    ["APPLIED", "SCREENING"].includes(application.status) &&
    now - Date.parse(application.lastUpdatedAt) > 14 * 24 * 60 * 60 * 1000
  );
}
export function dashboardStats(applications: Application[], now = Date.now()) {
  const submitted = applications.filter(
    (app) => app.status !== "WISHLIST",
  ).length;
  const responses = applications.filter((app) =>
    ["SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(app.status),
  ).length;
  const interviews = applications.filter((app) =>
    ["INTERVIEW", "OFFER"].includes(app.status),
  ).length;
  return {
    total: applications.length,
    responseRate: submitted ? Math.round((responses / submitted) * 100) : 0,
    interviewRate: submitted ? Math.round((interviews / submitted) * 100) : 0,
    ghosting: applications.filter((app) => isGhostingRisk(app, now)).length,
    offers: applications.filter((app) => app.status === "OFFER").length,
  };
}
export function offerScore(
  offer: Application,
  other: Application,
  skills: string[],
) {
  const salary = Math.max(0, offer.salaryOffer ?? 0);
  const maxSalary = Math.max(salary, other.salaryOffer ?? 0);
  const normalizedSalary = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
  const modeScore = { Remote: 100, Hybrid: 75, Onsite: 50 }[offer.workMode];
  const match = skillMatch(offer.requiredSkills, skills).score;
  return {
    normalizedSalary,
    modeScore,
    match,
    total: normalizedSalary * 0.5 + modeScore * 0.25 + match * 0.25,
  };
}
export const rupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
