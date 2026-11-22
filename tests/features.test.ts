import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";
import type { Application } from "../src/types";
import {
  createApplication,
  dashboardStats,
  isGhostingRisk,
  offerScore,
  sameApplication,
  skillMatch,
} from "../src/utils/application";
import { useUndoDelete } from "../src/hooks/useUndoDelete";
import { useLocalStorage } from "../src/hooks/useLocalStorage";
import { useDebounce } from "../src/hooks/useDebounce";
import { applicationArray, stringArray } from "../src/utils/validation";
import { fetchJobs } from "../src/services/jobService";

const fixture = (overrides: Partial<Application> = {}): Application => ({
  id: "a",
  company: "Nusantara",
  role: "Frontend",
  status: "WISHLIST",
  workMode: "Remote",
  requiredSkills: ["React", "CSS"],
  lastUpdatedAt: "2026-11-01T00:00:00.000Z",
  checklist: [{ id: "c", text: "CV", done: true }],
  activityLogs: [
    { id: "l", timestamp: "2026-11-01T00:00:00.000Z", message: "Dibuat" },
  ],
  ...overrides,
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  vi.unstubAllGlobals();
});
describe("Aturan domain", () => {
  it("mencocokkan skill tanpa kapitalisasi dan menghitung missing skills", () => {
    expect(
      skillMatch(
        ["React", "TypeScript", "CSS", "Docker"],
        ["react", "typescript", "css"],
      ),
    ).toEqual({
      matched: ["React", "TypeScript", "CSS"],
      missing: ["Docker"],
      score: 75,
    });
    expect(skillMatch([], ["React"]).score).toBe(0);
    expect(skillMatch(["React", "react"], ["REACT"]).score).toBe(100);
  });
  it("menolak pasangan perusahaan/role sama setelah trim dan lowercase", () => {
    expect(
      sameApplication(fixture(), {
        company: " NUSANTARA ",
        role: " frontend ",
      }),
    ).toBe(true);
    expect(
      sameApplication(fixture(), { company: "Nusantara", role: "Backend" }),
    ).toBe(false);
  });
  it("membuat nested state dan activity log awal lengkap", () => {
    const app = createApplication({
      company: " Nusantara ",
      role: " Frontend ",
      status: "WISHLIST",
      workMode: "Remote",
      requiredSkills: ["React", "react"],
    });
    expect(app.company).toBe("Nusantara");
    expect(app.requiredSkills).toEqual(["React"]);
    expect(app.id).toBeTruthy();
    expect(app.activityLogs).toHaveLength(1);
    expect(app.checklist).toEqual([]);
  });
  it("ghosting hanya lebih dari 14 hari pada APPLIED/SCREENING", () => {
    const app = fixture({ status: "APPLIED" }),
      boundary = Date.parse(app.lastUpdatedAt) + 14 * 86400000;
    expect(isGhostingRisk(app, boundary)).toBe(false);
    expect(isGhostingRisk(app, boundary + 1)).toBe(true);
    expect(isGhostingRisk(fixture({ status: "OFFER" }), boundary + 1)).toBe(
      false,
    );
  });
  it("statistik aman saat kosong dan menggunakan denominator tanpa wishlist", () => {
    expect(dashboardStats([])).toEqual({
      total: 0,
      responseRate: 0,
      interviewRate: 0,
      ghosting: 0,
      offers: 0,
    });
    const apps = (
      [
        "WISHLIST",
        "APPLIED",
        "SCREENING",
        "INTERVIEW",
        "OFFER",
        "REJECTED",
        "GHOSTED",
      ] as const
    ).map((status) => fixture({ status }));
    expect(dashboardStats(apps, Date.parse("2026-11-21"))).toEqual({
      total: 7,
      responseRate: 67,
      interviewRate: 33,
      ghosting: 2,
      offers: 1,
    });
  });
  it("comparator menormalisasi terhadap dua offer dan membobot 50/25/25", () => {
    const a = fixture({ status: "OFFER", salaryOffer: 5000000 });
    const b = fixture({
      status: "OFFER",
      salaryOffer: 6000000,
      workMode: "Hybrid",
      requiredSkills: ["React", "TypeScript", "CSS", "Docker"],
    });
    expect(offerScore(a, b, ["React", "TypeScript", "CSS"]).total).toBeCloseTo(
      91.6667,
      3,
    );
    expect(offerScore(b, a, ["React", "TypeScript", "CSS"]).total).toBe(87.5);
    expect(Number.isFinite(offerScore(fixture(), fixture(), []).total)).toBe(
      true,
    );
  });
});
describe("Hook dan persistensi", () => {
  it("debounce menunggu 400ms dan membuang timer ketikan sebelumnya", () => {
    vi.useFakeTimers();
    const { result, rerender, unmount } = renderHook(
      ({ keyword }) => useDebounce(keyword, 400),
      { initialProps: { keyword: "" } },
    );
    rerender({ keyword: "Re" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ keyword: "React" });
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("React");
    rerender({ keyword: "Docker" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("Undo mengembalikan objek dan urutan utuh, timer hapus kedua mengganti timer pertama", () => {
    vi.useFakeTimers();
    const a = fixture(),
      b = fixture({ id: "b", company: "B" });
    const { result, unmount } = renderHook(() => {
      const [apps, setApps] = useState([a, b]);
      return { apps, ...useUndoDelete(apps, setApps) };
    });
    act(() => result.current.remove("a"));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.remove("b"));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.pending?.application.id).toBe("b");
    expect(result.current.apps).toEqual([]);
    act(() => result.current.undo());
    expect(result.current.apps).toEqual([b]);
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.remove("b"));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("toast hilang tepat 5 detik tanpa memulihkan lamaran", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => {
      const [apps, setApps] = useState([fixture()]);
      return { apps, ...useUndoDelete(apps, setApps) };
    });
    act(() => result.current.remove("a"));
    act(() => vi.advanceTimersByTime(4999));
    expect(result.current.pending).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.pending).toBeNull();
    expect(result.current.apps).toEqual([]);
  });
  it("Undo mempertahankan posisi awal dan nested checklist/log", () => {
    const a = fixture(),
      b = fixture({ id: "b", company: "B" }),
      c = fixture({ id: "c", company: "C" });
    const { result } = renderHook(() => {
      const [apps, setApps] = useState([a, b, c]);
      return { apps, ...useUndoDelete(apps, setApps) };
    });
    act(() => result.current.remove("b"));
    act(() => result.current.undo());
    expect(result.current.apps).toEqual([a, b, c]);
  });
  it("menyimpan functional updates dan memuat nested data setelah remount", () => {
    const { result, unmount } = renderHook(() =>
      useLocalStorage<Application[]>("applications", [], applicationArray),
    );
    act(() => result.current[1]((current) => [...current, fixture()]));
    expect(JSON.parse(localStorage.getItem("applications") ?? "null")).toEqual([
      fixture(),
    ]);
    unmount();
    const again = renderHook(() =>
      useLocalStorage<Application[]>("applications", [], applicationArray),
    );
    expect(again.result.current[0]).toEqual([fixture()]);
  });
  it("JSON rusak atau tipe salah tidak membuat aplikasi crash", () => {
    localStorage.setItem("kaptenSkills", "{broken");
    const { result } = renderHook(() =>
      useLocalStorage("kaptenSkills", ["React"], stringArray),
    );
    expect(result.current[0]).toEqual(["React"]);
    expect(result.current[2]).toContain("tidak dapat dibaca");
    expect(applicationArray([{}])).toBe(false);
  });
  it("storage penuh menghasilkan pesan dan state tetap dapat digunakan", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() =>
      useLocalStorage("kaptenSkills", ["React"], stringArray),
    );
    act(() => result.current[1](["React", "CSS"]));
    expect(result.current[0]).toEqual(["React", "CSS"]);
    expect(result.current[2]).toContain("belum tersimpan");
  });
});
describe("Service lowongan", () => {
  it("meneruskan AbortSignal, menolak HTTP error dan payload tidak valid", async () => {
    const signal = new AbortController().signal;
    const mock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ jobs: [] }), { status: 200 }),
      );
    vi.stubGlobal("fetch", mock);
    await expect(fetchJobs("local", signal)).resolves.toEqual([]);
    expect(mock).toHaveBeenCalledWith("/magang-fallback.json", { signal });
    mock.mockResolvedValueOnce(new Response("", { status: 503 }));
    await expect(fetchJobs("live", signal)).rejects.toThrow("503");
    mock.mockResolvedValueOnce(new Response(JSON.stringify({ jobs: [{}] })));
    await expect(fetchJobs("local", signal)).rejects.toThrow("tidak valid");
  });
});
