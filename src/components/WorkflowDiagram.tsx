"use client";

import { Fragment, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { Workflow } from "@/lib/content";

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** Card-size diagram: the stages in a row, joined by arrows. */
export function WorkflowPreview({ workflow }: { workflow: Workflow }) {
  const steps = workflow.stages.flatMap((s) => s.items).filter((it) => it.kind === "step").length;
  const files = workflow.stages.flatMap((s) => s.items).filter((it) => it.kind === "file").length;
  return (
    <span className="wf-preview">
      <span className="wf-flow">
        {workflow.stages.map((st, i) => (
          <Fragment key={st.name}>
            {i > 0 && <span className="wf-arrow" aria-hidden />}
            <span className="wf-node">
              <span className="wf-node-num">{pad(i)}</span>
              <span className="wf-node-name">{st.name}</span>
            </span>
          </Fragment>
        ))}
      </span>
      <span className="wf-preview-meta">
        {steps} steps · {files} deliverables
        <span className="wf-preview-open" aria-hidden>
          Explore ⤢
        </span>
      </span>
    </span>
  );
}

/**
 * The full sequence, opened over the scene. The story is held in place while it is open
 * (like the map bubbles); Escape, the close button, or a click outside closes it.
 */
export function WorkflowDetail({ workflow, eyebrow, onClose }: { workflow: Workflow; eyebrow: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dispatchEvent(new Event("story:lock"));
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      dispatchEvent(new Event("story:unlock"));
      previous?.focus();
    };
  }, [onClose]);

  const stage = document.querySelector(".story-stage");
  if (!stage) return null;

  return createPortal(
    <div className="wf-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="wf-scrim" onClick={onClose} aria-hidden />
      <div className="wf-sheet glass glass--deep" data-no-story-swipe data-lenis-prevent>
        <header className="wf-head">
          <div>
            <p className="panel-eyebrow">{eyebrow}</p>
            <h2 id={titleId} className="wf-title">
              {workflow.title}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="wf-close" onClick={onClose} aria-label="Close workflow">
            <span aria-hidden>×</span>
          </button>
        </header>

        <ol className="wf-stages">
          {workflow.stages.map((st, i) => (
            <li key={st.name} className="wf-stage">
              <p className="wf-stage-name">
                <span className="wf-stage-num">{pad(i)}</span>
                {st.name}
              </p>
              <ul className="wf-items">
                {st.items.map((it, j) => (
                  <Fragment key={it.label}>
                    {it.kind === "file" && st.items[j - 1]?.kind !== "file" && <li className="wf-sub">Final</li>}
                    <li className={`wf-item wf-item--${it.kind}`}>
                      <p className="wf-label">
                        {it.num && <span className="wf-num">{it.num}</span>}
                        {it.label}
                      </p>
                      <p className="wf-text">{it.text}</p>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>,
    stage,
  );
}
