import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Application, NewApplication, WorkMode } from "../types";
import { sameApplication, uniqueSkills } from "../utils/application";

const initial = {
  company: "",
  role: "",
  workMode: "Remote" as WorkMode,
  status: "WISHLIST" as "WISHLIST" | "APPLIED",
  requiredSkills: "",
  cvVersion: "",
  appliedDate: "",
};
type Field =
  "company" | "role" | "requiredSkills" | "cvVersion" | "appliedDate";
type Errors = Partial<Record<Field, string>>;
export function ManualApplicationForm({
  applications,
  onAdd,
}: {
  applications: Application[];
  onAdd: (input: NewApplication) => boolean;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  const fieldRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  function update(field: keyof typeof initial, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors({});
    setNotice("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!form.company.trim()) next.company = "Perusahaan wajib diisi.";
    if (!form.role.trim()) next.role = "Posisi wajib diisi.";
    if (uniqueSkills(form.requiredSkills.split(",")).length === 0)
      next.requiredSkills = "Isi minimal satu required skill.";
    if (applications.some((app) => sameApplication(app, form)))
      next.company =
        "Perusahaan dan posisi ini sudah ada (atau sedang menunggu Undo).";
    if (form.status === "APPLIED") {
      if (!form.cvVersion.trim())
        next.cvVersion = "Versi CV wajib diisi untuk APPLIED.";
      if (!form.appliedDate || !Number.isFinite(Date.parse(form.appliedDate)))
        next.appliedDate = "Tanggal melamar wajib diisi dengan benar.";
    }
    setErrors(next);
    const first = (
      ["company", "role", "requiredSkills", "cvVersion", "appliedDate"] as const
    ).find((field) => next[field]);
    if (first) {
      fieldRefs.current[first]?.focus();
      return;
    }
    const added = onAdd({
      company: form.company,
      role: form.role,
      workMode: form.workMode,
      status: form.status,
      requiredSkills: uniqueSkills(form.requiredSkills.split(",")),
      ...(form.status === "APPLIED"
        ? { cvVersion: form.cvVersion.trim(), appliedDate: form.appliedDate }
        : {}),
    });
    if (!added) {
      setErrors({ company: "Lamaran yang sama sudah ada." });
      fieldRefs.current.company?.focus();
      return;
    }
    setForm(initial);
    setNotice("Lamaran berhasil ditambahkan.");
    fieldRefs.current.company?.focus();
  }
  function input(
    field: Field,
    label: string,
    placeholder: string,
    type = "text",
  ) {
    return (
      <div className="form-field">
        <label htmlFor={`manual-${field}`}>
          {label} <span aria-hidden="true">*</span>
        </label>
        <input
          id={`manual-${field}`}
          ref={(node) => {
            fieldRefs.current[field] = node;
          }}
          type={type}
          value={form[field]}
          onChange={(event) => update(field, event.target.value)}
          placeholder={placeholder}
          required
          aria-invalid={!!errors[field]}
          aria-describedby={errors[field] ? `error-${field}` : undefined}
        />
        {errors[field] && (
          <p className="field-error" id={`error-${field}`}>
            {errors[field]}
          </p>
        )}
      </div>
    );
  }
  return (
    <section className="panel manual-panel">
      <p className="eyebrow">PELUANG DARI TEMPAT LAIN?</p>
      <h2>Tambah lamaran manual</h2>
      <p className="muted">
        Simpan lowongan dari kampus, LinkedIn, atau temanmu.
      </p>
      <form onSubmit={submit} noValidate className="manual-form">
        {input("company", "Perusahaan", "Contoh: Nusantara Cloud")}
        {input("role", "Posisi / Role", "Contoh: Frontend Intern")}
        <div className="form-field">
          <label htmlFor="manual-mode">Mode kerja</label>
          <select
            id="manual-mode"
            value={form.workMode}
            onChange={(event) => update("workMode", event.target.value)}
          >
            {["Remote", "Hybrid", "Onsite"].map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="manual-status">Status awal</label>
          <select
            id="manual-status"
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option>WISHLIST</option>
            <option>APPLIED</option>
          </select>
        </div>
        <div className="full-width">
          {input(
            "requiredSkills",
            "Required skills (pisahkan dengan koma)",
            "React, TypeScript, CSS",
          )}
        </div>
        {form.status === "APPLIED" && (
          <>
            {input("cvVersion", "Versi CV", "Contoh: CV-Frontend-v2.pdf")}
            {input("appliedDate", "Tanggal melamar", "", "date")}
          </>
        )}
        <div className="form-footer full-width">
          <p className="muted">* Wajib diisi</p>
          <button className="button primary" type="submit">
            + Tambah lamaran
          </button>
        </div>
        {notice && (
          <p className="success-text full-width" role="status">
            {notice}
          </p>
        )}
      </form>
    </section>
  );
}
