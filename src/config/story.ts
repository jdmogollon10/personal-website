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
//    speed     (optional) speed multiplier for the transition INTO this stop, on top of
//              pace.videoSpeed (1.1 = 10% faster, 0.9 = 10% slower).
//    boost     (optional) change of pace partway through the transition INTO this stop:
//              from `at` (0–1, share of the way there) the video runs `factor` times faster
//              (1.2 = 20% faster), blending in smoothly, before easing into the stop.
//    glass     (optional) "dark" for a smoky panel that stays readable over bright frames;
//              "deep" for an even darker one (busy, brightly lit frames).
//    feature   (optional) "map-of-me" turns this stop into the interactive map (see MAP_OF_ME).
//    approach  (optional) screens of scroll to travel from the previous stop to this one.
//              Defaults to (seconds travelled / secondsPerScreen).
//    panel     where the panel sits, in VIDEO-FRAME coordinates (0–1), so it stays over
//              the same empty area of the frame at any screen size.
//                x, y     point in the frame the panel is anchored to
//                anchor   which part of the panel sits on that point
//                width    panel width in px (it shrinks to fit small screens)
//                toX      (optional) the panel's right edge, in frame coordinates (for a
//                         left-anchored panel): its width then follows the frame instead
//                         of `width`, so it always ends at the same spot in the scene
//                alignTo  (optional) a label group (see `labels`): the panel's text then starts
//                         exactly where that group starts, instead of using x / anchor
//    labels    (optional) where each group of small scene labels sits, in the same
//              VIDEO-FRAME coordinates as `panel` (x, y, anchor). The labels' wording and
//              order live in the stop's content file. On phones and narrow windows the
//              groups stack just above the text box instead, so they never cover it.
//    hero      (optional) title layout: no glass box, styled like the portfolio sections.
//              A hero at time 0 is visible as soon as the page loads.
//
//    mobile    where the panel sits on phones / portrait screens, which show the mobile
//              video (same timing, reframed to 9:16). Same idea as `panel`, in that
//              video's frame coordinates. `x` defaults to 0.5 and `width` to the full
//              screen width (minus a 16px margin each side). The mobile video is never
//              cropped sideways, so on tall phones there is black above and below it;
//              y > 1 (e.g. 1.1 with anchor "bottom") drops the panel into that space.
//              `fill: true` gives the panel the whole screen to lay itself out in instead.

export type Anchor =
  | "top-left" | "top" | "top-right"
  | "left" | "center" | "right"
  | "bottom-left" | "bottom" | "bottom-right";

