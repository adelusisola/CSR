// Jikota design tokens — Section 4.2 brand law (never change).
// Single source of truth for palette, type scale, spacing, and radii.

export const colors = {
  deepGreen: "#1F4B38", // structure, headers, money figures
  terracotta: "#B85C38", // primary buttons, links, Verified badge, done milestones, match badge
  terracottaDark: "#96482B", // pressed
  cream: "#F5F0E6", // background
  border: "#E2DACC",
  ink: "#22352B",
  success: "#1B7F4D",
  danger: "#C0392B",
  warning: "#B7791F",
} as const;

export const fonts = {
  // Georgia/serif stack — brand headings and story surfaces only.
  brandSerif: "Georgia, 'Times New Roman', serif",
  // System sans stack — product UI.
  uiSans:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

// Body 16px, secondary 14px, section titles 20px, page titles 24px, hero 32px serif. Line height 1.5.
export const typeScale = {
  body: 16,
  secondary: 14,
  sectionTitle: 20,
  pageTitle: 24,
  hero: 32,
  lineHeight: 1.5,
} as const;

// Spacing scale 4/8/12/16/24/32.
export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32 } as const;

// UX law: 48px minimum touch targets.
export const touchTargetMin = 48;

export const radii = { chip: 999, card: 12, button: 8 } as const;

// CSS custom properties — import once in main.tsx via tokens.css generation below.
export const cssVariables = `
:root {
  --jk-deep-green: ${colors.deepGreen};
  --jk-terracotta: ${colors.terracotta};
  --jk-terracotta-dark: ${colors.terracottaDark};
  --jk-cream: ${colors.cream};
  --jk-border: ${colors.border};
  --jk-ink: ${colors.ink};
  --jk-success: ${colors.success};
  --jk-danger: ${colors.danger};
  --jk-warning: ${colors.warning};
  --jk-font-brand: ${fonts.brandSerif};
  --jk-font-ui: ${fonts.uiSans};
  --jk-body: ${typeScale.body}px;
  --jk-secondary: ${typeScale.secondary}px;
  --jk-section-title: ${typeScale.sectionTitle}px;
  --jk-page-title: ${typeScale.pageTitle}px;
  --jk-hero: ${typeScale.hero}px;
  --jk-line-height: ${typeScale.lineHeight};
  --jk-s1: ${space.s1}px;
  --jk-s2: ${space.s2}px;
  --jk-s3: ${space.s3}px;
  --jk-s4: ${space.s4}px;
  --jk-s5: ${space.s5}px;
  --jk-s6: ${space.s6}px;
  --jk-touch-min: ${touchTargetMin}px;
}
`;
