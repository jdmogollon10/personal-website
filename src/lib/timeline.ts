// Maps scroll position (in screens) to video time, using the stops in src/config/story.ts,
// and plans the timed glide from one stop to the next.
//
// During a hold the frame is frozen and the panel's fade in → read → fade out happens
// entirely inside that window, so text never overlaps a moving video.

import { STORY, type StoryStop } from "@/config/story";

type Segment =
  | { kind: "play"; start: number; end: number; t0: number; t1: number }
  | { kind: "hold"; start: number; end: number; t0: number };

export type Timeline = {
  segments: Segment[];
  windows: { start: number; end: number }[]; // hold window per stop, same order as stops
  total: number; // scroll length of the cinematic part, in screens
};

export function buildTimeline(stops: StoryStop[] = STORY.stops): Timeline {
  const segments: Segment[] = [];
  const windows: Timeline["windows"] = [];
  let pos = 0;
  let t = 0;

  const play = (to: number, length?: number) => {
    if (to <= t) return;
    const len = length ?? (to - t) / STORY.secondsPerScreen;
    segments.push({ kind: "play", start: pos, end: pos + len, t0: t, t1: to });
    pos += len;
    t = to;
  };

  for (const s of [...stops].sort((a, b) => a.time - b.time)) {
    play(s.time, s.approach);
    // A stop at the very start is already faded in when the page loads.
    const start = pos === 0 ? -STORY.fade : pos;
    windows.push({ start, end: pos + s.hold });
    segments.push({ kind: "hold", start: pos, end: pos + s.hold, t0: s.time });
    pos += s.hold;
  }
  play(STORY.endTime, STORY.outro);

  return { segments, windows, total: pos };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

/** Video time at scroll position p. Linear within a play segment; the glide sets the pace. */
export function timeAt(tl: Timeline, p: number): number {
  for (const seg of tl.segments) {
    if (p > seg.end) continue;
    if (seg.kind === "hold") return seg.t0;
    return seg.t0 + (seg.t1 - seg.t0) * clamp((p - seg.start) / (seg.end - seg.start));
  }
  return STORY.endTime;
}

/** Where a stop "rests": the middle of its hold (or the top of the page for a 0:00 hero). */
export function restAt(win: { start: number; end: number }) {
  return win.start < 0 ? 0 : (win.start + win.end) / 2;
}

/**
 * Panel visibility inside its hold window.
 * opacity 0→1→0; `shift` goes 1 (entering, below) → 0 (resting) → -1 (leaving, above).
 */
export function panelStateAt(win: { start: number; end: number }, p: number) {
  const len = win.end - win.start;
  const f = Math.min(STORY.fade, len / 3);
  const enter = easeOut(clamp((p - win.start) / f));
  const leave = easeOut(clamp((win.end - p) / f));
  return { opacity: Math.min(enter, leave), shift: (1 - enter) - (1 - leave) };
}

// ---- Glide planning ---------------------------------------------------------

export type Leg = { from: number; to: number; duration: number; ease: (u: number) => number };

const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;

/** Constant speed with smooth ramps at both ends; `r` = ramp share of the duration. */
const trapezoid = (r: number) => {
  if (r <= 0) return (u: number) => u;
  const v = 1 / (1 - r);
  return (u: number) =>
    u < r ? (v * u * u) / (2 * r)
    : u <= 1 - r ? v * (u - r / 2)
    : 1 - (v * (1 - u) * (1 - u)) / (2 * r);
};

/**
 * Splits a move from p0 to p1 into timed legs: panel fade-out (hold), video playback
 * at `pace.videoSpeed` with eased ramps (play), panel fade-in (hold).
 */
export function planGlide(tl: Timeline, p0: number, p1: number): Leg[] {
  const { videoSpeed, ramp, fadeSeconds } = STORY.pace;
  const lo = Math.min(p0, p1), hi = Math.max(p0, p1);
  if (hi - lo < 1e-4) return [];

  const pieces = tl.segments
    .filter((s) => s.end > lo && s.start < hi)
    .map((s) => ({ kind: s.kind, a: Math.max(s.start, lo), b: Math.min(s.end, hi) }));
  if (p1 < p0) pieces.reverse().forEach((pc) => ([pc.a, pc.b] = [pc.b, pc.a]));

  // Merge neighbours of the same kind.
  const merged: { kind: Segment["kind"]; a: number; b: number }[] = [];
  for (const pc of pieces) {
    const last = merged[merged.length - 1];
    if (last && last.kind === pc.kind) last.b = pc.b;
    else merged.push({ ...pc });
  }

  const dir = Math.sign(p1 - p0);
  return merged.flatMap(({ kind, a, b }, i): Leg[] => {
    if (kind === "play") {
      const duration = Math.abs(timeAt(tl, b) - timeAt(tl, a)) / videoSpeed;
      return [{ from: a, to: b, duration, ease: trapezoid(Math.min(0.45, ramp / Math.max(duration, 1e-3))) }];
    }
    // Hold: nothing changes on screen except near the edge where the panel fades,
    // so jump through the still part and spend the time on the fade itself.
    const f = Math.min(STORY.fade, Math.abs(b - a));
    if (merged.length === 1) return [{ from: a, to: b, duration: fadeSeconds, ease: easeInOutSine }];
    if (merged[i + 1]?.kind === "play") {
      // Leaving a stop: the fade happens at the far edge (b).
      const edge = b - dir * f;
      return [
        { from: a, to: edge, duration: 0, ease: easeInOutSine },
        { from: edge, to: b, duration: fadeSeconds, ease: easeInOutSine },
      ];
    }
    // Arriving at a stop: the fade happens at the near edge (a).
    const edge = a + dir * f;
    return [
      { from: a, to: edge, duration: fadeSeconds, ease: easeInOutSine },
      { from: edge, to: b, duration: 0, ease: easeInOutSine },
    ];
  });
}

export { easeInOutSine };
