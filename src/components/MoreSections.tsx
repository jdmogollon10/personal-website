import type { MoreSection, Site, StoryContent, WorkRef } from "@/lib/content";
import WorkCarousel, { type WorkCard } from "./WorkCarousel";
import BackToStart from "./BackToStart";

const external = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});

// "01-selected-work" → "selected-work", so links like #contact work.
const anchor = (id: string) => id.replace(/^\d+-/, "");

// A work card takes its title and preview from the project it points at in the story.
function resolveCards(items: WorkRef[], story: Record<string, StoryContent>): WorkCard[] {
  return items.flatMap((ref) => {
    const stop = story[ref.stop];
    const p = stop?.projects[ref.project - 1];
    if (!stop || !p) return [];
    return [{ title: ref.title ?? p.title, section: stop.title, image: p.image, imageAlt: p.imageAlt, workflow: p.workflow, stop: ref.stop, step: ref.project - 1 }];
  });
}

export default function MoreSections({
  sections,
  site,
  story,
}: {
  sections: MoreSection[];
  site: Site;
  story: Record<string, StoryContent>;
}) {
  return (
    <div className="more">
      {sections.map((s) => (
        <section key={s.id} id={anchor(s.id)} className="more-section">
          {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
          <h2 className="more-title">{s.title}</h2>
          {s.type === "about" ? (
            <div className="about">
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="about-photo" src={s.image} alt={s.imageAlt} width={900} height={1200} loading="lazy" />
              )}
              <div className="prose prose--wide about-text" dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          ) : (
            s.html && <div className="prose prose--wide" dangerouslySetInnerHTML={{ __html: s.html }} />
          )}

          {s.type === "work" && <WorkCarousel cards={resolveCards(s.items, story)} label={s.title} />}

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
        <BackToStart />
      </footer>
    </div>
  );
}
