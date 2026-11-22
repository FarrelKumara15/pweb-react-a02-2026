import type { Application } from "../types";
import { dashboardStats } from "../utils/application";
export function Dashboard({ applications }: { applications: Application[] }) {
  const stats = dashboardStats(applications);
  const cards = [
    {
      label: "Total Lamaran",
      value: stats.total,
      note: "Termasuk Wishlist",
      mark: "↗",
    },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      note: "Lamaran mendapat respons",
      mark: "↩",
    },
    {
      label: "Interview Rate",
      value: `${stats.interviewRate}%`,
      note: "Interview atau Offer",
      mark: "◷",
    },
    {
      label: "Rawan Ghosting",
      value: stats.ghosting,
      note: "Tidak berubah > 14 hari",
      mark: "◌",
    },
    {
      label: "Total Offer",
      value: stats.offers,
      note: "Peluang di depan mata",
      mark: "✦",
    },
  ];
  return (
    <section aria-label="Statistik lamaran">
      <div className="stats-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className="stat-top">
              <span>{card.label}</span>
              <span aria-hidden="true">{card.mark}</span>
            </div>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </div>
      <details className="metric-help">
        <summary>Cara menghitung statistik</summary>
        <p>
          Response Rate = jumlah SCREENING, INTERVIEW, OFFER, dan REJECTED ÷
          semua lamaran selain WISHLIST × 100%. Interview Rate = jumlah
          INTERVIEW dan OFFER ÷ semua lamaran selain WISHLIST × 100%. Persentase
          menggunakan status saat ini, dibulatkan ke bilangan bulat, dan
          bernilai 0% bila belum ada lamaran terkirim. Rawan Ghosting hanya
          menghitung APPLIED/SCREENING yang tidak diperbarui lebih dari 14 hari.
        </p>
      </details>
    </section>
  );
}
