// Mobile shell — UX law #10 (WhatsApp help on every screen) and Section 4.3
// bottom tab bar: NGO Home/Projects/Money/Profile; Company Home/Discover/Money/Profile.
// Desktop: left sidebar with the same destinations. Every icon has a text label (#4).
import type { ReactNode } from "react";
import { colors } from "../lib/tokens";
import { Wordmark } from "./Mark";
import type { Role } from "../lib/supabase";

const TABS: Record<"ngo" | "company", { key: string; label: string }[]> = {
  ngo: [
    { key: "home", label: "Home" },
    { key: "projects", label: "Projects" },
    { key: "money", label: "Money" },
    { key: "profile", label: "Profile" },
  ],
  company: [
    { key: "home", label: "Home" },
    { key: "discover", label: "Discover" },
    { key: "money", label: "Money" },
    { key: "profile", label: "Profile" },
  ],
};

// Simple line icons paired with visible text labels (never icon alone).
function TabIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="M3 10l7-6 7 6v7h-4v-4h-6v4H3z" />,
    projects: <path d="M4 4h12v3H4zM4 9h12v3H4zM4 14h8v3H4z" />,
    discover: <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-2 8l5-3-2 6-3-3z" />,
    money: <path d="M2 5h16v10H2zM10 8a2 2 0 100 4 2 2 0 000-4z" />,
    profile: <path d="M10 3a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM3 17c1.5-3 4-4 7-4s5.5 1 7 4z" />,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={colors.ink} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

interface ShellProps {
  role: "ngo" | "company";
  activeTab: string;
  screenName: string; // used to pre-fill WhatsApp deep link
  orgName: string;
  onTab?: (key: string) => void;
  children: ReactNode;
}

export function AppShell({ role, activeTab, screenName, orgName, onTab, children }: ShellProps) {
  const tabs = TABS[role];
  const waText = encodeURIComponent(`Hello, I need help with ${screenName}. Organisation: ${orgName}.`);
  const waHref = `https://wa.me/2348000000000?text=${waText}`;

  return (
    <div style={{ fontFamily: "var(--jk-font-ui)", backgroundColor: colors.cream, minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: colors.deepGreen,
          color: colors.cream,
          padding: "12px var(--jk-s4)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Wordmark on="green" />
      </header>

      <div style={{ display: "flex" }}>
        {/* Desktop sidebar (same destinations as mobile tabs) */}
        <nav
          aria-label="Main navigation (desktop)"
          style={{
            display: "none",
            minWidth: 200,
            padding: "var(--jk-s4)",
            gap: "var(--jk-s2)",
            flexDirection: "column",
          }}
          className="jk-sidebar"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab?.(t.key)}
              aria-current={activeTab === t.key ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minHeight: "var(--jk-touch-min)",
                background: activeTab === t.key ? colors.border : "transparent",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: "var(--jk-body)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <TabIcon name={t.key} /> {t.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: "var(--jk-s4)", paddingBottom: 96 }}>{children}</main>
      </div>

      {/* WhatsApp help button — present on every screen, deep link pre-filled */}
      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Get help on WhatsApp"
        style={{
          position: "fixed",
          right: 16,
          bottom: 72,
          zIndex: 30,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: "var(--jk-touch-min)",
          padding: "8px 16px",
          borderRadius: 999,
          backgroundColor: colors.success,
          color: "#fff",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff" aria-hidden="true">
          <path d="M10 2a8 8 0 00-6.9 12L2 18l4.1-1A8 8 0 1010 2z" />
        </svg>
        WhatsApp help
      </a>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          backgroundColor: "#fff",
          borderTop: `1px solid ${colors.border}`,
          zIndex: 20,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTab?.(t.key)}
            aria-current={activeTab === t.key ? "page" : undefined}
            style={{
              flex: 1,
              minHeight: "var(--jk-touch-min)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              border: "none",
              background: "none",
              fontSize: "var(--jk-secondary)",
              color: activeTab === t.key ? colors.terracotta : colors.ink,
              cursor: "pointer",
            }}
          >
            <TabIcon name={t.key} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/** Role helper for callers that hold the full user role. */
export function shellTabsFor(role: Role): { key: string; label: string }[] | null {
  return role === "ngo" || role === "company" ? TABS[role] : null;
}
