import { useState } from "react";
import type { Application, DataSource, NewApplication } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { useJobs } from "../hooks/useJobs";
import {
  inferWorkMode,
  normalize,
  sameApplication,
  skillMatch,
} from "../utils/application";
import { MatchBadge } from "./MatchBadge";

interface Props {
  skills: string[];
  applications: Application[];
  onAdd: (input: NewApplication) => boolean;
}
export function JobExplorer({ skills, applications, onAdd }: Props) {
  const [source, setSource] = useState<DataSource>("live");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [notice, setNotice] = useState("");
  const search = useDebounce(keyword, 400);
  const { state, retry } = useJobs(source);
  const jobs =
    state.status === "success"
      ? state.jobs
      : state.status === "error"
        ? (state.fallbackJobs ?? [])
        : [];
  const categories = [...new Set(jobs.map((job) => job.category))].sort();
  const visible = jobs
    .filter(
      (job) =>
        (!category || job.category === category) &&
        normalize(
          `${job.title} ${job.company_name} ${job.tags.join(" ")}`,
        ).includes(normalize(search)),
    )
    .map((job) => ({ job, match: skillMatch(job.tags, skills) }))
    .sort(
      (a, b) =>
        b.match.score - a.match.score || a.job.title.localeCompare(b.job.title),
    );
  return (
    <section aria-labelledby="explore-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TEMUKAN PELUANGMU</p>
          <h2 id="explore-heading">Eksplorasi lowongan</h2>
        </div>
        <span className="muted">Urutan: match tertinggi ↓</span>
      </div>
      <div className="toolbar panel">
        <div className="search-field">
          <label htmlFor="job-search">Cari lowongan</label>
          <input
            id="job-search"
            placeholder="Posisi, perusahaan, atau skill…"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="job-category">Kategori</label>
          <select
            id="job-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Semua kategori</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-source">Sumber lowongan</label>
          <select
            id="job-source"
            value={source}
            onChange={(event) => {
              setSource(event.target.value as DataSource);
              setCategory("");
            }}
          >
            <option value="live">Remotive · Live API</option>
            <option value="local">Fallback Lokal · 15 lowongan</option>
          </select>
        </div>
        <button className="button secondary" onClick={retry}>
          Muat ulang
        </button>
      </div>
      {state.status === "loading" && (
        <div className="empty" role="status">
          <span className="spinner" />
          Memuat peluang baru…
        </div>
      )}
      {state.status === "error" && (
        <div className="alert" role="alert">
          <strong>
            Lowongan {source === "live" ? "live" : "lokal"} gagal dimuat.
          </strong>
          <p>
            {state.message}{" "}
            {state.fallbackJobs
              ? "Data fallback lokal ditampilkan otomatis."
              : "Periksa koneksi atau gunakan sumber lokal."}
          </p>
          <div className="actions">
            <button className="button secondary" onClick={retry}>
              Coba Lagi
            </button>
            <button
              className="button primary"
              onClick={() => {
                setSource("local");
                setCategory("");
                if (source === "local") retry();
              }}
            >
              Fallback Lokal
            </button>
          </div>
        </div>
      )}
      <p className="result-info" aria-live="polite">
        {state.status !== "loading" &&
          `${visible.length} lowongan · ${source === "local" || (state.status === "error" && state.fallbackJobs) ? "Data contoh lokal" : "Remotive"}`}
        {search !== keyword && " · Menunggu pencarian…"}
      </p>
      <p className="sr-only" role="status">
        {notice}
      </p>
      {state.status !== "loading" &&
        (state.status === "success" || state.fallbackJobs !== null) &&
        visible.length === 0 && (
          <div className="empty">
            <h3>Belum ada lowongan yang cocok.</h3>
            <p>Coba kata kunci lain atau ubah kategori.</p>
          </div>
        )}
      <div className="job-grid">
        {visible.map(({ job, match }) => {
          const saved = applications.some((app) =>
            sameApplication(app, {
              company: job.company_name,
              role: job.title,
            }),
          );
          return (
            <article className="panel job-card" key={job.id}>
              <div className="card-top">
                <span className="company-mark" aria-hidden="true">
                  {job.company_name.slice(0, 2).toUpperCase()}
                </span>
                <MatchBadge score={match.score} />
              </div>
              <p className="company-name">{job.company_name}</p>
              <h3>{job.title}</h3>
              <p className="location">{job.candidate_required_location}</p>
              <p className="salary">{job.salary || "Gaji belum dicantumkan"}</p>
              <p className="category-label">{job.category}</p>
              <div className="skill-list">
                {match.matched.map((skill) => (
                  <span className="skill owned" key={skill}>
                    ✓ {skill}
                  </span>
                ))}
                {match.missing.map((skill) => (
                  <span className="skill missing" key={skill}>
                    + {skill}
                  </span>
                ))}
              </div>
              <p className="skill-note">
                {job.tags.length
                  ? `${match.matched.length} cocok · ${match.missing.length} perlu dipelajari`
                  : "Skill belum dicantumkan"}
              </p>
              <button
                className="button save"
                disabled={saved}
                onClick={() => {
                  const added = onAdd({
                    company: job.company_name,
                    role: job.title,
                    workMode: inferWorkMode(job.candidate_required_location),
                    status: "WISHLIST",
                    requiredSkills: job.tags,
                  });
                  setNotice(
                    added
                      ? `${job.title} berhasil disimpan ke Wishlist.`
                      : "Lamaran tersebut sudah ada.",
                  );
                }}
              >
                {saved ? "Sudah Dilamar" : "+ Simpan ke Wishlist"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
