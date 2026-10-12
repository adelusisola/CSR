// Jikota mark — two interlocking circles (Section 4.2).
// Variants: cream + terracotta on green; green + terracotta on cream.
// Animates the circles joining on page load. Filled/hollow circles are the
// progress motif (see Timeline / StepProgress components).
import { colors } from "../lib/tokens";

interface MarkProps {
  size?: number;
  /** Background the mark sits on, chooses circle pair. */
  on?: "green" | "cream";
  animateJoin?: boolean;
  className?: string;
}

export function Mark({ size = 40, on = "green", animateJoin = true, className }: MarkProps) {
  const left = on === "green" ? colors.cream : colors.deepGreen;
  const right = colors.terracotta;
  const r = size * 0.31;
  const cy = size / 2;
  const offset = size * 0.16; // final center distance from middle
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Jikota mark: two interlocking circles"
      className={className}
    >
      <style>{`
        @keyframes jk-join-left { from { transform: translateX(-${size * 0.4}px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes jk-join-right { from { transform: translateX(${size * 0.4}px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      <circle
        cx={size / 2 - offset}
        cy={cy}
        r={r}
        fill="none"
        stroke={left}
        strokeWidth={size * 0.07}
        style={animateJoin ? { animation: "jk-join-left 700ms ease-out both" } : undefined}
      />
      <circle
        cx={size / 2 + offset}
        cy={cy}
        r={r}
        fill={right}
        fillOpacity={0.9}
        stroke={right}
        strokeWidth={size * 0.07}
        style={animateJoin ? { animation: "jk-join-right 700ms ease-out both" } : undefined}
      />
    </svg>
  );
}

/** Wordmark: JIKOTA — capitals, no dots (Section 4.2). */
export function Wordmark({ size = 20, on = "green" }: { size?: number; on?: "green" | "cream" }) {
  return (
    <span
      style={{
        fontFamily: "var(--jk-font-ui)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontSize: size,
        color: on === "green" ? colors.cream : colors.deepGreen,
      }}
    >
      JIKOTA
    </span>
  );
}

/**
 * Igbo word jikọta — italic, lowercase, with dots. Story contexts ONLY,
 * at most once per surface. Do not use on product/task surfaces.
 */
export function IgboWord({ size = 16 }: { size?: number }) {
  return (
    <em
      style={{
        fontFamily: "var(--jk-font-brand)",
        fontStyle: "italic",
        fontSize: size,
        color: "inherit",
      }}
    >
      jik&#777;ota
    </em>
  );
}
