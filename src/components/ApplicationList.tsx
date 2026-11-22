import type { Application } from "../types";
import { isGhostingRisk, skillMatch } from "../utils/application";
import { MatchBadge } from "./MatchBadge";

export function ApplicationList({
  applications,
  skills,
  onDelete,
}: {
  applications: Application[];
  skills: string[];
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">LANGKAH YANG SUDAH DIAMBIL</p>
          <h2>Lamaran tersimpan</h2>
        </div>
        <span className="count">{applications.length} lamaran</span>
      </div>
      {applications.length === 0 ? (
        <div className="empty">
          <h3>Perjalananmu dimulai di sini.</h3>
          <p>Simpan lowongan ke Wishlist atau tambahkan lamaran manual.</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((app) => (
            <article className="panel application-row" key={app.id}>
              <div>
                <span className="status-pill">{app.status}</span>
                {isGhostingRisk(app) && (
                  <span className="risk-pill">Rawan Ghosting</span>
                )}
                <h3>{app.role}</h3>
                <p className="muted">
                  {app.company} · {app.workMode}
                </p>
                <p className="small">
                  CV: {app.cvVersion || "Belum ditambahkan"} · Checklist:{" "}
                  {app.checklist.filter((item) => item.done).length}/
                  {app.checklist.length} · {app.activityLogs.length} aktivitas
                </p>
              </div>
              <div className="actions">
                <MatchBadge
                  score={skillMatch(app.requiredSkills, skills).score}
                />
                <button
                  className="button danger"
                  aria-label={`Hapus lamaran ${app.company} ${app.role}`}
                  onClick={() => onDelete(app.id)}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
