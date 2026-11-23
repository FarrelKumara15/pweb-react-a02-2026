import { useEffect, useRef, useState } from "react";
import type { Application, ApplicationStatus, WorkMode } from "../types";
import {
  addChecklistItem,
  addManualActivityLog,
  deleteChecklistItem,
  getAllowedNextStatuses,
  isGhostingRisk,
  rupiah,
  skillMatch,
  toggleChecklistItem,
  transitionApplicationStatus,
} from "../utils/application";
import { InterviewPrepTimer } from "./InterviewPrepTimer";
import { MatchBadge } from "./MatchBadge";

type ModalTab = "status" | "checklist" | "interview";

export function ApplicationDetailModal({
  application,
  skills,
  onUpdate,
  onClose,
}: {
  application: Application;
  skills: string[];
  onUpdate: (id: string, updater: (app: Application) => Application) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("status");
  const allowedNext = getAllowedNextStatuses(application.status);

  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | "">(
    allowedNext[0] ?? "",
  );
  const [cvVersion, setCvVersion] = useState(application.cvVersion ?? "");
  const [appliedDate, setAppliedDate] = useState(
    application.appliedDate ?? new Date().toISOString().slice(0, 10),
  );
  const [interviewDateTime, setInterviewDateTime] = useState(
    application.interviewDateTime ?? "",
  );
  const [salaryOffer, setSalaryOffer] = useState(
    application.salaryOffer ? String(application.salaryOffer) : "",
  );
  const [workMode, setWorkMode] = useState<WorkMode>(application.workMode);
  const [statusError, setStatusError] = useState("");

  const [checklistText, setChecklistText] = useState("");
  const [checklistError, setChecklistError] = useState("");
  const [logText, setLogText] = useState("");
  const [logError, setLogError] = useState("");

  const cvRef = useRef<HTMLInputElement>(null);
  const appliedDateRef = useRef<HTMLInputElement>(null);
  const interviewRef = useRef<HTMLInputElement>(null);
  const salaryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextOptions = getAllowedNextStatuses(application.status);
    setTargetStatus(nextOptions[0] ?? "");
    setStatusError("");
  }, [application.status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const match = skillMatch(application.requiredSkills, skills);
  const doneCount = application.checklist.filter((item) => item.done).length;
  const totalChecklist = application.checklist.length;
  const progressPercent = totalChecklist
    ? Math.round((doneCount / totalChecklist) * 100)
    : 0;

  function handleTransitionSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!targetStatus) return;

    if (targetStatus === "APPLIED") {
      if (!cvVersion.trim()) {
        setStatusError("Versi CV wajib diisi saat pindah ke APPLIED.");
        cvRef.current?.focus();
        return;
      }
      if (!appliedDate) {
        setStatusError("Tanggal lamaran wajib diisi saat pindah ke APPLIED.");
        appliedDateRef.current?.focus();
        return;
      }
    } else if (targetStatus === "INTERVIEW") {
      if (!interviewDateTime) {
        setStatusError(
          "Jadwal interview wajib diisi saat pindah ke INTERVIEW.",
        );
        interviewRef.current?.focus();
        return;
      }
    } else if (targetStatus === "OFFER") {
      const parsedSalary = Number(salaryOffer);
      if (!Number.isFinite(parsedSalary) || parsedSalary <= 0) {
        setStatusError("Nominal gaji/uang saku harus lebih dari 0.");
        salaryRef.current?.focus();
        return;
      }
    }

    setStatusError("");
    onUpdate(application.id, (app) =>
      transitionApplicationStatus(app, {
        nextStatus: targetStatus,
        cvVersion,
        appliedDate,
        interviewDateTime,
        salaryOffer:
          targetStatus === "OFFER" ? Number(salaryOffer) : undefined,
        workMode: targetStatus === "OFFER" ? workMode : undefined,
      }),
    );
  }

  function handleAddChecklist(event: React.FormEvent) {
    event.preventDefault();
    if (!checklistText.trim()) {
      setChecklistError("Isi item checklist terlebih dahulu.");
      return;
    }
    setChecklistError("");
    onUpdate(application.id, (app) => addChecklistItem(app, checklistText));
    setChecklistText("");
  }

  function handleAddLog(event: React.FormEvent) {
    event.preventDefault();
    if (!logText.trim()) {
      setLogError("Catatan aktivitas tidak boleh kosong.");
      return;
    }
    setLogError("");
    onUpdate(application.id, (app) => addManualActivityLog(app, logText));
    setLogText("");
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="panel modal-card">
        <div className="modal-header">
          <div>
            <div className="pill-row">
              <span className="status-pill">{application.status}</span>
              {isGhostingRisk(application) && (
                <span className="risk-pill">Rawan Ghosting</span>
              )}
              <MatchBadge score={match.score} />
            </div>
            <h2 id="detail-modal-title">{application.role}</h2>
            <p className="muted">
              {application.company} · {application.workMode}
            </p>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            aria-label="Tutup detail lamaran"
          >
            Tutup ✕
          </button>
        </div>

        <div className="modal-tabs" role="tablist" aria-label="Detail lamaran">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "status"}
            className={activeTab === "status" ? "active" : ""}
            onClick={() => setActiveTab("status")}
          >
            Status &amp; Info
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "checklist"}
            className={activeTab === "checklist" ? "active" : ""}
            onClick={() => setActiveTab("checklist")}
          >
            Checklist &amp; Log ({doneCount}/{totalChecklist})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "interview"}
            className={activeTab === "interview" ? "active" : ""}
            onClick={() => setActiveTab("interview")}
          >
            Latihan Interview
          </button>
        </div>

        {activeTab === "status" && (
          <div className="modal-body">
            <dl className="detail-meta">
              <div>
                <dt>Versi CV</dt>
                <dd>{application.cvVersion || "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Tanggal Lamar</dt>
                <dd>{application.appliedDate || "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Jadwal Interview</dt>
                <dd>
                  {application.interviewDateTime
                    ? application.interviewDateTime.replace("T", " ")
                    : "Belum dijadwalkan"}
                </dd>
              </div>
              <div>
                <dt>Offer Gaji</dt>
                <dd>
                  {application.salaryOffer
                    ? rupiah(application.salaryOffer)
                    : "Belum ada offer"}
                </dd>
              </div>
            </dl>

            <div className="detail-skills">
              <p className="small">Skill yang dibutuhkan:</p>
              <div className="skill-list">
                {application.requiredSkills.length === 0 ? (
                  <span className="small">Tidak ada skill tercatat.</span>
                ) : (
                  application.requiredSkills.map((skill) => {
                    const isOwned = match.matched.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`skill ${isOwned ? "owned" : "missing"}`}
                      >
                        {skill}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="transition-box">
              <h3>Perpindahan Status (State Machine)</h3>
              {allowedNext.length === 0 ? (
                <p className="muted">
                  Status <strong>{application.status}</strong> bersifat final dan
                  tidak dapat dipindahkan lagi.
                </p>
              ) : (
                <form onSubmit={handleTransitionSubmit} className="transition-form">
                  <div className="form-grid">
                    <div>
                      <label htmlFor="next-status">Status Tujuan</label>
                      <select
                        id="next-status"
                        value={targetStatus}
                        onChange={(event) => {
                          setTargetStatus(
                            event.target.value as ApplicationStatus,
                          );
                          setStatusError("");
                        }}
                      >
                        {allowedNext.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {targetStatus === "APPLIED" && (
                      <>
                        <div>
                          <label htmlFor="detail-cv-version">Versi CV</label>
                          <input
                            ref={cvRef}
                            id="detail-cv-version"
                            type="text"
                            placeholder="Contoh: CV-Frontend-v2"
                            value={cvVersion}
                            onChange={(event) =>
                              setCvVersion(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label htmlFor="detail-applied-date">
                            Tanggal Lamar
                          </label>
                          <input
                            ref={appliedDateRef}
                            id="detail-applied-date"
                            type="date"
                            value={appliedDate}
                            onChange={(event) =>
                              setAppliedDate(event.target.value)
                            }
                          />
                        </div>
                      </>
                    )}

                    {targetStatus === "INTERVIEW" && (
                      <div>
                        <label htmlFor="detail-interview-dt">
                          Jadwal Interview
                        </label>
                        <input
                          ref={interviewRef}
                          id="detail-interview-dt"
                          type="datetime-local"
                          value={interviewDateTime}
                          onChange={(event) =>
                            setInterviewDateTime(event.target.value)
                          }
                        />
                      </div>
                    )}

                    {targetStatus === "OFFER" && (
                      <>
                        <div>
                          <label htmlFor="detail-salary">
                            Gaji / Uang Saku (Rp)
                          </label>
                          <input
                            ref={salaryRef}
                            id="detail-salary"
                            type="number"
                            min={1}
                            placeholder="Contoh: 4500000"
                            value={salaryOffer}
                            onChange={(event) =>
                              setSalaryOffer(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label htmlFor="detail-workmode">Mode Kerja</label>
                          <select
                            id="detail-workmode"
                            value={workMode}
                            onChange={(event) =>
                              setWorkMode(event.target.value as WorkMode)
                            }
                          >
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Onsite">Onsite</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {statusError && (
                    <p className="field-error" role="alert">
                      {statusError}
                    </p>
                  )}

                  <button type="submit" className="button primary">
                    Simpan Perubahan Status
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="modal-body checklist-log-grid">
            <div>
              <div className="checklist-header">
                <h3>Checklist Persiapan</h3>
                <span className="small">
                  {doneCount}/{totalChecklist} selesai ({progressPercent}%)
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <form onSubmit={handleAddChecklist} className="input-action">
                <input
                  type="text"
                  placeholder="Tambah item persiapan..."
                  aria-label="Tambah item checklist"
                  value={checklistText}
                  onChange={(event) => setChecklistText(event.target.value)}
                />
                <button type="submit" className="button primary">
                  Tambah
                </button>
              </form>
              {checklistError && (
                <p className="field-error" role="alert">
                  {checklistError}
                </p>
              )}

              {application.checklist.length === 0 ? (
                <p className="muted">Belum ada item checklist.</p>
              ) : (
                <ul className="checklist-items">
                  {application.checklist.map((item) => (
                    <li key={item.id} className="checklist-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            onUpdate(application.id, (app) =>
                              toggleChecklistItem(app, item.id),
                            )
                          }
                        />
                        <span className={item.done ? "done" : ""}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="button danger"
                        aria-label={`Hapus checklist ${item.text}`}
                        onClick={() =>
                          onUpdate(application.id, (app) =>
                            deleteChecklistItem(app, item.id),
                          )
                        }
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Activity Log</h3>
              <form onSubmit={handleAddLog} className="input-action">
                <input
                  type="text"
                  placeholder="Tambah catatan manual Kapten..."
                  aria-label="Tambah catatan aktivitas"
                  value={logText}
                  onChange={(event) => setLogText(event.target.value)}
                />
                <button type="submit" className="button secondary">
                  Catat
                </button>
              </form>
              {logError && (
                <p className="field-error" role="alert">
                  {logError}
                </p>
              )}

              <ul className="activity-logs">
                {application.activityLogs.map((log) => (
                  <li key={log.id}>
                    <span className="small">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </span>
                    <p>{log.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "interview" && (
          <div className="modal-body">
            <InterviewPrepTimer />
          </div>
        )}
      </div>
    </div>
  );
}
