// ============================================================================
//  STORY CONFIG — the one place to tune the scroll-controlled video.
// ============================================================================
//
//  Scroll distances are measured in "screens" (1 = one viewport height of scrolling).
//
//  Each stop:
//    id        section id; its text lives in content/story/<id>.md
//    time      second in the video where it settles and holds
//    hold      screens of scroll the video stays frozen here. The panel fades in at the
//              start of the hold, stays readable, and fades out before the video resumes.
//    approach  (optional) screens of scroll to travel from the previous stop to this one.
//              Defaults to (seconds travelled / secondsPerScreen).
//    panel     where the glass panel sits, in VIDEO-FRAME coordinates (0–1), so it stays
//              over the same empty area of the frame at any screen size.
//                x, y     point in the frame the panel is anchored to
//                anchor   which part of the panel sits on that point
//                width    panel width in px (it shrinks to fit small screens)
//    hero      (optional) renders the intro layout (name, description, scroll cue)
//
//  Phones (< 768px wide) ignore x/y and dock the panel to the bottom of the screen.

export type Anchor =
  | "top-left" | "top" | "top-right"
  | "left" | "center" | "right"
  | "bottom-left" | "bottom" | "bottom-right";

export type StoryStop = {
  id: string;
  time: number;
  hold: number;
  approach?: number;
  hero?: boolean;
  panel: { x: number; y: number; anchor: Anchor; width: number };
};

export const STORY = {
  /** Default scroll speed between stops: video seconds per screen of scrolling. */
  secondsPerScreen: 3.2,
  /** Portion of each hold used to fade the panel in, and again to fade it out. */
  fade: 0.35,
  /** Second at which the video is fully black — the cinematic part ends here. */
  endTime: 46.5,
  /** Screens of scroll spent travelling from the last stop to the black ending. */
  outro: 2.0,

  stops: [
    { id: "section-06", time: 6,  hold: 1.8, approach: 1.4, hero: true,
      panel: { x: 0.74, y: 0.48, anchor: "center", width: 520 } },
    { id: "section-10", time: 10, hold: 1.6,
      panel: { x: 0.08, y: 0.50, anchor: "left", width: 440 } },
    { id: "section-15", time: 15, hold: 1.6,
      panel: { x: 0.04, y: 0.93, anchor: "bottom-left", width: 400 } },
    { id: "section-16", time: 16, hold: 1.6, approach: 0.6,
      panel: { x: 0.12, y: 0.52, anchor: "left", width: 420 } },
    { id: "section-24", time: 24, hold: 1.6,
      panel: { x: 0.06, y: 0.14, anchor: "top-left", width: 420 } },
    { id: "section-29", time: 29, hold: 1.6,
      panel: { x: 0.96, y: 0.50, anchor: "right", width: 400 } },
    { id: "section-32", time: 32, hold: 1.6,
      panel: { x: 0.265, y: 0.04, anchor: "top-left", width: 330 } },
    { id: "section-35", time: 35, hold: 1.6,
      panel: { x: 0.03, y: 0.50, anchor: "left", width: 360 } },
    { id: "section-41", time: 41, hold: 1.8,
      panel: { x: 0.05, y: 0.30, anchor: "left", width: 400 } },
  ] satisfies StoryStop[] as StoryStop[],
};
