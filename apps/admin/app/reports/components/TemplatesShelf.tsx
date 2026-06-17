import { MOCK_TEMPLATES } from "@manhaj/lib/mock-reports";

export default function TemplatesShelf() {
  return (
    <section className="rep-ts-card" aria-label="Templates shelf">
      <header className="rep-ts-head">
        <h3>Templates · 6 of 17 built-in</h3>
        <a href="#" className="rep-ts-link">See all →</a>
      </header>
      <div className="rep-ts-grid">
        {MOCK_TEMPLATES.map(t => (
          <article key={t.id} className="rep-ts-tile">
            <div className="rep-ts-icon" aria-hidden>{t.icon}</div>
            <div className="rep-ts-name">{t.name}</div>
            <div className="rep-ts-badge">{t.category}</div>
            <div className="rep-ts-meta">Last used {t.last_used} · {t.usage_count} uses</div>
          </article>
        ))}
      </div>
    </section>
  );
}
