// ============================================================================
//  STORY CONFIG — the one place to tune the scroll-controlled video.
// ============================================================================
//
//  Navigation is scene-by-scene: one scroll / swipe / arrow key glides to the next stop,
//  playing the video in between at `pace.videoSpeed`.
//
//  Scroll distances are measured in "screens" (1 = one viewport height of scrolling);
//  they only matter if someone drags the scrollbar.
//
//  Each stop:
//    id        section id; its text lives in content/story/<id>.md
//    time      second in the video where it settles and holds. Written as frame / 24
//              when it must land on an exact frame (the site plays 24 frames per second).
//    hold      screens of scroll the video stays frozen here. The panel fades in at the
//              start of the hold and fades out at the end, while the video is still.
//    approach  (optional) screens of scroll to travel from the previous stop to this one.
//              Defaults to (seconds travelled / secondsPerScreen).
//    panel     where the panel sits, in VIDEO-FRAME coordinates (0–1), so it stays over
//              the same empty area of the frame at any screen size.
//                x, y     point in the frame the panel is anchored to
//                anchor   which part of the panel sits on that point
//                width    panel width in px (it shrinks to fit small screens)
//    hero      (optional) title layout: no glass box, styled like the portfolio sections.
//              A hero at time 0 is visible as soon as the page loads.
//
//  Phones (< 768px wide) ignore x/y and dock glass panels to the bottom of the screen.

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
  /** Scroll length between stops: video seconds per screen of scrolling. */
  secondsPerScreen: 3.2,
  /** Portion of each hold used to fade the panel in, and again to fade it out. */
  fade: 0.35,
  /** Second at which the video is fully black — the cinematic part ends here. */
  endTime: 46.5,
  /** Screens of scroll spent travelling from the last stop to the black ending. */
  outro: 2.0,

  /** Timing of the glide between scenes. */
  pace: {
    /** Average playback speed while travelling between stops (1 = real time). */
    videoSpeed: 1.1,
    /** Seconds to speed up from / slow down into a stop. */
    ramp: 0.6,
    /** Seconds for a panel to fade out (leaving a stop) and fade in (arriving). */
    fadeSeconds: 0.75,
    /** Seconds to glide from the black ending into the portfolio sections. */
    exitSeconds: 1.2,
  },

  stops: [
    { id: "section-00", time: 0,  hold: 0.8, hero: true,
      panel: { x: 0.5, y: 0.5, anchor: "center", width: 760 } },
    { id: "section-05", time: 137 / 24, hold: 1.6, // 00:05.71 — door fully formed, sharp
      panel: { x: 0.80, y: 0.48, anchor: "center", width: 440 } },
    { id: "section-09", time: 231 / 24, hold: 1.6, // 00:09.62 — sharpest before the camera rush
      panel: { x: 0.05, y: 0.10, anchor: "top-left", width: 400 } },
    { id: "section-14", time: 348 / 24, hold: 1.6, // 00:14.50 — clean wide shot of the team
      panel: { x: 0.95, y: 0.07, anchor: "top-right", width: 400 } },
    { id: "section-16", time: 16, hold: 1.6,
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
