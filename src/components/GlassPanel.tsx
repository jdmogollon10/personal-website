import type { CSSProperties, ReactNode } from "react";

// Floating translucent panel used for every story stop.
// Its look is controlled globally by the --glass-* variables in globals.css;
// pass `style` to override any of them for a single panel.
export default function GlassPanel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // data-story-scroll: on phones a panel taller than the screen scrolls itself first
    // (data-lenis-prevent keeps the smooth-scroll library from swallowing that swipe).
    <div className={`glass ${className}`} style={style} data-story-scroll data-lenis-prevent>
      {children}
    </div>
  );
}
