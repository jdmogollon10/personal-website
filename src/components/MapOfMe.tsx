"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MAP_OF_ME } from "@/config/story";
import type { MapContent, MapItemId, MapProject } from "@/lib/content";
import { MIAMI, VENEZUELA_BOUNDS, outlinePath, projector, type Bounds } from "@/lib/venezuela";
import Carousel from "./Carousel";

// Interactive "map of me" shown while the video is paused at the first stop.
// Everything is positioned in % of the video frame (this layer is sized to the frame
// by ScrollStory), so the lines stay attached to the character.

const ORDER: MapItemId[] = ["venezuela", "creative", "entrepreneurship", "investing", "interests", "sports"];

type Zoom = { src: string; alt: string } | null;
const JOURNEY_BOUNDS: Bounds = { west: -82, east: -58.5, south: 0.4, north: 27.5 }; // Venezuela → Miami
const JOURNEY_W = 320;
const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

export default function MapOfMe({ map }: { map: MapContent }) {
  const [open, setOpen] = useState<MapItemId | null>(null);
  // Bubbles softly light up in turn until the visitor opens one; then they know.
  const [explored, setExplored] = useState(false);
  // Enlarged screenshot (Entrepreneurship). Esc closes it first, then the panel.
  const [zoom, setZoom] = useState<Zoom>(null);
  const zoomRef = useRef<Zoom>(null);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Close when the visitor moves on (ScrollStory announces every glide) or presses Esc.
  useEffect(() => {
    const close = () => {
      setZoom(null);
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomRef.current) setZoom(null);
      else setOpen(null);
    };
    addEventListener("story:glide", close);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("story:glide", close);
      removeEventListener("keydown", onKey);
    };
  }, []);

  // Hold the story still while a panel is open; release it when it closes.
  useEffect(() => {
    if (!open) return;
    dispatchEvent(new Event("story:lock"));
    return () => {
      dispatchEvent(new Event("story:unlock"));
    };
  }, [open]);

  const { callouts, detail } = MAP_OF_ME;
  const toggle = (id: MapItemId) => {
    setExplored(true);
    setZoom(null);
    setOpen((cur) => (cur === id ? null : id));
  };

  return (
    <div className={`map ${explored ? "is-explored" : ""}`} data-open={open ?? undefined}>
      <svg className="map-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
        {ORDER.map((id) => (
          <line
            key={id}
            data-id={id}
            className={open && open !== id ? "is-dim" : open === id ? "is-active" : ""}
            x1={callouts[id].from.x * 1000}
            y1={callouts[id].from.y * 1000}
            x2={callouts[id].to.x * 1000}
            y2={callouts[id].to.y * 1000}
            pathLength={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {ORDER.map((id) => (
        <span
          key={id}
          className={`map-node ${open === id ? "is-active" : ""} ${open && open !== id ? "is-dim" : ""}`}
          style={{ left: pct(callouts[id].from.x), top: pct(callouts[id].from.y) }}
          aria-hidden
        />
      ))}

      <div className="map-callouts" role="group" aria-label="About me">
        {ORDER.map((id, i) => {
          const c = callouts[id];
          return (
            <button
              key={id}
              type="button"
              className={`map-callout map-callout--${c.side} ${open && open !== id ? "is-dim" : ""} ${open === id ? "is-active" : ""}`}
              style={{ left: pct(c.to.x), top: pct(c.to.y), "--i": i } as CSSProperties}
              aria-expanded={open === id}
              aria-controls="map-detail"
              onClick={() => toggle(id)}
            >
              <span className="map-port" aria-hidden />
              <span className="map-chip">
                <Cue id={id} map={map} />
                <span className="map-label">{map.items[id].label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {map.intro && (
        <div
          className={`map-intro ${open ? "is-hidden" : ""}`}
          style={{ "--dx": pct(detail.x), "--dy": pct(detail.y), "--dw": pct(detail.w), "--dh": pct(detail.h) } as CSSProperties}
          aria-hidden={!!open}
        >
          <p className="map-intro-heading">{map.intro.heading}</p>
          <p className="map-intro-text">{map.intro.text}</p>
        </div>
      )}

      <section
        id="map-detail"
        className={`map-detail glass ${open ? `is-open map-detail--${open}` : ""}`}
        style={
          {
            "--dx": pct(detail.x),
            "--dy": pct(detail.y),
            "--dw": pct(detail.w),
            "--dh": pct(detail.h),
          } as CSSProperties
        }
        aria-hidden={!open}
        aria-live="polite"
        data-no-story-swipe
      >
        {open && (
          <div key={open} className="map-detail-inner">
            <button type="button" className="map-close" onClick={() => setOpen(null)} aria-label="Close">
              <span aria-hidden>×</span>
            </button>
            <Detail id={open} map={map} onZoom={setZoom} />
          </div>
        )}
      </section>

      {zoom && (
        <div className="map-zoom" onClick={() => setZoom(null)} data-no-story-swipe role="dialog" aria-label={zoom.alt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.src} alt={zoom.alt} />
          <button type="button" className="map-close map-zoom-close" onClick={() => setZoom(null)} aria-label="Close enlarged image">
            <span aria-hidden>×</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Every bubble leads with the same glowing dot; Venezuela also shows its outline.
function Cue({ id, map }: { id: MapItemId; map: MapContent }) {
  return (
    <>
      <span className="cue-dot" aria-hidden />
      {id === "venezuela" && <VenezuelaMini hometown={map.hometown} />}
    </>
  );
}

function VenezuelaMini({ hometown }: { hometown: MapContent["hometown"] }) {
  const { project, height } = useMemo(() => projector(VENEZUELA_BOUNDS, 40), []);
  const [hx, hy] = project([hometown.lon, hometown.lat]);
  return (
    <svg className="cue-map" viewBox={`0 0 40 ${height.toFixed(1)}`} aria-hidden>
      <path d={outlinePath(project)} />
      <circle cx={hx} cy={hy} r={2.2} />
    </svg>
  );
}

function Detail({ id, map, onZoom }: { id: MapItemId; map: MapContent; onZoom: (z: Zoom) => void }) {
  const item = map.items[id];
  return (
    <>
      {/* Label as eyebrow only when it adds something beyond the title */}
      {item.label !== item.title && <p className="panel-eyebrow">{item.label}</p>}
      {item.title && <h2 className="panel-title">{item.title}</h2>}
      {id === "venezuela" && <Journey map={map} />}
      {id === "sports" && item.photos && <Carousel photos={item.photos} label={`${item.label} photos`} />}
      {id === "sports" && item.activities && item.activities.length > 0 && (
        <ul className="map-activities" aria-label="Activities">
          {item.activities.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      {item.projects && item.projects.length > 0 && <Projects projects={item.projects} onZoom={onZoom} />}
      {item.visual === "payoff" && <PayoffSketch tags={item.tags} />}
      {item.html && <div className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />}
      {/* List: the main content (Creative) or smaller supporting items beneath a story */}
      {item.list && item.list.some((l) => l.icon) && (
        <ul className="map-tiles">
          {item.list.map((l) => (
            <li key={l.title}>
              <TileIcon name={l.icon} />
              <span className="map-list-title">{l.title}</span>
              {l.html && <div className="map-list-body prose" dangerouslySetInnerHTML={{ __html: l.html }} />}
            </li>
          ))}
        </ul>
      )}
      {item.list && item.list.length > 0 && !item.list.some((l) => l.icon) && (
        <ul className={`map-list ${item.html ? "map-list--supporting" : ""}`}>
          {item.list.map((l) => (
            <li key={l.title}>
              <span className="map-list-title">{l.title}</span>
              {l.html && <div className="map-list-body prose" dangerouslySetInnerHTML={{ __html: l.html }} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Venezuela with the hometown dot, and a route arcing north to Miami.
function Journey({ map }: { map: MapContent }) {
  const W = JOURNEY_W;
  const { project, height } = useMemo(() => projector(JOURNEY_BOUNDS, W), [W]);
  const [hx, hy] = project([map.hometown.lon, map.hometown.lat]);
  const [mx, my] = project(MIAMI);
  const cx = (hx + mx) / 2 + 40, cy = Math.min(hy, my) + (Math.abs(hy - my) * 0.35);
  return (
    <svg className="map-journey" viewBox={`0 0 ${W} ${height.toFixed(1)}`} role="img" aria-label={`Route from ${map.hometown.label || "Venezuela"} to ${map.destination.label}`}>
      <path className="j-country" d={outlinePath(project)} />
      <path className="j-route" d={`M${hx} ${hy} Q${cx} ${cy} ${mx} ${my}`} pathLength={1} />
      <circle className="j-dot" cx={hx} cy={hy} r={3.5} />
      <circle className="j-dot j-dot--dest" cx={mx} cy={my} r={3.5} />
      {map.hometown.label && (
        // Below-right of the dot, inside the country: clear of the coastline and the route.
        <text x={hx + 5} y={hy + 13} className="j-label">
          {map.hometown.label}
        </text>
      )}
      <text x={mx + 8} y={my + 4} className="j-label">
        {map.destination.label}
      </text>
    </svg>
  );
}

// Decorative options sketch for Interests: a call's payoff at expiry (the hockey stick),
// its value before expiry (the curve time decay pulls toward the payoff), and a
// probability distribution for the underlying price. Illustrative only, no real data.
function PayoffSketch({ tags }: { tags?: string[] }) {
  const W = 300, H = 120, K = 150, base = 80;
  const bell = Array.from({ length: 61 }, (_, i) => {
    const x = i * 5;
    const y = H - 8 - 30 * Math.exp(-((x - K) ** 2) / (2 * 48 ** 2));
    return `${i ? "L" : "M"}${x} ${y.toFixed(1)}`;
  }).join(" ");
  const before = Array.from({ length: 61 }, (_, i) => {
    const x = i * 5;
    const v = 24 * Math.log(1 + Math.exp((x - K) / 24)); // smooth version of max(0, x − K)
    return `${i ? "L" : "M"}${x} ${(base + 8 - v * 0.55).toFixed(1)}`;
  }).join(" ");
  return (
    <figure className="payoff" aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <path className="payoff-bell" d={`${bell} L${W} ${H - 8} L0 ${H - 8} Z`} />
        <line className="payoff-axis" x1="0" y1={base} x2={W} y2={base} />
        <line className="payoff-strike" x1={K} y1="10" x2={K} y2={H - 8} />
        <path className="payoff-before" d={before} />
        <path className="payoff-expiry" d={`M0 ${base + 8} L${K} ${base + 8} L${W} ${base + 8 - (W - K) * 0.55}`} />
        <text x={K + 5} y="18" className="payoff-label">strike</text>
        <text x={W - 2} y={base - 6} textAnchor="end" className="payoff-label">price →</text>
      </svg>
      {tags && tags.length > 0 && (
        <figcaption className="payoff-tags">
          {tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

// Entrepreneurship: one project at a time behind small numbered tabs, so three projects
// (two with screenshots) stay easy to browse without a very long panel.
function Projects({ projects, onZoom }: { projects: MapProject[]; onZoom: (z: Zoom) => void }) {
  const [i, setI] = useState(0);
  const p = projects[Math.min(i, projects.length - 1)];
  // Landscape screenshots sit full-width above the text; portrait ones sit beside it.
  // Proportions are read from the images themselves (preloaded when the panel opens).
  const [ratios, setRatios] = useState<Record<string, number>>({});
  useEffect(() => {
    for (const q of projects) {
      if (!q.image) continue;
      const img = new Image();
      img.onload = () => setRatios((r) => ({ ...r, [q.image!]: img.naturalWidth / img.naturalHeight }));
      img.src = q.image;
    }
  }, [projects]);
  const wide = !!p.image && (ratios[p.image] ?? 0) > 1;
  return (
    <div className="map-projects">
      <div className="map-project-tabs" role="tablist" aria-label="Projects">
        {projects.map((q, k) => (
          <button
            key={q.title}
            type="button"
            role="tab"
            aria-selected={k === i}
            className={k === i ? "is-current" : ""}
            onClick={() => setI(k)}
          >
            <span className="map-project-num">{String(k + 1).padStart(2, "0")}</span> {q.tab ?? q.title}
          </button>
        ))}
      </div>
      <article key={p.title} className={`map-project ${p.image ? (wide ? "map-project--wide" : "map-project--image") : ""}`} role="tabpanel">
        {p.image && (
          <button type="button" className="map-project-shot" onClick={() => onZoom({ src: p.image!, alt: p.imageAlt ?? p.title })} aria-label={`Enlarge: ${p.imageAlt ?? p.title}`}>
            {/* Shown whole: natural proportions, never cropped or stretched */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="map-project-img" src={p.image} alt={p.imageAlt ?? ""} />
            <span className="map-project-zoom" aria-hidden>Enlarge</span>
          </button>
        )}
        <div className="map-project-text">
          <h3 className="map-project-title">
            {p.title}
            {p.subtitle && <span className="map-project-sub"> — {p.subtitle}</span>}
          </h3>
          {p.facts && p.facts.length > 0 && (
            <ul className="map-project-facts">
              {p.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: p.html }} />
        </div>
      </article>
    </div>
  );
}

// Small line icons for the Interests tiles.
function TileIcon({ name }: { name?: string }) {
  const common = { className: "tile-icon", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (name) {
    case "tennis":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M5.2 7.2c3.2 1.6 3.2 8 0 9.6M18.8 7.2c-3.2 1.6-3.2 8 0 9.6" />
        </svg>
      );
    case "podcast":
      return (
        <svg {...common}>
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <rect x="3" y="13.5" width="4" height="6" rx="1.5" />
          <rect x="17" y="13.5" width="4" height="6" rx="1.5" />
        </svg>
      );
    case "screen":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
          <path d="M9 20h6M12 16.5V20" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" opacity="0.6" />
        </svg>
      );
    default:
      return <span className="cue-dot" aria-hidden />;
  }
}

