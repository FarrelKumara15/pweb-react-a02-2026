import { useState } from "react";
import type { Application, ApplicationStatus } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import {
  findInterviewConflicts,
  isGhostingRisk,
  normalize,
  rupiah,
  simulateGhosting15Days,
  skillMatch,
} from "../utils/application";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { MatchBadge } from "./MatchBadge";

type SortMode = "latest" | "interview" | "offer";

const STATUS_OPTIONS: Array<"ALL" | ApplicationStatus> = [
  "ALL",
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

export function ApplicationList({
  applications,
  skills,
  onDelete,
  onUpdate,
}: {
  applications: Application[];
  skills: string[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updater: (app: Application) => Application) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApplicationStatus>(
    "ALL",
  );
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Bentrok selalu dicek dari seluruh data lamaran, bukan data ter-filter.
  const conflicts = findInterviewConflicts(applications);
  const conflictIds = new Set(
    conflicts.flatMap((conflict) => [conflict.a.id, conflict.b.id]),
  );

  const keyword = normalize(debouncedSearch);
  const filtered = applications
    .filter((app) => {
      if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
      if (onlyGhosting && !isGhostingRisk(app)) return false;
      if (!keyword) return true;
      return (
        normalize(app.company).includes(keyword) ||
        normalize(app.role).includes(keyword) ||
        app.requiredSkills.some((skill) => normalize(skill).includes(keyword))
      );
    })
    .sort((a, b) => {
      if (sortBy === "interview") {
        const timeA = a.interviewDateTime
          ? Date.parse(a.interviewDateTime)
          : Number.POSITIVE_INFINITY;
        const timeB = b.interviewDateTime
          ? Date.parse(b.interviewDateTime)
          : Number.POSITIVE_INFINITY;
        return timeA - timeB;
      }
      if (sortBy === "offer") {
        return (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0);
      }
      return Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt);
    });

  const selectedApp =
    applications.find((app) => app.id === selectedId) ?? null;

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">WAR ROOM PIPELINE</p>
          <h2>Lamaran tersimpan</h2>
        </div>
        <span className="count">
          {filtered.length} dari {applications.length} lamaran
        </span>
      </div>

      {conflicts.length > 0 && (
        <div className="conflict-banner" role="alert">
          <strong>
            Peringatan Bentrok Jadwal Interview ({conflicts.length})
          </strong>
          <ul>
            {conflicts.map(({ a, b, diffMinutes }) => (
              <li key={`${a.id}-${b.id}`}>
                <strong>{a.company}</strong> ({a.role}) &amp;{" "}
                <strong>{b.company}</strong> ({b.role}) berjarak {diffMinutes}{" "}
                menit ({a.interviewDateTime?.replace("T", " ")} vs{" "}
                {b.interviewDateTime?.replace("T", " ")})
              </li>
            ))}
          </ul>
        </div>
      )}

      {applications.length > 0 && (
        <div className="panel war-room-toolbar">
          <div className="toolbar">
            <div className="search-field">
              <label htmlFor="war-room-search">Cari lamaran</label>
              <input
                id="war-room-search"
                type="search"
                placeholder="Perusahaan, posisi, atau skill..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="war-room-status">Status</label>
              <select
                id="war-room-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ALL" | ApplicationStatus,
                  )
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "Semua Status" : status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="war-room-sort">Urutkan</label>
              <select
                id="war-room-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortMode)}
              >
                <option value="latest">Terbaru</option>
                <option value="interview">Jadwal Interview Terdekat</option>
                <option value="offer">Offer Tertinggi</option>
              </select>
            </div>
          </div>
          <label className="ghosting-toggle">
            <input
              type="checkbox"
              checked={onlyGhosting}
              onChange={(event) => setOnlyGhosting(event.target.checked)}
            />
            <span>Hanya Rawan Ghosting (&gt; 14 hari)</span>
          </label>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="empty">
          <h3>Perjalananmu dimulai di sini.</h3>
          <p>Simpan lowongan ke Wishlist atau tambahkan lamaran manual.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h3>Tidak ada lamaran yang cocok.</h3>
          <p>Ubah kata kunci pencarian, status, atau filter Rawan Ghosting.</p>
        </div>
      ) : (
        <div className="application-list">
          {filtered.map((app) => {
            const ghosting = isGhostingRisk(app);
            const canSimulateGhosting =
              app.status === "APPLIED" || app.status === "SCREENING";
            return (
              <article className="panel application-row" key={app.id}>
                <div>
                  <div className="pill-row">
                    <span className="status-pill">{app.status}</span>
                    {ghosting && (
                      <span className="risk-pill">Rawan Ghosting</span>
                    )}
                    {conflictIds.has(app.id) && (
                      <span className="conflict-pill">Jadwal Bentrok</span>
                    )}
                  </div>
                  <h3>{app.role}</h3>
                  <p className="muted">
                    {app.company} · {app.workMode}
                    {app.salaryOffer ? ` · ${rupiah(app.salaryOffer)}` : ""}
                  </p>
                  <p className="small">
                    CV: {app.cvVersion || "Belum ditambahkan"} · Checklist:{" "}
                    {app.checklist.filter((item) => item.done).length}/
                    {app.checklist.length} · {app.activityLogs.length} aktivitas
                    {app.interviewDateTime
                      ? ` · Interview: ${app.interviewDateTime.replace("T", " ")}`
                      : ""}
                  </p>
                </div>
                <div className="actions war-room-actions">
                  <MatchBadge
                    score={skillMatch(app.requiredSkills, skills).score}
                  />
                  {canSimulateGhosting && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() =>
                        onUpdate(app.id, (current) =>
                          simulateGhosting15Days(current),
                        )
                      }
                    >
                      Simulasi +15 Hari
                    </button>
                  )}
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => setSelectedId(app.id)}
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    className="button danger"
                    aria-label={`Hapus lamaran ${app.company} ${app.role}`}
                    onClick={() => {
                      if (selectedId === app.id) setSelectedId(null);
                      onDelete(app.id);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          skills={skills}
          onUpdate={onUpdate}
          onClose={() => setSelectedId(null)}
        />
      )}
    </section>
  );
}
