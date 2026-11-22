import { useState } from "react";
import type { Application, NewApplication } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useUndoDelete } from "./hooks/useUndoDelete";
import { applicationArray, stringArray } from "./utils/validation";
import { createApplication, sameApplication } from "./utils/application";
import { Dashboard } from "./components/Dashboard";
import { SkillProfile } from "./components/SkillProfile";
import { JobExplorer } from "./components/JobExplorer";
import { ManualApplicationForm } from "./components/ManualApplicationForm";
import { ApplicationList } from "./components/ApplicationList";
import { OfferComparator } from "./components/OfferComparator";
import "./App.css";

export default function App() {
  const [applications, setApplications, applicationError] = useLocalStorage<
    Application[]
  >("applications", [], applicationArray);
  const [kaptenSkills, setKaptenSkills, skillError] = useLocalStorage<string[]>(
    "kaptenSkills",
    ["React", "TypeScript", "CSS"],
    stringArray,
  );
  const [tab, setTab] = useState<"explore" | "applications" | "offers">(
    "explore",
  );
  const { pending, remove, undo } = useUndoDelete(
    applications,
    setApplications,
  );
  // Reserve the deleted pair during the Undo window to prevent conflicting re-adds.
  const reservedApplications = pending
    ? [...applications, pending.application]
    : applications;
  function addApplication(input: NewApplication) {
    if (reservedApplications.some((app) => sameApplication(app, input)))
      return false;
    const application = createApplication(input);
    setApplications((current) =>
      current.some((app) => sameApplication(app, input))
        ? current
        : [application, ...current],
    );
    return true;
  }
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand" aria-label="Aku Mw Magang beranda">
            <span className="brand-icon" aria-hidden="true">
              a<span>↗</span>
            </span>
            <span>
              aku mw<span className="brand-light"> magang.</span>
            </span>
          </a>
          <span className="header-note">A little progress, every day.</span>
          <div className="avatar" aria-label="Profil Kapten">
            K
          </div>
        </div>
      </header>
      <main>
        <div className="hero">
          <div>
            <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>
              Halo, Kapten <span className="wave">✦</span>
              <br />
              Siap temukan tempatmu?
            </h1>
            <p>Rapikan langkah kecilmu menuju magang pertama.</p>
          </div>
          <div className="hero-note">
            <span className="orbit" aria-hidden="true">
              ↗
            </span>
            <p>
              Small steps.
              <br />
              <strong>Big possibilities.</strong>
            </p>
            <span className="small">Satu lamaran lebih dekat.</span>
          </div>
        </div>
        {(applicationError || skillError) && (
          <div className="alert" role="alert">
            {applicationError} {skillError}
          </div>
        )}
        <Dashboard applications={applications} />
        <nav className="tabs" aria-label="Halaman utama">
          <button
            className={tab === "explore" ? "active" : ""}
            aria-current={tab === "explore" ? "page" : undefined}
            onClick={() => setTab("explore")}
          >
            Eksplorasi lowongan
          </button>
          <button
            className={tab === "applications" ? "active" : ""}
            aria-current={tab === "applications" ? "page" : undefined}
            onClick={() => setTab("applications")}
          >
            Lamaran saya <span>{applications.length}</span>
          </button>
          <button
            className={tab === "offers" ? "active" : ""}
            aria-current={tab === "offers" ? "page" : undefined}
            onClick={() => setTab("offers")}
          >
            Offer Comparator
          </button>
        </nav>
        {tab === "explore" && (
          <>
            <SkillProfile skills={kaptenSkills} setSkills={setKaptenSkills} />
            <JobExplorer
              skills={kaptenSkills}
              applications={reservedApplications}
              onAdd={addApplication}
            />
          </>
        )}
        {tab === "applications" && (
          <>
            <ManualApplicationForm
              applications={reservedApplications}
              onAdd={addApplication}
            />
            <ApplicationList
              applications={applications}
              skills={kaptenSkills}
              onDelete={remove}
            />
          </>
        )}
        {tab === "offers" && (
          <OfferComparator applications={applications} skills={kaptenSkills} />
        )}
      </main>
      <footer>
        <span>aku mw magang.</span>
        <span>Dibuat untuk perjalananmu, Kapten.</span>
      </footer>
      {pending && (
        <div className="undo-toast" role="status">
          <div>
            <strong>Lamaran dihapus</strong>
            <p>
              {pending.application.company} · Bisa dibatalkan selama 5 detik
            </p>
          </div>
          <button className="button" onClick={undo}>
            Undo
          </button>
        </div>
      )}
    </>
  );
}
