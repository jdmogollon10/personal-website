"use client";

import { useEffect, useRef, useState } from "react";

// Photo carousel: auto-advances and loops; pauses while hovered or focused, and for a
// moment after any click or swipe. Photos keep their natural proportions (a blurred copy
// of the same photo fills the frame behind them instead of stretching).

const INTERVAL = 2000; // ms between slides
const RESUME_AFTER = 4000; // ms of quiet after an interaction before auto-advance resumes
const SWIPE = 40; // px of horizontal travel that counts as a swipe

export type Photo = { src: string; alt: string };

export default function Carousel({ photos, label, paused = false }: { photos: Photo[]; label: string; paused?: boolean }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touchedAt, setTouchedAt] = useState(0);
  const [reduceMotion] = useState(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const start = useRef<{ x: number; y: number } | null>(null);
  const n = photos.length;

  const go = (i: number) => setIndex(((i % n) + n) % n);
  const interact = (i: number) => {
    setTouchedAt(Date.now());
    go(i);
  };

  useEffect(() => {
    if (n < 2 || paused || hovered || focused || reduceMotion) return;
    const wait = Math.max(INTERVAL, touchedAt + RESUME_AFTER - Date.now());
    const t = setTimeout(() => setIndex((i) => (i + 1) % n), wait);
    return () => clearTimeout(t);
  }, [index, paused, hovered, focused, touchedAt, n, reduceMotion]);

  if (n === 0) return null;

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      data-no-story-swipe
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      // Only keyboard focus pauses; a mouse click leaves focus on the button, and that
      // shouldn't pause forever (clicks pause for RESUME_AFTER instead).
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
    >
      <div
        className="carousel-stage"
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
          start.current = null;
          // Mostly-sideways only: vertical swipes belong to the page.
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) interact(index + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (start.current = null)}
      >
        {photos.map((p, i) => (
          <figure
            key={p.src + i}
            className={`carousel-slide ${i === index ? "is-current" : ""}`}
            aria-hidden={i !== index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="carousel-fill" src={p.src} alt="" aria-hidden draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="carousel-img" src={p.src} alt={p.alt} draggable={false} />
          </figure>
        ))}
        {n > 1 && (
          <>
            <button type="button" className="carousel-btn carousel-btn--prev" onClick={() => interact(index - 1)} aria-label="Previous photo">
              <span aria-hidden>‹</span>
            </button>
            <button type="button" className="carousel-btn carousel-btn--next" onClick={() => interact(index + 1)} aria-label="Next photo">
              <span aria-hidden>›</span>
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="carousel-dots">
          {photos.map((p, i) => (
            <button
              key={p.src + i}
              type="button"
              className={i === index ? "is-current" : ""}
              onClick={() => interact(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
            />
          ))}
          <span className="carousel-count" aria-hidden>
            {index + 1} / {n}
          </span>
        </div>
      )}
    </div>
  );
}
