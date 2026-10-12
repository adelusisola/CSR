// Timeline + step progress — mark motif: filled/hollow circles (Section 4.2).
// UX law #2: numbered steps with "Step 2 of 5"; mark fills as steps complete.
import { colors } from "../lib/tokens";
import { Chip } from "./ui";

export interface StepInfo {
  label: string;
  done: boolean;
}

export function StepProgress({ steps, current }: { steps: StepInfo[]; current: number }) {
  const total = steps.length;
  return (
    <div aria-label={`Step ${current + 1} of ${total}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {steps.map((s, i) => (
          <span key={s.label} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill={s.done || i < current ? colors.terracotta : "none"}
                stroke={colors.terracotta}
                strokeWidth="2"
              />
            </svg>
          </span>
        ))}
        <span style={{ fontSize: "var(--jk-secondary)", color: colors.ink, marginLeft: 8 }}>
          Step {current + 1} of {total}
        </span>
      </div>
      <div style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 8 }}>
        <div
          style={{
            height: "100%",
            width: `${(Math.min(current + 1, total) / total) * 100}%`,
            backgroundColor: colors.terracotta,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

export interface TimelineEvent {
  title: string;
  date: string;
  status: "done" | "current" | "planned" | "disputed";
  detail?: string;
}

/** Vertical timeline using the two-circle motif for nodes. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--jk-font-ui)" }}>
      {events.map((e) => (
        <li key={e.title + e.date} style={{ display: "flex", gap: 12, paddingBottom: 16 }}>
          <svg width="20" height="44" viewBox="0 0 20 44" aria-hidden="true" style={{ flexShrink: 0 }}>
            <line x1="10" y1="0" x2="10" y2="44" stroke={colors.border} strokeWidth="2" />
            <circle
              cx="10"
              cy="10"
              r="7"
              fill={e.status === "done" ? colors.terracotta : "none"}
              stroke={e.status === "disputed" ? colors.danger : colors.terracotta}
              strokeWidth="2"
            />
          </svg>
          <div>
            <div style={{ fontWeight: 600, color: colors.ink }}>{e.title}</div>
            <div style={{ fontSize: "var(--jk-secondary)", color: colors.ink, opacity: 0.75 }}>{e.date}</div>
            {e.status === "done" && <Chip tone="done">Done</Chip>}
            {e.status === "disputed" && <Chip tone="neutral">Problem raised</Chip>}
            {e.detail && <p style={{ margin: "4px 0 0", fontSize: "var(--jk-body)" }}>{e.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
