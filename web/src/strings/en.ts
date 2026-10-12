// Jikota strings — the FULL copy deck (Section 10). Never alter.
// Single source of words: every UI surface renders from this file.
// Mirrors COPY_DECK.md exactly.

export const SIGNOFF = "Jikota. Where purpose meets its people.";

export const en = {
  landing: {
    hero: {
      h1: "Where purpose meets its people.",
      sub: "Jikota connects Nigerian companies with verified grassroots projects. Funding is held safely and released only as the work is proven.",
    },
    cta: {
      ngo: "Register your NGO",
      company: "Fund a project",
    },
    pricing:
      "Funders pay the project budget plus delivery protection: 5% on the first ₦20M, less as projects grow, charged only as work is proven. NGOs join free.",
    trust: {
      labels: [
        "Verified organisations",
        "Live projects",
        "Naira held safely",
        "Impact reports delivered",
      ],
    },
    how: [
      "Organisations get verified",
      "Companies fund safely",
      "Work is proven, step by step",
      "Impact is documented for everyone to see",
    ],
    about: {
      intro:
        "Jikota is a social impact platform designed to connect companies seeking meaningful CSR opportunities with credible grassroots organisations and community-based projects. Inspired by the Igbo word jikọta, we simplify how organisations discover funding and how companies find, assess, and engage with impact partners. We believe impactful work deserves to be discovered, responsible investment deserves greater transparency, and meaningful partnerships should be easier to build.",
    },
    beliefs: [
      "Purpose exists everywhere. Those closest to a problem understand it best.",
      "Resources need the right pathways. Funding alone does not guarantee impact.",
      "Trust makes collaboration possible. Verification, clear expectations, and credible reporting.",
      "Impact reaches beyond the partnership. The true beneficiaries are the children who learn, the families supported, the communities with better healthcare.",
    ],
  },
  signup: {
    disclosure: {
      ngo: "Free to join, list, and get paid. NGOs that complete projects renew an annual Verified membership of ₦100,000.",
    },
  },
  onboarding: {
    submit: {
      success:
        "We review every organisation by hand. Expect an answer within 5 working days. We will call your references.",
    },
    doc: {
      help: "Take a clear photo of your certificate if you have no scanner.",
    },
  },
  project: {
    milestone: {
      help: "You always receive the full amounts you list.",
      sumcheck:
        "Milestone amounts must add up to your total budget. This is how money releases.",
    },
    budget: {
      sumcheck: "Lines must add up to your total budget.",
    },
  },
  checkout: {
    // Funder-surface strings ONLY (fee wall, Section 4.3 #13).
    full: "Project {program} + delivery protection {fee} = {total}. Fully funds this project.",
    partial:
      "You fund {amount} of {gap}. Your protection share: {share}. You pay {total}.",
    payline: "Pay securely by bank transfer to your project account number.",
    fullyfunded: "Fully funded",
  },
  approval: {
    // Funder-surface strings ONLY.
    cta: "Approve and release {amount} to the NGO",
    honesty: "Delivery protection {fee} releases to Jikota.",
    problem: "Raise a problem",
    confirm: "Approved. {amount} pays to the NGO's bank by next working day.",
  },
  composer: {
    header: "Milestone {n} of {total}: {title}. Due {date}.",
    confirm:
      "Sent. The funder has 5 working days to approve. Money releases after approval.",
  },
  money: {
    ngo: {
      held: "Held safely for your projects: {amount}",
      next: "Next release: {milestone}, due {date} — about {amount}",
      paid: "Paid to your bank so far: {amount}",
      payoutline: "Milestone {n} paid in full: {amount}",
    },
    membership: {
      ready: "Your membership is ready — ₦100,000/year keeps your badge and track record live.",
      benefits:
        "Your Verified badge · Your public track record page · 24-hour project review · Your priority WhatsApp line · First look at funder briefs",
    },
  },
  close: {
    report: "Your impact report is ready.",
    yearplan:
      "Most CSR teams plan next year's envelope now. Three live projects match your priorities.",
    yearplanCta: "Talk to us about a year plan",
    insight:
      "Your board will want December numbers. Insight builds them all year — you never touch a spreadsheet.",
    insightCta: "See Insight",
  },
  trackrecord: {
    intro:
      "Every project {org} has completed through Jikota, with the proof: milestones, spend, and the people reached.",
  },
  report: {
    cover: "{project}. Funded with trust. Proven, milestone by milestone.",
  },
  feed: {
    empty: "No live projects yet. New verified projects appear within days.",
  },
  share: {
    cta: "Copy link for your board",
  },
  orders: {
    visit: "Order site visit — ₦200,000",
    dossier: "Order due diligence dossier — ₦250,000",
  },
  errors: {
    filesize: "Your file is too big. Keep it under 10MB.",
    uploading: "Your photos are still uploading. Keep this screen open.",
    uploadfail: "Upload failed. We will retry automatically.",
    alreadyregistered:
      "That email is already registered. Try logging in instead.",
  },
  signoff: SIGNOFF,
} as const;

// Interpolation helper: t(en.checkout.full, { program, fee, total })
export function t(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export type Strings = typeof en;
