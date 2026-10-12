// Outbound email/SMS templates N1–N16, S1–S2 (Section 11).
// LAW: every email ends with the signoff; SMS uses the short form "Jikota."
// where character limits force it. Fee content only in funder-facing messages.
// N9 and S2 state full amounts, never a fee.
import { SIGNOFF } from "./en";

export interface EmailTemplate {
  subject: string;
  /** Rendered body MUST end with SIGNOFF. */
  body: string;
}
export interface SmsTemplate {
  sms: string;
}

const end = `\n\n${SIGNOFF}`;

// ---- NGO / verification ------------------------------------------------------
export const n1_application_received: EmailTemplate = {
  subject: "We received your Jikota application",
  body: `Hello {name}, thank you for applying. We review every organisation by hand and may call your references. Expect an answer within 5 working days. Reply with any question.${end}`,
};

export const n2_verified: EmailTemplate = {
  subject: "You are Verified on Jikota",
  body: `Good news. {org} is Verified and your badge is live. Create your first project: {link}. Tip: clear milestone amounts help funders trust your plan. Joining, listing, and getting paid are always free.${end}`,
};

export const n3_rejected: EmailTemplate = {
  subject: "Your Jikota application needs changes",
  body: `We could not verify {org}. Reason: {reason}. Fix it and send again: {link}. If this looks like a mistake, reply to this email.${end}`,
};

// ---- Funder-facing (fee content allowed ONLY here) ----------------------------
export const n4_interest_confirmed: EmailTemplate = {
  subject: "Funding confirmed: {project}",
  body: `{company} and {org} are connected on {project} for {amount}. Next: {company} pays the total, including delivery protection, into Jikota's safe holding within 5 working days. You will get an email the moment the money is held.${end}`,
};

// ---- NGO money surfaces (full amounts, never a fee) ---------------------------
export const n5_funds_held: EmailTemplate = {
  subject: "Money is held for {project}",
  body: `{company} paid {total}. The full {program_amount} is held safely for your project and releases milestone by milestone as you prove the work. First milestone: {m1}, due {date}.${end}`,
};

export const n6_milestone_due: EmailTemplate = {
  subject: "Update due: {milestone}",
  body: `Your update for {milestone} is due {date}. It takes about 5 minutes: add photos and a short note. {link}${end}`,
};

// ---- Funder approval flow (delivery protection named — funder surface) --------
export const n7_approval_needed: EmailTemplate = {
  subject: "Approve milestone: {project}",
  body: `{org} posted proof for {milestone}. Approve to release {amount} to them, or raise a problem. 5 working days to respond; it releases automatically after 7. {link}${end}`,
};

export const n8_auto_release: EmailTemplate = {
  subject: "Milestone released automatically",
  body: `We did not hear back about {milestone}, so it released to {org} as planned. This keeps projects moving. {link}${end}`,
};

export const n9_payout: EmailTemplate = {
  subject: "You got paid: ₦{amount}",
  body: `Milestone {n} approved. We sent the full ₦{amount} to your bank ({bank}, ••{last4}). Next milestone: {title}, due {date}.${end}`,
};

// ---- Disputes -----------------------------------------------------------------
export const n10_dispute_opened: EmailTemplate = {
  subject: "A problem was raised on {project}",
  body: `Jikota froze the next release on {project} while we look into this. Our team contacts both sides within 1 working day.${end}`,
};

export const n11_dispute_resolved: EmailTemplate = {
  subject: "Resolved: {project}",
  body: `Outcome: {resolution}. {next_steps}.${end}`,
};

// ---- Funder refund (protection share named — funder surface) -------------------
export const n12_refund: EmailTemplate = {
  subject: "Your refund for {project}",
  body: `We returned ₦{amount} to you because {reason}. This includes your share of the unearned delivery protection. Processing costs are not refundable. 5–10 working days.${end}`,
};

export const n13_report_ready: EmailTemplate = {
  subject: "Impact report ready: {project}",
  body: `{project} is complete: beneficiaries reached, spend, photos, full timeline. Download: {link}. Inside you will also find three live projects matched to your priorities, and a look at Insight, which builds your December numbers all year.${end}`,
};

// ---- Membership (brand voice; operating account, isolated from escrow) --------
export const n14_membership_request: EmailTemplate = {
  subject: "Your Jikota membership is ready to renew",
  body: `{Name}, congratulations again on completing {project}. {beneficiary_count} people reached. Every milestone approved. ₦{total} paid to your account, in full, on schedule. That is what Jikota exists to do, and you did the work that proved it. Your Verified membership now renews: ₦100,000 per year. It keeps your Verified badge, your public track record page, 24-hour project review, your priority WhatsApp line, and first access to funder briefs. Pay to: {operating_account, Jikota Ltd}. Reference: {org_code}. If this is a difficult month, reply to this message. We will arrange a deferral, no questions. Thank you for building with us.${end}`,
};

export const n15_renewal_reminder: EmailTemplate = {
  subject: "Your Jikota membership renews soon",
  body: `Your membership year ends {date}. ₦100,000 renews your badge, track record page, priority review, WhatsApp line, and first look at briefs. Pay to: {account}, ref {org_code}.${end}`,
};

export const n16_ladder_final_notice: EmailTemplate = {
  subject: "Action needed: your Jikota membership",
  body: `Your membership lapsed {days} days ago. In 30 days we will pause new project listings. Your badge, completed projects, reports, and payouts are never affected. To keep listing: {account}, ₦100,000, ref {org_code}. Or reply for a deferral.${end}`,
};

// ---- SMS (short form "Jikota." — character limits force it) --------------------
// Short-form signoff "Jikota." closes every SMS (character limits force it — Section 10).
export const s1_sms_update_due: SmsTemplate = {
  sms: `Jikota: update for {project_short} is due Friday. Add photos and a note in 5 mins: {short_link} Jikota.`,
};

export const s2_sms_payout: SmsTemplate = {
  sms: `Jikota: ₦{amount} sent to your {bank} account ••{last4}. Jikota.`,
};

export const outboundEmails = {
  n1_application_received, n2_verified, n3_rejected, n4_interest_confirmed,
  n5_funds_held, n6_milestone_due, n7_approval_needed, n8_auto_release,
  n9_payout, n10_dispute_opened, n11_dispute_resolved, n12_refund,
  n13_report_ready, n14_membership_request, n15_renewal_reminder,
  n16_ladder_final_notice,
} as const;

export const outboundSms = { s1_sms_update_due, s2_sms_payout } as const;
