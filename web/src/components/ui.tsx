// Core UI components per Section 4.2/4.3 — single module, mobile-first.
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { colors } from "../lib/tokens";

/* ---------- Buttons (primary = terracotta; pressed = terracotta-dark) -------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  fullWidthOnMobile?: boolean; // UX law #12: full-width bottom anchor on mobile
}
export function Button({ variant = "primary", fullWidthOnMobile = true, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    minHeight: "var(--jk-touch-min)",
    minWidth: "var(--jk-touch-min)",
    padding: "12px 24px",
    borderRadius: 8,
    fontFamily: "var(--jk-font-ui)",
    fontSize: "var(--jk-body)",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    ...(variant === "primary" && { backgroundColor: colors.terracotta, color: "#fff" }) as object,
    ...(variant === "secondary" && {
      backgroundColor: "transparent",
      color: colors.deepGreen,
      border: `1px solid ${colors.deepGreen}`,
    }) as object,
    ...(variant === "danger" && { backgroundColor: colors.danger, color: "#fff" }) as object,
    ...style,
  };
  return <button {...rest} style={base} className={fullWidthOnMobile ? "jk-btn-full" : undefined} />;
}

/* ---------- Chips / badges --------------------------------------------------- */
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "match" | "done" }) {
  const bg =
    tone === "match" ? colors.terracotta : tone === "done" ? colors.success : colors.border;
  const fg = tone === "neutral" ? colors.ink : "#fff";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        backgroundColor: bg,
        color: fg,
        fontSize: "var(--jk-secondary)",
        fontFamily: "var(--jk-font-ui)",
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Verified badge (terracotta, Section 4.2) -------------------------- */
export function VerifiedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: colors.terracotta,
        fontWeight: 700,
        fontSize: "var(--jk-secondary)",
        fontFamily: "var(--jk-font-ui)",
      }}
      aria-label="Verified organisation"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill={colors.terracotta} />
        <path d="M4.5 8.2l2.2 2.2 4.3-4.6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
      Verified
    </span>
  );
}

/* ---------- Cards ------------------------------------------------------------- */
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "var(--jk-s4)",
        fontFamily: "var(--jk-font-ui)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Form field: label above, error names the fix (UX laws #5,#A) ------ */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
  /** Error text MUST name the fix, e.g. "Your file is too big. Keep it under 10MB." */
  error?: string;
  onBlurSave?: () => void; // autosave hook (UX law #3)
}
export function Field({ label, help, error, onBlurSave, id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div style={{ marginBottom: "var(--jk-s4)" }}>
      <label
        htmlFor={inputId}
        style={{ display: "block", marginBottom: 4, fontSize: "var(--jk-body)", fontFamily: "var(--jk-font-ui)", color: colors.ink }}
      >
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : help ? `${inputId}-help` : undefined}
        onBlur={(e) => {
          rest.onBlur?.(e);
          onBlurSave?.();
        }}
        style={{
          width: "100%",
          minHeight: "var(--jk-touch-min)",
          padding: "12px",
          borderRadius: 8,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: "var(--jk-body)",
          fontFamily: "var(--jk-font-ui)",
          boxSizing: "border-box",
        }}
      />
      {help && !error && (
        <div id={`${inputId}-help`} style={{ fontSize: "var(--jk-secondary)", color: colors.ink, opacity: 0.75, marginTop: 4 }}>
          {help}
        </div>
      )}
      {error && (
        <div id={`${inputId}-err`} role="alert" style={{ fontSize: "var(--jk-secondary)", color: colors.danger, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

/* ---------- Toast -------------------------------------------------------------- */
export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "danger" }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: tone === "success" ? colors.success : colors.danger,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 8,
        fontFamily: "var(--jk-font-ui)",
        zIndex: 50,
      }}
    >
      {message}
    </div>
  );
}

/* ---------- Modal --------------------------------------------------------------- */
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(34,53,43,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "var(--jk-s5)",
          width: "100%",
          maxWidth: 560,
          fontFamily: "var(--jk-font-ui)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "var(--jk-page-title)", margin: "0 0 var(--jk-s4)" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
