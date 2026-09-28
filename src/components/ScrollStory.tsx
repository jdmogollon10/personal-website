"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Lenis from "lenis";
import { STORY, type Anchor } from "@/config/story";
import type { FrameManifest, StoryContent } from "@/lib/content";
import { buildTimeline, easeInOutSine, panelStateAt, planGlide, restAt, stepAt, stepRests, timeAt } from "@/lib/timeline";
import GlassPanel from "./GlassPanel";
import MapOfMe from "./MapOfMe";
import StoryPhotos from "./StoryPhotos";
import ProjectShowcase from "./ProjectShowcase";
import TopicPicker from "./TopicPicker";

// Frames load coarse-to-fine: every 16th first so the whole video is scrubbable almost
// immediately, then the gaps fill in — nearest to the reader's position first.
const FIRST_PASS = 16;
const CONCURRENCY = 8;
const MARGIN = 24; // min px between a panel and the viewport edge
const MOBILE_MARGIN = 16;
const FEATHER = 64; // px of fade where a letterboxed mobile frame meets the black
const DOCK_BELOW = 768; // px width below which panels use phone placement

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
  // Stops whose content has `steps` (or several `projects` or `topics`) show them one scroll at a time
  // during their hold, while the video stays still.
  const stepCounts = useMemo(
    () => stops.map((s) => content[s.id]?.steps.length || content[s.id]?.projects.length || content[s.id]?.topics.length || 0),
    [stops, content],
  );

  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

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

    // The rectangle the frame occupies on screen, in CSS px.
    let cover = { x: 0, y: 0, w: innerWidth, h: innerHeight };

    function render(force = false) {
      const idx = nearest(frameAt(progress()));
      if (idx < 0 || (idx === drawn && !force)) return;
      const dpr = canvas.width / innerWidth;
      const { x, y, w, h } = cover;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[idx]!, x * dpr, y * dpr, w * dpr, h * dpr);
      // When the frame is shorter than the screen, feather its top and bottom edges
      // into the black above and below so there's no hard line.
      if (y > 0.5) {
        const f = Math.min(FEATHER, h / 4) * dpr;
        const top = ctx.createLinearGradient(0, y * dpr, 0, y * dpr + f);
        top.addColorStop(0, "#000");
        top.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = top;
        ctx.fillRect(0, y * dpr, canvas.width, f);
        const bottom = ctx.createLinearGradient(0, (y + h) * dpr - f, 0, (y + h) * dpr);
        bottom.addColorStop(0, "rgba(0,0,0,0)");
        bottom.addColorStop(1, "#000");
        ctx.fillStyle = bottom;
        ctx.fillRect(0, (y + h) * dpr - f, canvas.width, f);
      }
      drawn = idx;
    }

    // ---- panel placement -----------------------------------------------------
    // Desktop: `panel` in the 16:9 frame. Portrait: `mobile` in the 9:16 frame (full width
    // unless it sets one). Narrow landscape windows fall back to a bottom dock (CSS).
    const place = () => {
      const docked = innerWidth < DOCK_BELOW || portrait;
      const margin = docked ? MOBILE_MARGIN : MARGIN;
      stage.toggleAttribute("data-docked", docked);
      stops.forEach((stop, i) => {
        const slot = slotRefs.current[i];
        if (!slot) return;
        if (stop.feature) {
          // Feature layers cover the video frame itself (desktop) or the whole stage
          // (phones), and expose how much of the frame is cropped off-screen.
          const box = docked ? { x: 0, y: 0, w: innerWidth, h: innerHeight } : cover;
          Object.assign(slot.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
          slot.style.setProperty("--crop-l", `${Math.max(0, -box.x)}px`);
          slot.style.setProperty("--crop-r", `${Math.max(0, box.x + box.w - innerWidth)}px`);
          slot.style.setProperty("--crop-t", `${Math.max(0, -box.y)}px`);
          slot.style.setProperty("--crop-b", `${Math.max(0, box.y + box.h - innerHeight)}px`);
          slot.toggleAttribute("data-placed", true);
          return;
        }
        const spot = portrait ? stop.mobile : docked ? undefined : stop.panel;
        slot.toggleAttribute("data-placed", !!spot);
        // mobile.fill: the slot covers the whole screen (inside the margin) and the panel
        // lays itself out in it (e.g. a title at the top, its steps at the bottom).
        const fill = portrait && !!stop.mobile?.fill;
        slot.toggleAttribute("data-fill", fill);
        if (fill) {
          Object.assign(slot.style, {
            left: `${margin}px`,
            top: `${margin}px`,
            width: `${innerWidth - margin * 2}px`,
            height: `${innerHeight - margin * 2}px`,
          });
          return;
        }
        slot.style.height = "";
        if (!spot) {
          slot.style.left = slot.style.top = slot.style.width = "";
          return;
        }
        const maxW = innerWidth - margin * 2;
        // toX: measured from where the panel's left edge actually lands (after the margin),
        // so its right edge ends at the same spot in the frame. Never narrower than 320px.
        const toX = spot === stop.panel ? stop.panel.toX : undefined;
        const reach =
          toX !== undefined ? Math.max(320, cover.x + toX * cover.w - Math.max(cover.x + spot.x! * cover.w, margin)) : undefined;
        slot.style.width = `${Math.min(reach ?? spot.width ?? maxW, maxW)}px`;
        const [ax, ay] = ANCHORS[spot.anchor];
        const w = slot.offsetWidth, h = slot.offsetHeight;
        let px = cover.x + (spot.x ?? 0.5) * cover.w - ax * w;
        // alignTo: the panel's text starts exactly where that label group starts, as long as
        // the panel still fits on screen there (narrow windows keep the normal placement).
        const align = spot === stop.panel ? stop.labels?.[stop.panel.alignTo ?? ""] : undefined;
        const alignedX = align ? cover.x + align.x * cover.w - textInset(slot) : NaN;
        const aligned = alignedX >= margin && alignedX + w <= innerWidth - margin;
        if (aligned) px = alignedX;
        slot.toggleAttribute("data-aligned", aligned);
        const py = cover.y + spot.y * cover.h - ay * h;
        slot.style.left = `${Math.min(Math.max(px, margin), innerWidth - w - margin)}px`;
        slot.style.top = `${Math.min(Math.max(py, margin), innerHeight - h - margin)}px`;
      });
      // Labels are placed after their panel, since on phones they stack above it.
      stops.forEach((stop, i) => {
        const layer = labelRefs.current[i], slot = slotRefs.current[i];
        if (layer && slot) placeLabels(stop, layer, slot, docked, margin);
      });
    };

    // Distance from a panel's left edge to where its text starts (border + padding).
    const textInset = (slot: HTMLElement) => {
      const glass = slot.querySelector<HTMLElement>(".glass");
      return glass ? glass.clientLeft + parseFloat(getComputedStyle(glass).paddingLeft) : 0;
    };

    // Scene labels: each group sits at its spot in the frame; on phones / narrow windows
    // they stack together just above the text box.
    const placeLabels = (stop: (typeof stops)[number], layer: HTMLDivElement, slot: HTMLDivElement, docked: boolean, margin: number) => {
      layer.toggleAttribute("data-docked", docked);
      const groups = layer.querySelectorAll<HTMLElement>("[data-group]");
      if (docked) {
        // Phones: one centered stack at the top of the screen, under the scroll cue, well
        // clear of the text box at the bottom.
        layer.style.top = `${margin + 40}px`;
        groups.forEach((g) => (g.style.left = g.style.top = ""));
        return;
      }
      layer.style.top = "";
      groups.forEach((g) => {
        const spot = stop.labels?.[g.dataset.group!];
        if (!spot) return;
        const [ax, ay] = ANCHORS[spot.anchor];
        const w = g.offsetWidth, h = g.offsetHeight;
        // A group the panel aligns to follows the panel (which may have been nudged to fit).
        const px = stop.panel.alignTo === g.dataset.group && slot.hasAttribute("data-aligned") ? slot.offsetLeft + textInset(slot) : cover.x + spot.x * cover.w - ax * w;
        const py = cover.y + spot.y * cover.h - ay * h;
        g.style.left = `${Math.min(Math.max(px, margin), innerWidth - w - margin)}px`;
        g.style.top = `${Math.min(Math.max(py, margin), innerHeight - h - margin)}px`;
      });
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      // Desktop video fills the screen (cropping as needed). The mobile video is already
      // framed for phones, so it is never cropped sideways: it always spans the full
      // width, and any leftover height becomes black above/below.
      const scale = portrait ? innerWidth / set.width : Math.max(innerWidth / set.width, innerHeight / set.height);
      const w = set.width * scale, h = set.height * scale;
      cover = { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2, w, h };
      place();
      render(true);
    };

    // ---- per-frame update ----------------------------------------------------
    const update = () => {
      const p = progress();
      render();

      let resting = false; // a (non-hero) stop is fully showing
      timeline.windows.forEach((win, i) => {
        const el = panelRefs.current[i];
        const slot = slotRefs.current[i];
        if (!el || !slot) return;
        const { opacity, shift } = panelStateAt(win, p);
        el.style.setProperty("--panel-o", String(opacity));
        if (stops[i].feature) el.style.setProperty("--reveal", opacity.toFixed(3)); // draws the map lines
        else el.style.transform = `translate3d(0, ${shift * 28}px, 0) scale(${0.985 + 0.015 * opacity})`;
        slot.style.visibility = opacity > 0.001 ? "visible" : "hidden";
        slot.toggleAttribute("data-active", opacity > 0.6); // lets panel content know it's on screen

        // Step layout: mark which step is showing; CSS fades them in and out.
        const n = stepCounts[i];
        if (n > 1) {
          const k = stepAt(win, n, p);
          if (slot.dataset.step !== String(k)) {
            slot.dataset.step = String(k);
            slot.querySelectorAll<HTMLElement>(".steps-item").forEach((it, j) => {
              it.dataset.state = j < k ? "past" : j === k ? "current" : "future";
            });
          }
        }

        // Scene labels follow the panel, then reveal one by one (CSS) once it has arrived.
        const layer = labelRefs.current[i];
        if (layer) {
          layer.style.opacity = String(opacity);
          layer.style.visibility = slot.style.visibility;
          layer.toggleAttribute("data-shown", opacity > 0.6);
        }
        if (!stops[i].hero && opacity > 0.95) resting = true;
      });

      // "Scroll" cue at the top: only while a stop is settled and the story can move on.
      cueRef.current?.toggleAttribute("data-show", resting && !busy && !locked);

      // Top progress line: fills across the cinematic part, then fades as the
      // page leaves the pinned stage.
      if (barRef.current) {
        const past = scrollY - (track.offsetTop + track.offsetHeight - innerHeight);
        barRef.current.style.transform = `scaleX(${p / timeline.total})`;
        barRef.current.style.opacity = String(Math.max(0, Math.min(1, 1 - past / (innerHeight * 0.5))));
      }
    };

    const lenis = reduceMotion ? null : new Lenis({ lerp: 0.08, wheelMultiplier: 0.85 });

    // ---- scene stepping ------------------------------------------------------
    // Inside the story, one gesture (wheel flick, swipe, arrow key) glides to the
    // next/previous stop instead of scrolling freely. Past the video, the page
    // scrolls normally; scrolling back up from there returns to the last stop.
    const scrollable = () => track.offsetHeight - innerHeight;
    const yAt = (p: number) => track.offsetTop + (p / timeline.total) * scrollable();
    const exitY = () => track.offsetTop + track.offsetHeight; // first section after the video
    const storyEndY = () => track.offsetTop + scrollable(); // last pinned position (black)
    const snaps = () => [
      ...new Set([
        track.offsetTop,
        ...timeline.windows.flatMap((w, i) => (stepCounts[i] > 1 ? stepRests(w, stepCounts[i]) : [restAt(w)])).map(yAt),
        exitY(),
      ]),
    ];

    // A glide is a list of timed legs (px), played back in the rAF loop so the video
    // runs at STORY.pace.videoSpeed and panels fade at their own pace.
    type PxLeg = { y0: number; y1: number; duration: number; ease: (u: number) => number };
    let glide: { legs: PxLeg[]; i: number; legStart: number } | null = null;
    let busy = false;

    const setScroll = (y: number) => {
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else scrollTo(0, y);
    };

    const glideTo = (y1: number) => {
      const y0 = scrollY;
      const end = storyEndY();
      const { exitSeconds } = STORY.pace;
      const pOf = (y: number) => Math.min(timeline.total, Math.max(0, ((y - track.offsetTop) / scrollable()) * timeline.total));
      const story = (a: number, b: number): PxLeg[] =>
        planGlide(timeline, pOf(a), pOf(b)).map((l) => ({ y0: yAt(l.from), y1: yAt(l.to), duration: l.duration, ease: l.ease }));

      const legs: PxLeg[] =
        y1 > y0
          ? [...story(y0, Math.min(y1, end)), ...(y1 > end ? [{ y0: Math.max(y0, end), y1, duration: exitSeconds, ease: easeInOutSine }] : [])]
          : [...(y0 > end ? [{ y0, y1: Math.max(y1, end), duration: exitSeconds, ease: easeInOutSine }] : []), ...story(Math.min(y0, end), y1)];

      if (reduceMotion || legs.length === 0) return setScroll(y1);
      busy = true;
      dispatchEvent(new Event("story:glide")); // lets interactive stops close themselves
      glide = { legs, i: 0, legStart: performance.now() };
    };

    const advanceGlide = (now: number) => {
      if (!glide) return;
      while (glide.i < glide.legs.length) {
        const leg = glide.legs[glide.i];
        const u = leg.duration > 0 ? (now - glide.legStart) / (leg.duration * 1000) : 1;
        if (u < 1) return setScroll(leg.y0 + (leg.y1 - leg.y0) * leg.ease(u));
        setScroll(leg.y1);
        glide.legStart += leg.duration * 1000;
        glide.i++;
      }
      glide = null;
      busy = false;
    };

    // ---- story lock ----------------------------------------------------------
    // While an interactive panel is open (e.g. a map bubble), the story must not move:
    // wheel, swipe, keys and the scrollbar are all held until the panel closes. Scrolling
    // inside the open panel itself still works.
    let locked = false;
    const lock = () => {
      locked = true;
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    };
    const unlock = () => {
      locked = false;
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
    addEventListener("story:lock", lock);
    // A control inside a panel (e.g. project tabs) asks to show step k of its stop: glide
    // there within the hold, so scrolling and clicking always agree.
    const onStepRequest = (e: Event) => {
      const { id, k } = (e as CustomEvent<{ id: string; k: number }>).detail;
      const i = stops.findIndex((st) => st.id === id);
      if (i < 0 || stepCounts[i] < 2 || locked || busy) return;
      glideTo(yAt(stepRests(timeline.windows[i], stepCounts[i])[k]));
    };
    addEventListener("story:step", onStepRequest);
    // From outside the story (e.g. the Selected Work cards): jump straight to a stop's step,
    // without playing the video in between, and put keyboard focus on its controls.
    const onGoto = (e: Event) => {
      const { id, k } = (e as CustomEvent<{ id: string; k: number }>).detail;
      const i = stops.findIndex((st) => st.id === id);
      if (i < 0) return;
      if (locked) unlock();
      glide = null;
      busy = false;
      const n = stepCounts[i];
      setScroll(yAt(n > 1 ? stepRests(timeline.windows[i], n)[Math.min(k, n - 1)] : restAt(timeline.windows[i])));
      // Once the panel is showing (the update loop reveals it on the next frames).
      setTimeout(() => {
        const slot = slotRefs.current[i];
        const target = slot?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ?? slot?.querySelector<HTMLElement>("button, a");
        target?.focus({ preventScroll: true });
      }, 150);
    };
    addEventListener("story:goto", onGoto);
    addEventListener("story:unlock", unlock);
    // An element that can scroll on its own in this direction (an open panel's content).
    // The nearest marked element (an open card, or a panel taller than the screen) that can
    // still scroll in this direction; the story only moves once it has reached its end.
    const SCROLLABLE = "[data-no-story-swipe], [data-story-scroll]";
    const scroller = (target: EventTarget | null, dir: 1 | -1) => {
      let el = target instanceof Element ? target.closest<HTMLElement>(SCROLLABLE) : null;
      while (el) {
        if (el.scrollHeight > el.clientHeight + 1 && (dir === 1 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0))
          return el;
        el = el.parentElement?.closest<HTMLElement>(SCROLLABLE) ?? null;
      }
      return null;
    };

    /** Returns true if the gesture was handled as a scene step. */
    const step = (dir: 1 | -1) => {
      if (locked) return true; // swallowed: the story is held while a panel is open
      const y = scrollY;
      const end = exitY();
      // Below the story: only an upward gesture right at its edge re-enters it.
      if (y > end + 2 || (y >= end - 2 && dir === 1)) return false;
      if (busy) return true;
      const list = snaps();
      const target = dir === 1 ? list.find((s) => s > y + 4) : [...list].reverse().find((s) => s < y - 4);
      if (target === undefined) return false;
      glideTo(target);
      return true;
    };

    // Wheel: a trackpad swipe fires a long stream of events (with momentum), so
    // each continuous stream counts as one gesture = one step.
    let lastWheel = 0;
    let gestureUsed = false;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // pinch-zoom / sideways
      const now = performance.now();
      if (now - lastWheel > 200) gestureUsed = false;
      lastWheel = now;
      const dir = e.deltaY > 0 ? 1 : -1;
      // Let a scrollable card (e.g. an open map card) scroll itself while it still can.
      if (scroller(e.target, dir)) {
        e.stopPropagation(); // keep Lenis out of it too; the browser scrolls the card
        return;
      }
      if (locked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const y = scrollY, end = exitY();
      const inStory = y < end - 2 || (y <= end + 2 && dir === -1);
      if (!inStory) return;
      e.preventDefault();
      e.stopPropagation(); // keep Lenis from free-scrolling
      if (gestureUsed || busy || Math.abs(e.deltaY) < 2) return;
      if (step(dir)) gestureUsed = true;
    };

    let touchY: number | null = null;
    let touchX = 0;
    let onCarousel = false;
    let innerScrolled = false; // this swipe scrolled a panel, so it doesn't also step the story
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
      touchX = e.touches[0].clientX;
      innerScrolled = false;
      // Swipes that start on a scrollable card (anything marked data-no-story-swipe) are its
      // own. On a carousel, sideways swipes are the carousel's; vertical ones still step.
      const t = e.target instanceof Element ? e.target : null;
      onCarousel = !!t?.closest(".carousel");
      touchY = t?.closest("[data-no-story-swipe]") && !onCarousel ? null : e.touches[0].clientY;
    };
    let lastTouchY = 0;
    const onTouchMove = (e: TouchEvent) => {
      if (locked) {
        // Only the open panel may scroll; everything else is held still.
        const y = e.touches[0].clientY;
        const dir = lastTouchY - y > 0 ? 1 : -1;
        lastTouchY = y;
        if (!scroller(e.target, dir)) e.preventDefault();
        return;
      }
      if (touchY === null) return;
      // A panel taller than the screen scrolls itself first (native scrolling).
      const cy = e.touches[0].clientY;
      const moveDir = lastTouchY - cy > 0 ? 1 : -1;
      lastTouchY = cy;
      if (innerScrolled || scroller(e.target, moveDir)) {
        innerScrolled = true;
        return;
      }
      const dir = touchY - cy > 0 ? 1 : -1;
      const y = scrollY, end = exitY();
      if (y < end - 2 || (y <= end + 2 && dir === -1)) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null || locked) return;
      const dy = touchY - e.changedTouches[0].clientY;
      const dx = touchX - e.changedTouches[0].clientX;
      touchY = null;
      if (innerScrolled) return;
      if (onCarousel && Math.abs(dx) >= Math.abs(dy)) return;
      if (Math.abs(dy) > 30) step(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]")) return;
      // Space/Enter on a focused button activates it; it must not also advance the story.
      if ((e.key === " " || e.key === "Enter") && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      const dir =
        ["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey ? 1
        : ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey) ? -1
        : 0;
      if (!dir) return;
      // Locked: keys may scroll a focused panel, but never the story.
      if (locked) {
        if (!(e.target instanceof Element && e.target.closest("[data-no-story-swipe]"))) e.preventDefault();
        return;
      }
      if (step(dir)) e.preventDefault();
    };

    addEventListener("wheel", onWheel, { passive: false, capture: true });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("touchend", onTouchEnd);
    addEventListener("keydown", onKey);

    let raf = 0;
    const loop = (time: number) => {
      advanceGlide(performance.now());
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
      removeEventListener("wheel", onWheel, { capture: true });
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("touchend", onTouchEnd);
      removeEventListener("keydown", onKey);
      removeEventListener("story:lock", lock);
      removeEventListener("story:step", onStepRequest);
      removeEventListener("story:goto", onGoto);
      removeEventListener("story:unlock", unlock);
      document.documentElement.style.overflow = "";
      lenis?.destroy();
    };
  }, [manifest, timeline, stops, stepCounts]);

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
          <div ref={cueRef} className="story-cue" aria-hidden>
            Scroll
            <span />
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
                className={`panel-slot ${stop.hero ? "panel-slot--hero" : ""} ${stop.feature ? "panel-slot--feature" : ""}`}
                style={{ visibility: "hidden" }}
              >
                <div
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  className="panel-motion"
                  style={{ "--panel-o": 0 } as CSSProperties}
                >
                  {!c ? (
                    <GlassPanel>
                      <p className="panel-missing">Missing content/story/{stop.id}.md</p>
                    </GlassPanel>
                  ) : stop.feature === "map-of-me" && c.map ? (
                    <MapOfMe map={c.map} />
                  ) : stop.hero ? (
                    <HeroContent c={c} />
                  ) : c.steps.length > 0 ? (
                    <StepsContent c={c} />
                  ) : (
                    <GlassPanel className={stop.glass ? `glass--${stop.glass}` : ""}>
                      <PanelContent c={c} />
                    </GlassPanel>
                  )}
                </div>
              </div>
            );
          })}

          {stops.map((stop, i) => {
            const labels = content[stop.id]?.labels ?? [];
            if (!labels.length) return null;
            const groups = [...new Set(labels.map((l) => l.at))];
            return (
              <div
                key={`${stop.id}-labels`}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="scene-labels"
                style={{ visibility: "hidden", opacity: 0 }}
              >
                {groups.map((g) => (
                  <div key={g} className="scene-labels-group" data-group={g}>
                    {labels.map((l, n) =>
                      l.at === g ? (
                        <p key={l.text} className={`scene-label ${l.style ? `scene-label--${l.style}` : ""}`} style={{ "--i": n } as CSSProperties}>
                          {l.text}
                        </p>
                      ) : null,
                    )}
                  </div>
                ))}
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

// Title at the start of the video: no glass, styled like the portfolio sections.
function HeroContent({ c }: { c: StoryContent }) {
  return (
    <div className="hero">
      {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
      <h1 className="hero-title">{c.title}</h1>
      {c.subtitle && <p className="hero-subtitle">{c.subtitle}</p>}
      <div className="prose hero-prose" dangerouslySetInnerHTML={{ __html: c.html }} />
      <p className="hero-cue" aria-hidden>
        <span /> Scroll
      </p>
    </div>
  );
}

// Open layout (no card): an italic serif title, an opening line, then steps revealed one
// scroll at a time. Earlier steps stay, dimmed, so the progression reads top to bottom.
function StepsContent({ c }: { c: StoryContent }) {
  return (
    <div className="steps">
      <div className="steps-head">
        <h2 className="steps-title">{c.title}</h2>
        {c.lead && <p className="steps-lead">{c.lead}</p>}
      </div>
      <ol className="steps-list">
        {c.steps.map((st, i) => (
          <li key={st.title} className="steps-item" data-state={i === 0 ? "current" : "future"}>
            <h3 className="steps-name">
              <span className="steps-num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              {st.title}
            </h3>
            <div className="steps-body" dangerouslySetInnerHTML={{ __html: st.html }} />
            {st.org && <p className="steps-org">{st.org}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PanelContent({ c }: { c: StoryContent }) {
  return (
    <>
      {c.eyebrow && <p className="panel-eyebrow">{c.eyebrow}</p>}
      {c.title && <h2 className="panel-title">{c.title}</h2>}
      {c.subtitle && <p className="panel-subtitle">{c.subtitle}</p>}
      <div className="prose" dangerouslySetInnerHTML={{ __html: c.html }} />
      {c.previews.length > 0 && (
        <div className="previews">
          {c.previews.map((pv, i) => (
            <div key={pv.label} className="preview" style={{ "--i": i } as CSSProperties}>
              <p className="preview-label">{pv.label}</p>
              <p className="preview-items">
                {pv.items.map((it, j) => (
                  // The spaces around the dot let a narrow panel wrap between items.
                  <Fragment key={it}>
                    {j > 0 && (
                      <>
                        {" "}
                        <span className="preview-sep" aria-hidden>
                          ·
                        </span>{" "}
                      </>
                    )}
                    <span className="preview-item">{it}</span>
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
      )}
      {c.projects.length > 0 && <ProjectShowcase projects={c.projects} />}
      {c.topics.length > 0 && <TopicPicker topics={c.topics} />}
      {c.photos.length > 0 && <StoryPhotos photos={c.photos} title={c.photosTitle ?? `${c.title} photos`} caption={c.photosButton} />}
      {c.links.length > 0 && (
        <div className="panel-links">
          {c.links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="pill" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
              {l.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
