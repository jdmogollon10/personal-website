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
    <div className={`glass ${className}`} style={style}>
      {children}
    </div>
  );
}
