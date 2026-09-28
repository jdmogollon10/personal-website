"use client";

import { useEffect, useRef, useState } from "react";
import Carousel, { type Photo } from "./Carousel";

// Photo carousel inside a story panel. On desktop it sits under the text. On phones the
// panel shows a small "photos" row instead; tapping it swaps the text for the carousel in
// the same box (so the box never grows over the scene), and moving on closes it again.
// The carousel only runs while its stop is on screen, and starts from photo 1 each visit.
export default function StoryPhotos({ photos, title, caption }: { photos: Photo[]; title: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    const close = () => setOpen(false);
    addEventListener("story:glide", close);
    // ScrollStory marks the panel's slot with data-active while it is shown.
    const slot = ref.current?.closest(".panel-slot");
    let was = false;
    const observer = new MutationObserver(() => {
      const on = !!slot?.hasAttribute("data-active");
      if (on === was) return;
      was = on;
      if (on) setVisit((v) => v + 1);
      setActive(on);
    });
    if (slot) observer.observe(slot, { attributes: true, attributeFilter: ["data-active"] });
    return () => {
      removeEventListener("story:glide", close);
      observer.disconnect();
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <div ref={ref} className="story-photos" data-open={open || undefined}>
      <button
        type="button"
        className="story-photos-toggle"
        onClick={() => {
          setVisit((v) => v + 1); // start from photo 1
          setOpen(true);
        }}
        aria-expanded={open}
      >
        <span className="story-photos-thumbs" aria-hidden>
          {photos.slice(0, 3).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.src} src={p.src} alt="" draggable={false} />
          ))}
        </span>
        <span className="story-photos-label">
          {photos.length} photos
          <small>{caption ?? title}</small>
        </span>
        <span className="story-photos-chevron" aria-hidden>
          ›
        </span>
      </button>

      <div className="story-photos-view">
        <div className="story-photos-head">
          <p className="panel-eyebrow">{title}</p>
          <button type="button" className="story-photos-close" onClick={() => setOpen(false)} aria-label="Back to text">
            <span aria-hidden>×</span>
          </button>
        </div>
        <Carousel key={visit} photos={photos} label={title} paused={!active} />
      </div>
    </div>
  );
}
