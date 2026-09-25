import type { MoreSection, Site } from "@/lib/content";

const external = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});

// "01-selected-work" → "selected-work", so links like #contact work.
const anchor = (id: string) => id.replace(/^\d+-/, "");

export default function MoreSections({ sections, site }: { sections: MoreSection[]; site: Site }) {
  return (
    <div className="more">
      {sections.map((s) => (
        <section key={s.id} id={anchor(s.id)} className="more-section">
          {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
          <h2 className="more-title">{s.title}</h2>
          {s.html && <div className="prose prose--wide" dangerouslySetInnerHTML={{ __html: s.html }} />}

          {s.type === "links" && (
            <ul className="cards">
              {s.items.map((item, i) => (
                <li key={i}>
                  <a className="card" href={item.href} {...external(item.href)}>
                    {item.tag && <span className="card-tag">{item.tag}</span>}
                    <span className="card-label">{item.label}</span>
                    {item.note && <span className="card-note">{item.note}</span>}
                    <span className="card-arrow" aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {s.type === "contact" && (
            <div className="contact">
              {site.email && (
                <a className="contact-email" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              )}
              <ul className="contact-socials">
                {site.socials.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} {...external(l.href)}>
                      {l.label} <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      <footer className="footer">
        <p>© {new Date().getFullYear()} {site.name}</p>
      </footer>
    </div>
  );
}
