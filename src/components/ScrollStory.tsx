"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { STORY, type Anchor } from "@/config/story";
import type { FrameManifest, StoryContent } from "@/lib/content";
import { buildTimeline, panelStateAt, timeAt } from "@/lib/timeline";
import GlassPanel from "./GlassPanel";

// Frames load coarse-to-fine: every 16th first so the whole video is scrubbable almost
// immediately, then the gaps fill in — nearest to the reader's position first.
const FIRST_PASS = 16;
const CONCURRENCY = 8;
const MARGIN = 24; // min px between a panel and the viewport edge
const DOCK_BELOW = 768; // px width below which panels dock to the bottom

const frameUrl = (base: string, i: number) => `${base}/${String(i + 1).padStart(4, "0")}.webp`;

const ANCHORS: Record<Anchor, [number, number]> = {
  "top-left": [0, 0], top: [0.5, 0], "top-right": [1, 0],
  left: [0, 0.5], center: [0.5, 0.5], right: [1, 0.5],
  "bottom-left": [0, 1], bottom: [0.5, 1], "bottom-right": [1, 1],
};

export default function ScrollStory({
  content,
  manifest,
}: {
  content: Record<string, StoryContent>;
  manifest: FrameManifest;
}) {
  const stops = useMemo(() => [...STORY.stops].sort((a, b) => a.time - b.time), []);
  const timeline = useMemo(() => buildTimeline(stops), [stops]);

  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const track = trackRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const portrait = innerWidth / innerHeight < 0.9;
    const set = portrait ? manifest.sets.mobile : manifest.sets.desktop;
    const lastFrame = Math.min(manifest.count - 1, Math.round(STORY.endTime * manifest.fps));
    const frames: (HTMLImageElement | null)[] = new Array(lastFrame + 1).fill(null);
    let cancelled = false;
    let drawn = -1;

    // ---- position ------------------------------------------------------------
    const progress = () => {
      const scrollable = track.offsetHeight - innerHeight;
      const y = Math.min(Math.max(scrollY - track.offsetTop, 0), scrollable);
      return scrollable > 0 ? (y / scrollable) * timeline.total : 0;
    };
    const frameAt = (p: number) => Math.min(lastFrame, Math.round(timeAt(timeline, p) * manifest.fps));

    // ---- loading -------------------------------------------------------------
    const pending = new Set<number>();
    const firstPass: number[] = [];
    for (let i = 0; i <= lastFrame; i++) {
      pending.add(i);
      if (i % FIRST_PASS === 0) firstPass.push(i);
    }
    if (!firstPass.includes(lastFrame)) firstPass.push(lastFrame);
    let firstDone = 0;

    const nextToLoad = () => {
      if (firstPass.length) return firstPass.shift()!;
      // Nearest pending frame to where the reader is, biased slightly ahead.
      const target = frameAt(progress()) + 6;
      let best = -1, bestD = Infinity;
      for (const i of pending) {
        const d = Math.abs(i - target);
        if (d < bestD) {
          best = i;
          bestD = d;
        }
      }
      return best;
    };

    const firstPassTotal = firstPass.length;
    const pump = () => {
      if (cancelled || pending.size === 0) return;
      const i = nextToLoad();
      if (i < 0) return;
      pending.delete(i);
      const isFirst = firstDone < firstPassTotal;
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(set.path, i);
      img
        .decode()
        .then(() => {
          if (cancelled) return;
          frames[i] = img;
          const cur = frameAt(progress());
          if (drawn === -1 || Math.abs(i - cur) < Math.abs(drawn - cur)) render(true);
        })
        .catch(() => {})
        .finally(() => {
          if (isFirst) {
            firstDone++;
            setLoaded(firstDone / firstPassTotal);
            if (firstDone === firstPassTotal) setReady(true);
          }
          pump();
        });
    };
    for (let k = 0; k < CONCURRENCY; k++) pump();

    // ---- drawing -------------------------------------------------------------
    const nearest = (i: number) => {
      for (let d = 0; d <= FIRST_PASS * 2; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    // The rectangle the frame occupies on screen (object-fit: cover), in CSS px.
    let cover = { x: 0, y: 0, w: innerWidth, h: innerHeight };

    function render(force = false) {
      const idx = nearest(frameAt(progress()));
      if (idx < 0 || (idx === drawn && !force)) return;
      const dpr = canvas.width / innerWidth;
      ctx.drawImage(frames[idx]!, cover.x * dpr, cover.y * dpr, cover.w * dpr, cover.h * dpr);
      drawn = idx;
    }

    // ---- panel placement -----------------------------------------------------
    const place = () => {
      const docked = innerWidth < DOCK_BELOW || portrait;
      stage.toggleAttribute("data-docked", docked);
      stops.forEach((stop, i) => {
        const slot = slotRefs.current[i];
        if (!slot) return;
        const maxW = innerWidth - MARGIN * 2;
        slot.style.width = `${Math.min(stop.panel.width, maxW)}px`;
        if (docked) {
          slot.style.left = slot.style.top = "";
          return;
        }
        const [ax, ay] = ANCHORS[stop.panel.anchor];
        const w = slot.offsetWidth, h = slot.offsetHeight;
        const px = cover.x + stop.panel.x * cover.w - ax * w;
        const py = cover.y + stop.panel.y * cover.h - ay * h;
        slot.style.left = `${Math.min(Math.max(px, MARGIN), innerWidth - w - MARGIN)}px`;
        slot.style.top = `${Math.min(Math.max(py, MARGIN), innerHeight - h - MARGIN)}px`;
      });
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      const scale = Math.max(innerWidth / set.width, innerHeight / set.height);
      const w = set.width * scale, h = set.height * scale;
      cover = { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2, w, h };
      place();
      render(true);
    };

    // ---- per-frame update ----------------------------------------------------
    const update = () => {
      const p = progress();
      render();

      timeline.windows.forEach((win, i) => {
        const el = panelRefs.current[i];
        const slot = slotRefs.current[i];
        if (!el || !slot) return;
        const { opacity, shift } = panelStateAt(win, p);
        el.style.opacity = String(opacity);
        el.style.transform = `translate3d(0, ${shift * 28}px, 0) scale(${0.985 + 0.015 * opacity})`;
        slot.style.visibility = opacity > 0.001 ? "visible" : "hidden";
      });

      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.3));

      // Top progress line: fills across the cinematic part, then fades as the
      // page leaves the pinned stage.
      if (barRef.current) {
        const past = scrollY - (track.offsetTop + track.offsetHeight - innerHeight);
        barRef.current.style.transform = `scaleX(${p / timeline.total})`;
        barRef.current.style.opacity = String(Math.max(0, Math.min(1, 1 - past / (innerHeight * 0.5))));
      }
    };

    const lenis = reduceMotion ? null : new Lenis({ lerp: 0.08, wheelMultiplier: 0.85 });
    let raf = 0;
    const loop = (time: number) => {
      lenis?.raf(time);
      update();
      raf = requestAnimationFrame(loop);
    };
    resize();
    raf = requestAnimationFrame(loop);
    addEventListener("resize", resize);
    document.fonts?.ready.then(place);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      lenis?.destroy();
    };
  }, [manifest, timeline, stops]);

  return (
    <>
      <div className="progress-line" aria-hidden>
        <div ref={barRef} />
      </div>

      <section
        ref={trackRef}
        className="story"
        style={{ height: `calc(${timeline.total * 100}lvh + 100lvh)` }}
        aria-label="Story"
      >
        <div ref={stageRef} className="story-stage">
          <canvas ref={canvasRef} className="story-canvas" aria-hidden />
          <div className="story-vignette" aria-hidden />

          <div ref={cueRef} className="intro-cue" aria-hidden>
            <span /> Scroll
          </div>

          {stops.map((stop, i) => {
            const c = content[stop.id];
            return (
              <div
                key={stop.id}
                id={stop.id}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                className="panel-slot"
                style={{ visibility: "hidden" }}
              >
                <div
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  className="panel-motion"
                  style={{ opacity: 0 }}
                >
                  <GlassPanel className={stop.hero ? "glass--hero" : ""}>
                    {c ? <PanelContent c={c} hero={stop.hero} /> : <p className="panel-missing">Missing content/story/{stop.id}.md</p>}
                  </GlassPanel>
                </div>
              </div>
            );
          })}

          <div className={`loader ${ready ? "loader--done" : ""}`} aria-hidden>
            <div className="loader-track">
              <div style={{ transform: `scaleX(${loaded})` }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PanelContent({ c, hero }: { c: StoryContent; hero?: boolean }) {
  const Title = hero ? "h1" : "h2";
  return (
    <>
      {c.eyebrow && <p className="panel-eyebrow">{c.eyebrow}</p>}
      <Title className={hero ? "panel-title panel-title--hero" : "panel-title"}>{c.title}</Title>
      {c.subtitle && <p className="panel-subtitle">{c.subtitle}</p>}
      <div className="prose" dangerouslySetInnerHTML={{ __html: c.html }} />
      {c.links.length > 0 && (
        <div className="panel-links">
          {c.links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="pill" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
              {l.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      )}
      {hero && (
        <p className="panel-cue" aria-hidden>
          <span /> Scroll to begin
        </p>
      )}
    </>
  );
}
