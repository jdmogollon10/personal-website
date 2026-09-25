// Maps scroll position (in screens) to video time, using the stops in src/config/story.ts.
//
// Between stops the video plays with an ease-in-out curve, so it decelerates and settles
// exactly on each stop's frame. During a hold the frame is frozen and the panel's
// fade in → read → fade out happens entirely inside that window, so text never
// overlaps a moving video (important for stops only a second apart, like 15 → 16).

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
    windows.push({ start: pos, end: pos + s.hold });
    segments.push({ kind: "hold", start: pos, end: pos + s.hold, t0: s.time });
    pos += s.hold;
  }
  play(STORY.endTime, STORY.outro);

  return { segments, windows, total: pos };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export function timeAt(tl: Timeline, p: number): number {
  for (const seg of tl.segments) {
    if (p > seg.end) continue;
    if (seg.kind === "hold") return seg.t0;
    const u = clamp((p - seg.start) / (seg.end - seg.start));
    return seg.t0 + (seg.t1 - seg.t0) * easeInOut(u);
  }
  return STORY.endTime;
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
