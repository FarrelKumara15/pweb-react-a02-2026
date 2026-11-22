import { useState } from "react";
import type { Application } from "../types";
import { offerScore, rupiah } from "../utils/application";

export function OfferComparator({
  applications,
  skills,
}: {
  applications: Application[];
  skills: string[];
}) {
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const offers = applications.filter((app) => app.status === "OFFER");
  const a = offers.find((app) => app.id === selectedA) ?? offers[0];
  const b =
    offers.find((app) => app.id === selectedB && app.id !== a?.id) ??
    offers.find((app) => app.id !== a?.id);
  const hasPair = a && b;
  return (
    <section className="panel comparator">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PILIH LANGKAH BERIKUTNYA</p>
          <h2>Offer Comparator</h2>
        </div>
        <span className="status-pill">50 / 25 / 25</span>
      </div>
      <p className="muted">
        Bandingkan dua tawaran dengan prioritas yang seimbang.
      </p>
      {!hasPair ? (
        <div className="empty comparator-empty">
          <span className="empty-symbol" aria-hidden="true">
            ⇄
          </span>
          <h3>Dua tawaran, satu keputusan.</h3>
          <p>
            Butuh minimal 2 lamaran berstatus OFFER untuk membandingkan.
            <br />
            Saat ini kamu memiliki {offers.length} offer.
          </p>
        </div>
      ) : (
        (() => {
          const scoreA = offerScore(a, b, skills),
            scoreB = offerScore(b, a, skills);
          const tied = Math.abs(scoreA.total - scoreB.total) < 0.000001;
          return (
            <>
              <div className="compare-grid">
                {[
                  {
                    label: "Offer A",
                    offer: a,
                    score: scoreA,
                    other: b,
                    setter: setSelectedA,
                  },
                  {
                    label: "Offer B",
                    offer: b,
                    score: scoreB,
                    other: a,
                    setter: setSelectedB,
                  },
                ].map(({ label, offer, score, other, setter }) => {
                  const best =
                    tied ||
                    score.total > offerScore(other, offer, skills).total;
                  return (
                    <article
                      className={`offer-card ${best ? "recommended" : ""}`}
                      key={label}
                    >
                      <label htmlFor={label.replace(" ", "-")}>{label}</label>
                      <select
                        id={label.replace(" ", "-")}
                        value={offer.id}
                        onChange={(event) => setter(event.target.value)}
                      >
                        {offers.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={item.id === other.id}
                          >
                            {item.company} · {item.role}
                          </option>
                        ))}
                      </select>
                      <h3>{offer.company}</h3>
                      <p className="muted">{offer.role}</p>
                      <dl>
                        <div>
                          <dt>Gaji / uang saku</dt>
                          <dd>{rupiah(offer.salaryOffer ?? 0)}</dd>
                        </div>
                        <div>
                          <dt>Mode kerja</dt>
                          <dd>
                            {offer.workMode}{" "}
                            <small>({score.modeScore}/100)</small>
                          </dd>
                        </div>
                        <div>
                          <dt>Skill Match</dt>
                          <dd>{score.match}%</dd>
                        </div>
                        <div>
                          <dt>Normalisasi gaji</dt>
                          <dd>{score.normalizedSalary.toFixed(1)}%</dd>
                        </div>
                      </dl>
                      <div className="score-total">
                        <span>Total skor</span>
                        <strong>
                          {score.total.toFixed(2)}
                          <small>/100</small>
                        </strong>
                      </div>
                      {best && (
                        <span className="recommendation">
                          ✦ Rekomendasi Terbaik{tied ? " · Skor seri" : ""}
                        </span>
                      )}
                    </article>
                  );
                })}
              </div>
              <p className="formula">
                Skor = (gaji ÷ gaji tertinggi dari dua offer × 100 × 50%) +
                (skor mode × 25%) + (skill match × 25%). Remote 100 · Hybrid 75
                · Onsite 50. Skor seri memberi rekomendasi pada keduanya.
              </p>
            </>
          );
        })()
      )}
    </section>
  );
}
