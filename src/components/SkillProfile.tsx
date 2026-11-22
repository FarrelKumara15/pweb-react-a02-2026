import { useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { normalize } from "../utils/application";

export function SkillProfile({
  skills,
  setSkills,
}: {
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  function addSkill(event: FormEvent) {
    event.preventDefault();
    const skill = input.trim();
    if (!skill || skills.some((item) => normalize(item) === normalize(skill))) {
      setError(
        !skill ? "Nama skill wajib diisi." : "Skill tersebut sudah ada.",
      );
      inputRef.current?.focus();
      return;
    }
    setSkills((current) => [...current, skill]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }
  return (
    <section className="panel profile">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PROFIL KAPTEN</p>
          <h2>Bekal untuk berangkat.</h2>
        </div>
        <span className="count">{skills.length} skill</span>
      </div>
      <p className="muted">
        Tambahkan kemampuanmu. Kecocokan lowongan akan mengikuti.
      </p>
      <div className="skill-list">
        {skills.map((skill) => (
          <span className="skill owned" key={skill}>
            {skill}
            <button
              type="button"
              aria-label={`Hapus skill ${skill}`}
              onClick={() =>
                setSkills((current) => current.filter((item) => item !== skill))
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {skills.length === 0 && (
        <p className="muted">Belum ada skill. Tambahkan skill pertamamu.</p>
      )}
      <form onSubmit={addSkill} noValidate>
        <label htmlFor="new-skill">Skill baru</label>
        <div className="input-action">
          <input
            id="new-skill"
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            placeholder="Contoh: Docker"
            aria-invalid={!!error}
            aria-describedby={error ? "skill-error" : undefined}
          />
          <button className="button primary" type="submit">
            Tambah skill
          </button>
        </div>
      </form>
      {error && (
        <p className="field-error" id="skill-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
