"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Workflow } from "@/lib/content";
import { WorkflowPreview } from "./WorkflowDiagram";

export type WorkCard = {
  title: string;
  section: string; // the story stop it belongs to, e.g. "Independent Research"
  image?: string;
  imageAlt: string;
  workflow?: Workflow;
  stop: string; // story stop id
  step: number; // 0-based project index inside that stop
};

// A swipeable index of projects. The track is a native horizontal scroller with snapping
// (touch and trackpads swipe it directly); the arrow buttons and the left/right keys move
// between cards. Choosing a card takes the visitor back into the story to that project.
export default function WorkCarousel({ cards, label }: { cards: WorkCard[]; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>(".work-card");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
  };

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const items = [...(track.current?.querySelectorAll<HTMLElement>(".work-card") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    items[Math.min(items.length - 1, Math.max(0, i + dir))].focus();
  };

  const open = (c: WorkCard) => dispatchEvent(new CustomEvent("story:goto", { detail: { id: c.stop, k: c.step } }));

  return (
    <div className="work">
      <div ref={track} className="work-track" role="list" aria-label={label} onKeyDown={onKey}>
        {cards.map((c, i) => (
          <div key={c.title} role="listitem" className="work-item">
            <button type="button" className="work-card" onClick={() => open(c)} aria-label={`${c.title}: view in the story`}>
              <span className={`work-thumb ${c.workflow ? "showcase-shot--diagram" : ""}`}>
                {c.workflow ? (
                  <WorkflowPreview workflow={c.workflow} />
                ) : c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" draggable={false} loading="lazy" />
                ) : null}
              </span>
              <span className="work-meta">
                <span className="work-num">{String(i + 1).padStart(2, "0")}</span>
                {c.section}
              </span>
              <span className="work-title">
                {c.title} <span className="work-arrow" aria-hidden>→</span>
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="work-controls">
        <button type="button" className="carousel-btn work-btn" onClick={() => page(-1)} disabled={edges.start} aria-label="Previous projects">
          <span aria-hidden>‹</span>
        </button>
        <button type="button" className="carousel-btn work-btn" onClick={() => page(1)} disabled={edges.end} aria-label="More projects">
          <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  );
}