export type StoryStop = {
  id: string;
  time: number;
  hold: number;
  approach?: number;
  speed?: number;
  boost?: { at: number; factor: number };
  glass?: "dark" | "deep";
  hero?: boolean;
  feature?: "map-of-me";
  panel: { x: number; y: number; anchor: Anchor; width: number; alignTo?: string; toX?: number };
  labels?: Record<string, { x: number; y: number; anchor: Anchor }>;
  mobile?: { x?: number; y: number; anchor: Anchor; width?: number; fill?: boolean };
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
    { id: "section-06", time: 144 / 24, hold: 2.2, speed: 1.1, feature: "map-of-me", // 00:06.00 — him on the island, facing the door
      panel: { x: 0.80, y: 0.45, anchor: "center", width: 440 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-08", time: 207 / 24, hold: 1.6, glass: "dark", // 00:08.62 — hand in the light (sharpest 0.5–1s after 7.75)
      panel: { x: 0.97, y: 0.50, anchor: "right", width: 300 },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-14", time: 330 / 24, hold: 1.6, glass: "dark", // 00:13.75 — team; 14–15s is a blurred camera swoop
      // Wider + lower (room for the photos, below the door); its text lines up with the club label.
      panel: { x: 0.97, y: 0.64, anchor: "right", width: 440, alignTo: "club" },
      labels: {
        school: { x: 0.04, y: 0.035, anchor: "top-left" },    // open sky above the table
        club: { x: 0.625, y: 0.1, anchor: "top-left" },       // dark space right of the door
        details: { x: 0.04, y: 0.88, anchor: "bottom-left" }, // dark space below the island
      },
      mobile: { y: 1.1, anchor: "bottom" } },
    { id: "section-17", time: 403 / 24, hold: 1.6, // 00:16.79 — close-up
      panel: { x: 0.235, y: 0.50, anchor: "left", width: 340 },
      mobile: { x: 0.04, y: 1.1, anchor: "bottom-left", width: 210 } },
    // No stop at 00:20.92: the video plays straight through from section-17, 20% faster.
    // Three steps (content/story/section-25.md): one scroll each while the video holds, so
    // the hold is longer than usual.
    { id: "section-25", time: 596 / 24, hold: 3.2, speed: 1.2, // 00:24.83 — mentor at the laptop
      panel: { x: 0.05, y: 0.09, anchor: "top-left", width: 440 },
      // Phones: title and opening line top left, the steps at the bottom.
      mobile: { y: 1.1, anchor: "bottom", fill: true } },
    { id: "section-30", time: 716 / 24, hold: 1.6, // 00:29.83 — desk on the island
      panel: { x: 0.96, y: 0.50, anchor: "right", width: 410 }, // wide enough for each preview line
      mobile: { y: 1.1, anchor: "bottom" } },
    // Over the dark wall and laptop, leaving the monitor chart and the writing hand clear.
    // Two projects (content/story/section-33.md): one scroll each, so a longer hold.
    { id: "section-33", time: 793 / 24, hold: 2.4, glass: "deep", // 00:33.04 — writing at the desk
      panel: { x: 0.025, y: 0.04, anchor: "top-left", width: 400, toX: 0.386 }, // ends just short of the monitor (0.398)
      mobile: { y: 1.1, anchor: "bottom" } },
    // Two projects (content/story/section-36.md), like section-33: one scroll each, and the
    // same panel size so the two project stops match.
    { id: "section-36", time: 866 / 24, hold: 2.4, glass: "deep", // 00:36.08 — whiteboard
      panel: { x: 0.025, y: 0.04, anchor: "top-left", width: 400, toX: 0.386 }, // same size as section-33
      mobile: { y: 1.1, anchor: "bottom" } },
    // Three topics (content/story/section-41.md): one scroll each, so a longer hold.
    { id: "section-41", time: 990 / 24, hold: 3.2, glass: "deep", // 00:41.25 — the final door
      panel: { x: 0.04, y: 0.46, anchor: "left", width: 420 }, // dark space left of the island
      mobile: { y: 1.1, anchor: "bottom" } },
  ] satisfies StoryStop[] as StoryStop[],
};

// ============================================================================
//  MAP OF ME — the interactive first stop (section-06).
// ============================================================================
//  All positions are fractions of the DESKTOP video frame (0–1), so lines stay attached
//  to the character at any window size. Text and photos live in content/story/section-06.md.
//
//    callouts  each line runs `from` a point just outside the character's silhouette (so no
//              line crosses him) `to` where its label sits; `side` is the label's direction
//    detail    the empty area where an opened callout expands (never over the character);
//              the intro text ("Before the next door opens...") sits here while nothing is open

export type MapSide = "left" | "right" | "above" | "below";
type Pt = { x: number; y: number };

export const MAP_OF_ME = {
  callouts: {
    // Top: the sky left of him, and the gap between his head and the door
    venezuela: { from: { x: 0.272, y: 0.2 }, to: { x: 0.21, y: 0.065 }, side: "left" },         // left shoulder
    creative: { from: { x: 0.318, y: 0.2 }, to: { x: 0.343, y: 0.105 }, side: "above" },        // right shoulder
    // Lower left: the dark wedge beside the island's underside
    investing: { from: { x: 0.271, y: 0.335 }, to: { x: 0.215, y: 0.72 }, side: "left" },       // left hip
    interests: { from: { x: 0.281, y: 0.425 }, to: { x: 0.29, y: 0.905 }, side: "left" },       // left foot
    // Lower right: below the island's right side
    sports: { from: { x: 0.323, y: 0.33 }, to: { x: 0.55, y: 0.79 }, side: "right" },           // right hip
    entrepreneurship: { from: { x: 0.313, y: 0.42 }, to: { x: 0.47, y: 0.925 }, side: "right" }, // right foot
  } satisfies Record<string, { from: Pt; to: Pt; side: MapSide }>,
  detail: { x: 0.655, y: 0.12, w: 0.3, h: 0.76 },
};

