import { MOCK_TEMPLATES } from "@manhaj/lib/mock-reports";

type DbTemplate = { id: string; template_code: string; name_en: string; channel: string; tone: string | null; is_manhaj_default: boolean | null };

export default function TemplatesShelf({ templates }: { templates?: DbTemplate[] }) {
  if (templates && templates.length > 0) {
    return (
      <section className="rep-ts-card" aria-label="Templates shelf">
        <header className="rep-ts-head">
          <h3>Templates · {templates.length} active</h3>
          <a href="#" className="rep-ts-link">See all →</a>
        </header>
        <div className="rep-ts-grid">
          {templates.map(t => (
            <article key={t.id} className="rep-ts-tile">
              <div className="rep-ts-icon" aria-hidden>📄</div>
              <div className="rep-ts-name">{t.name_en}</div>
              <div className="rep-ts-badge">{t.channel}</div>
              <div className="rep-ts-meta">{t.tone ?? "—"}{t.is_manhaj_default ? " · built-in" : ""}</div>
            </article>
          ))}
        </div>
      </section>
    );
  }
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
