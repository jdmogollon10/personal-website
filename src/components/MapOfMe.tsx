"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { MAP_OF_ME } from "@/config/story";
import type { MapContent, MapItemId } from "@/lib/content";
import { MIAMI, VENEZUELA_BOUNDS, outlinePath, projector, type Bounds } from "@/lib/venezuela";
import Carousel from "./Carousel";

// Interactive "map of me" shown while the video is paused at the first stop.
// Everything is positioned in % of the video frame (this layer is sized to the frame
// by ScrollStory), so the lines stay attached to the character.

const ORDER: MapItemId[] = ["venezuela", "creative", "interests", "sports"];
const JOURNEY_BOUNDS: Bounds = { west: -82, east: -58.5, south: 0.4, north: 27.5 }; // Venezuela → Miami
const JOURNEY_W = 320;
const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

export default function MapOfMe({ map }: { map: MapContent }) {
  const [open, setOpen] = useState<MapItemId | null>(null);
  // Bubbles softly light up in turn until the visitor opens one; then they know.
  const [explored, setExplored] = useState(false);

  // Close when the visitor moves on (ScrollStory announces every glide) or presses Esc.
  useEffect(() => {
    const close = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("story:glide", close);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("story:glide", close);
      removeEventListener("keydown", onKey);
    };
  }, []);

  const { callouts, detail } = MAP_OF_ME;
  const toggle = (id: MapItemId) => {
    setExplored(true);
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
      >
        {open && (
          <div key={open} className="map-detail-inner">
            <button type="button" className="map-close" onClick={() => setOpen(null)} aria-label="Close">
              <span aria-hidden>×</span>
            </button>
            <Detail id={open} map={map} />
          </div>
        )}
      </section>
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

function Detail({ id, map }: { id: MapItemId; map: MapContent }) {
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
      {item.list && item.list.length > 0 && (
        <ul className="map-list">
          {item.list.map((l) => (
            <li key={l.title}>
              <span className="map-list-title">{l.title}</span>
              {l.html && <div className="map-list-body prose" dangerouslySetInnerHTML={{ __html: l.html }} />}
            </li>
          ))}
        </ul>
      )}
      {item.html && <div className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />}
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

