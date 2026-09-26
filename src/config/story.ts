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
//    mobile    where the panel sits on phones / portrait screens, which show the mobile
//              video (same timing, reframed to 9:16). Same idea as `panel`, in that
//              video's frame coordinates. `x` defaults to 0.5 and `width` to the full
//              screen width (minus a 16px margin each side). The mobile video is never
//              cropped sideways, so on tall phones there is black above and below it;
//              y > 1 (e.g. 1.1 with anchor "bottom") drops the panel into that space.

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
  mobile?: { x?: number; y: number; anchor: Anchor; width?: number };
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
    videoSpeed: 1.21,
    /** Seconds to speed up from / slow down into a stop. */
    ramp: 0.6,
    /** Seconds for a panel to fade out (leaving a stop) and fade in (arriving). */
    fadeSeconds: 0.75,
    /** Seconds to glide from the black ending into the portfolio sections. */
    exitSeconds: 1.2,
  },

  stops: [
    { id: "section-00", time: 0, hold: 0.8, hero: true,
      panel: { x: 0.5, y: 0.5, anchor: "center", width: 760 },
      mobile: { y: 0.5, anchor: "center" } },
    { id: "section-06", time: 144 / 24, hold: 1.6, // 00:06.00 — him on the island, facing the door
      panel: { x: 0.80, y: 0.45, anchor: "center", width: 440 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-08", time: 186 / 24, hold: 1.6, // 00:07.75 — reaching for the door (sharpest near 00:08)
      panel: { x: 0.97, y: 0.50, anchor: "right", width: 280 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-14", time: 330 / 24, hold: 1.6, // 00:13.75 — team; 14–15s is a blurred camera swoop
      panel: { x: 0.96, y: 0.50, anchor: "right", width: 360 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-17", time: 403 / 24, hold: 1.6, // 00:16.79 — close-up
      panel: { x: 0.235, y: 0.50, anchor: "left", width: 340 },
      mobile: { x: 0.04, y: 1.1, anchor: "bottom-left", width: 210 } },
    { id: "section-21", time: 513 / 24, hold: 1.6, // 00:21.38 — back on the island
      panel: { x: 0.965, y: 0.50, anchor: "right", width: 300 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-25", time: 596 / 24, hold: 1.6, // 00:24.83 — mentor at the laptop
      panel: { x: 0.06, y: 0.14, anchor: "top-left", width: 420 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-30", time: 716 / 24, hold: 1.6, // 00:29.83 — desk on the island
      panel: { x: 0.96, y: 0.50, anchor: "right", width: 380 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-33", time: 793 / 24, hold: 1.6, // 00:33.04 — writing at the desk
      panel: { x: 0.03, y: 0.07, anchor: "top-left", width: 330 },
      mobile: { x: 0.04, y: -0.1, anchor: "top-left", width: 300 } },
    { id: "section-36", time: 866 / 24, hold: 1.6, // 00:36.08 — whiteboard
      panel: { x: 0.04, y: 0.45, anchor: "left", width: 360 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-41", time: 978 / 24, hold: 1.8, // 00:40.75 — the final door
      panel: { x: 0.06, y: 0.40, anchor: "left", width: 420 },
      mobile: { y: 1.1, anchor: "bottom" } },
  ] satisfies StoryStop[] as StoryStop[],
};
