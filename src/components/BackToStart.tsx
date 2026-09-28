"use client";

// Quiet link in the footer: jumps straight back to the opening title (no video replay).
export default function BackToStart() {
  return (
    <button
      type="button"
      className="back-to-start"
      onClick={() => dispatchEvent(new CustomEvent("story:goto", { detail: { id: "section-00", k: 0 } }))}
    >
      Back to the beginning <span aria-hidden>↑</span>
    </button>
  );
}
