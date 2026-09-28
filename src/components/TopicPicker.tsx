"use client";

import { useEffect, useId, useRef, useState } from "react";

// Topic headings with the current topic's text below, in a space reserved for the longest
// one so the panel never changes size. Each topic is a scroll step of the stop (scrolling
// opens the next one while the video holds); clicking a heading goes to the same step.
export default function TopicPicker({ topics }: { topics: { title: string; html: string }[] }) {
  const [open, setOpen] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const n = topics.length;

  // Follow the stop's scroll step (ScrollStory writes it to the slot as data-step).
  useEffect(() => {
    const slot = root.current?.closest<HTMLElement>(".panel-slot");
    if (!slot) return;
    const sync = () => setOpen(Math.min(n - 1, Number(slot.dataset.step ?? 0)));
    const observer = new MutationObserver(sync);
    observer.observe(slot, { attributes: true, attributeFilter: ["data-step"] });
    return () => observer.disconnect();
  }, [n]);

  const show = (k: number) => {
    setOpen(k);
    const slot = root.current?.closest<HTMLElement>(".panel-slot");
    if (slot) dispatchEvent(new CustomEvent("story:step", { detail: { id: slot.id, k } }));
  };

  return (
    <div ref={root} className="topics">
      <div className="topics-list" role="tablist" aria-label="Topics">
        {topics.map((t, i) => (
          <button
            key={t.title}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={open === i}
            aria-controls={`${id}-panel-${i}`}
            className="topic"
            onClick={() => show(i)}
          >
            <span className="topic-num" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="topic-title">{t.title}</span>
            <span className="topic-mark" aria-hidden />
          </button>
        ))}
      </div>

      <div className="topics-stage">
        {topics.map((t, i) => (
          <div
            key={t.title}
            id={`${id}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${i}`}
            aria-hidden={open !== i}
            className={`topic-body prose ${open === i ? "is-current" : ""}`}
            dangerouslySetInnerHTML={{ __html: t.html }}
          />
        ))}
      </div>
    </div>
  );
}
