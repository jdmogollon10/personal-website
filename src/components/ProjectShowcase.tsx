"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { ShowcaseProject } from "@/lib/content";
import { WorkflowDetail, WorkflowPreview } from "./WorkflowDiagram";

// Projects inside a story panel, one at a time, while the video stays on its scene. Each
// project is a scroll step of the stop (scrolling on moves to the next project before the
// video continues); the tabs (click, or left/right arrow keys) glide to the same steps.
// The preview image and the button both open the project in a new tab; a project with a
// `workflow` shows a native diagram instead, and both open its full sequence in the page.
// All projects are stacked in the same spot so the panel keeps one height and crossfade.
export default function ProjectShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const [index, setIndex] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const n = projects.length;

  // Follow the stop's scroll step (ScrollStory writes it to the slot as data-step).
  useEffect(() => {
    const slot = root.current?.closest<HTMLElement>(".panel-slot");
    if (!slot) return;
    const sync = () => setIndex(Math.min(n - 1, Number(slot.dataset.step ?? 0)));
    const observer = new MutationObserver(sync);
    observer.observe(slot, { attributes: true, attributeFilter: ["data-step"] });
    return () => observer.disconnect();
  }, [n]);

  const show = (k: number) => {
    setIndex(k);
    const slot = root.current?.closest<HTMLElement>(".panel-slot");
    if (slot) dispatchEvent(new CustomEvent("story:step", { detail: { id: slot.id, k } }));
  };

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + n) % n;
    show(next);
    tabs.current[next]?.focus();
  };

  return (
    <div ref={root} className="showcase">
      <div className="showcase-tabs" role="tablist" aria-label="Projects" onKeyDown={onKey}>
        {projects.map((p, i) => (
          <button
            key={p.title}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === index}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === index ? 0 : -1}
            className="showcase-tab"
            onClick={() => show(i)}
          >
            <span className="showcase-tab-num" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            {p.tab}
          </button>
        ))}
      </div>

      <div className="showcase-stage">
        {projects.map((p, i) => (
          <article
            key={p.title}
            id={`${id}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${i}`}
            className={`showcase-project ${i === index ? "is-current" : ""}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {p.workflow ? (
              <button
                type="button"
                className="showcase-shot showcase-shot--diagram"
                onClick={() => setDetail(i)}
                aria-label={`${p.button}: ${p.workflow.stages.map((st) => st.name).join(", ")}`}
              >
                <WorkflowPreview workflow={p.workflow} />
              </button>
            ) : p.image && p.href ? (
              <a className="showcase-shot" href={p.href} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.imageAlt} draggable={false} />
                <span className="showcase-shot-open">↗</span>
              </a>
            ) : p.image ? (
              <div className="showcase-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.imageAlt} draggable={false} />
              </div>
            ) : null}
            <h3 className="showcase-title">{p.title}</h3>
            <div className="showcase-body" dangerouslySetInnerHTML={{ __html: p.html }} />
            {p.workflow ? (
              <button type="button" className="pill showcase-link" onClick={() => setDetail(i)} aria-haspopup="dialog">
                {p.button} <span aria-hidden>⤢</span>
              </button>
            ) : p.href ? (
              <a className="pill showcase-link" href={p.href} target="_blank" rel="noopener noreferrer">
                {p.button} <span aria-hidden>↗</span>
              </a>
            ) : null}
          </article>
        ))}
      </div>
      {detail !== null && projects[detail]?.workflow && (
        <WorkflowDetail workflow={projects[detail].workflow!} eyebrow={projects[detail].title} onClose={closeDetail} />
      )}
    </div>
  );
}
