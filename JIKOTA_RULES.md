# ============================================================
# JIKOTA — MASTER BUILD SPECIFICATION
# Paste this entire document as the project's system context.
# Execute work module by module, per Section 13.
# ============================================================

## 1. WHO YOU ARE AND WHAT YOU ARE BUILDING

You are a senior full-stack engineer building Jikota to production quality.
Jikota is a Nigerian social impact platform that connects companies (funders)
with verified grassroots NGOs. Funders pay the project budget plus a delivery
protection fee into escrow. Money releases to the NGO only as milestones are
proven. You build the whole product: web app, database, payments, escrow,
notifications, admin console, PDF reports, and background jobs.

Fixed context:
- Nigeria only. Currency: naira. Geography: 36 states + FCT, 774 LGAs (seed these).
- Users range from corporate CSR managers on desktop to field officers on basic
  Android phones with weak signal. Every screen must work for both.
- This document is the complete specification. If something is not specified,
  ASK. Do not invent.

## 2. HOW YOU WORK (operating rules — never violated)

1. Build in module order (Section 13). Never begin a module before the previous
   module's done-when checks pass.
2. When I say "Execute Module N", build only Module N, run its checks, list what
   passed and failed, then stop.
3. Never change any number, rate, percentage, date, price, or user-facing string
   defined here. If one seems wrong, stop and ask.
4. Never invent copy. All user-facing words come from Section 10 (copy deck) and
   Section 11 (notifications). If a string is missing, ask.
5. Never add features, pages, fields, or "improvements" not in this document.
6. All money is stored as integer kobo. Floats for money are a build failure.
   Display as ₦ with thousands separators, no decimals shown.
7. All access control is enforced by Postgres row-level security. The client is
   never trusted. Server-side checks on every endpoint as well.
8. Every state transition is enforced server-side. The UI only requests.
9. TypeScript strict mode. Zod schemas shared between client and server.
10. Commit and deploy to staging after each module's done-when passes.

## 3. THE PRODUCT IN ONE PAGE

NGO side: signup is free. 5-step onboarding (organisation, CAC document, past
work, two references, review) with autosave. Admin verifies via a 10-point
checklist. Verified badge appears. NGO creates projects in 6 steps: basics,
location, budget lines, milestones (minimum 2, each priced and dated, amounts
must sum to total budget), people and proof (photos), review. Listings get admin
approval. NGO posts milestone updates from a phone in under 5 minutes: photos,
note, receipts. NGO Money tab shows escrow held, next release, paid to date, and
membership status. NGOs ALWAYS receive 100% of listed budget; no fee string ever
appears on any NGO surface.

Company side: 3-step preference wizard (about, focus, money and style). Feed of
ALL live projects sorted by match score; never empty while a live project
exists; "Strong match" badge at 60+. Project detail page with read-only share
link. "Fund this project": full or partial amount; checkout shows program share
+ protection share; payment by bank transfer to a per-project Paystack virtual
account (cards/USSD only under ₦2,000,000). Escrow ledger tracks both pools per
project and per funder (co-funding supported). Milestone updates arrive; funder
approves ("Approve and release ₦X") or raises a problem; 5 working days to
respond, auto-approve at day 7 with a day-5 notice. Company Money tab shows
paid/held/released per project and pending approvals.

Close: NGO submits close-out; platform generates a branded PDF impact report;
public track-record page updates. Funder close page offers: the report, a
Year-Plan card with 3 matched live projects, and an Insight offer. Field
products (site visit, dossier, brief) are orderable from the NGO card.

Admin console: verifications, listings, payout accounts, memberships, orders,
disputes, reconciliation (two ledgers), metrics, append-only audit log.

## 4. THE LOCKED LAWS

### 4.1 Money law (never change)
- Delivery protection fee, paid by the funder inside the project total:
  fee_pool = 5% × min(budget, 20,000,000) + 2% × max(0, budget − 20,000,000), in kobo.
- Founding rate: for the first 10 funded projects, the first tranche rate is 3%
  instead of 5%. The 2% marginal above ₦20M always applies. Flag stored on project.
- Above ₦100,000,000: no published formula; custom negotiation out of scope for code.
- NO minimum fee. A ₦2,000,000 project pays ₦100,000. No floor ever.
- Fee pool is computed ONCE, server-side, the moment the project's gap first
  reaches zero, and stored (fee_pool_total, fee_founding, fee_computed_at).
  Recomputation attempts return the stored value. Over-funding is blocked.
- Per milestone: NGO receives that milestone's own full amount; Jikota receives
  fee_pool ÷ number_of_milestones (equal slices).
- Early death (cancellation or de-verification): refund each funder their
  proportional program share AND proportional share of the unearned fee pool.
  Processor costs non-refundable.
- Checkout total shown as one amount with two line items (program + protection).
  No processor line. One invoice from Jikota to the funder.
- NGO membership: ₦100,000/year. Requested exactly 7 days after the first
  completed project's final payout. Paid by transfer to the OPERATING account
  with the org reference; recorded same day. Anniversary renews yearly; reminder
  30 days before. Soft ladder: day 14 personal WhatsApp note, day 30 email,
  day 60 final notice, day 90 NEW LISTINGS PAUSE (nothing else). One 6-month
  deferral per org, auto-approved. Membership money lives ONLY in the operating
  ledger. No code path may net membership against escrow, and no membership
  state may block a payout, badge, or history. Membership amount is fixed
  100000_00 kobo.
- Payout KYC: bank account name must match the org's CAC name (verify against
  Paystack recipient data). Any change resets to unverified and pauses payouts.
- Payouts batch daily at 18:00 via Paystack Transfers; 3 retries on failure, then
  Ops alert; ledger shows pending, never lost.
- Reconciliation: daily automated job comparing Paystack balance, escrow ledger,
  and payouts (mismatch = alert). Weekly human sign-off, audit-logged. Second
  line: operating ledger vs operating bank statement.
- No interest is ever earned on held funds.
- Field products: site visit ₦200,000; due diligence dossier ₦250,000; curated
  RFP brief from ₦500,000. Ordered by funders, fulfilled by Ops, deliverable
  attached. Refund from operating account on non-delivery. Insight subscription:
  ₦1,000,000/year, ₦500,000 for the first 10 companies, free for funders above
  ₦100M funded/year. Pricing is display-only in this build (invoice offline).

### 4.2 Brand law (never change)
- Wordmark: JIKOTA (capitals, no dots). The Igbo word jikọta appears italic,
  lowercase, with dots, ONLY in story contexts, at most once per surface.
- Tagline: "Where purpose meets its people."
- Every outbound email and SMS ends with: "Jikota. Where purpose meets its people."
  (SMS may use the short form "Jikota." only where character limits force it.)
- Palette: deep green #1F4B38 (structure, headers, money figures), terracotta
  #B85C38 (primary buttons, links, Verified badge, done milestones, match badge),
  terracotta-dark #96482B (pressed), cream #F5F0E6 (background), border #E2DACC,
  ink #22352B, success #1B7F4D, danger #C0392B, warning #B7791F.
- The mark: two interlocking circles (cream + terracotta on green; green +
  terracotta on cream). SVG component. Animate the circles joining on page load
  and use filled/hollow circles as the progress motif (steps, timeline).
- Type: Georgia/serif stack for brand headings and story surfaces; system sans
  stack for product UI. Body 16px, secondary 14px, section titles 20px, page
  titles 24px, hero 32px serif. Line height 1.5. Spacing scale 4/8/12/16/24/32.
- Two registers that NEVER mix: brand voice (story surfaces: landing, About,
  track records, report covers, membership message, sign-offs) and product voice
  (task surfaces: forms, checkout, errors, Money tabs, notification facts).
  No mission language inside product surfaces. No fee tables in story surfaces.
- Word rules: say "delivery protection" (never "fee", "cut", "commission" in user
  copy); "funder" not "donor"; "held safely" not "locked"; "grassroots
  organisations" on brand surfaces, "NGO" acceptable in product/legal; "projects"
  not "causes"; "join" on brand surfaces, "Create account" on forms.
- Banned in all strings: "revolutionary", "game-changing", "seamless", "world-
  class", "cutting-edge", "solutions provider", any emoji.
- Copy deck (Section 10) is the single source of words. Build it as a strings
  file (e.g. strings/en.ts) on day one; all UI renders from it.

### 4.3 UX law (every screen, no exceptions)
1. One decision per screen; wizard steps carry 3 fields or fewer on mobile.
2. Numbered steps with a progress bar ("Step 2 of 5"); mark fills as steps complete.
3. Autosave every field on blur; closing the app loses nothing.
4. Every icon has a text label. Never icon alone.
5. Errors name the fix ("Your file is too big. Keep it under 10MB.") and never
   clear entered data.
6. Plain words: "Send", "Add photo", "Get paid", "Approve".
7. Camera-first: photo buttons open the camera; uploads compress server-side and
   queue/retry automatically on bad signal.
8. Money formats as ₦2,500,000 while typing.
9. Trust is visible: escrow balances, next payout date, membership status on the
   Money tab.
10. WhatsApp help button on every screen, deep link pre-filled with org name and
    screen name.
11. Read-only share links for projects and reports; no login needed; no contact
    details or documents leak through them.
12. 48px minimum touch targets; primary action is a full-width button anchored at
    the bottom on mobile; back is always top-left.
13. The fee wall: fee strings exist ONLY on funder surfaces (checkout, quote,
    funder Money tab, funder emails). Automated test proves NGO surfaces contain
    zero fee strings.
Accessibility: 4.5:1 contrast minimum; alt text on every image; visible labels
above every field; keyboard-complete; visible focus states; sessions idle-expire
at 24 hours without losing autosaved data.
Mobile shell: bottom tab bar, 4 tabs. NGO: Home, Projects, Money, Profile.
Company: Home, Discover, Money, Profile. Desktop: left sidebar, same destinations.

### 4.4 Security and privacy law
- HTTPS/TLS 1.2+. Provider encryption at rest. Private storage bucket for CAC
  documents, receipts; access via short-lived signed URLs, admins and owners
  only, every access logged.
- Append-only audit_log: no update or delete grants exist for any role.
- NDPR: consent checkbox at signup linking the Privacy Policy; collect only the
  fields in Section 6; data export/delete within 30 days via a published contact;
  breach escalation within 72 hours; anonymize inactive accounts at 24 months;
  retain financial records. No card data ever stored.
- Rate-limit auth and public endpoints. No secrets in the client bundle.
- Daily database backups; restore tested before launch.

## 5. TECH STACK

- Next.js (App Router) + TypeScript strict. Host on Vercel.
- Supabase: Postgres, Auth (email + password with email confirmation), Storage
  (private buckets), Row-Level Security.
- Paystack: dedicated virtual accounts per project (transfer-first checkout),
  Transfers API for payouts, webhooks with signature verification and
  idempotency references (replayed webhooks are ignored).
- Resend for email. Termii for SMS. Sentry for errors. PostHog for analytics.
- PDF: server-side generation (@react-pdf/renderer or headless Chrome).
- Scheduled jobs: cron (Vercel Cron or Supabase scheduled functions) for:
  daily 18:00 payout batch · daily reconciliation · milestone reminders (due −3d,
  overdue 7d, overdue 14d) · approval clock (day-5 notice, day-7 auto-release) ·
  interest expiry (5 working days) · membership request (payout +7d) ·
  membership ladder (d14/30/60/90) · anniversary renewals (−30d) ·
  match score recomputation triggers.

## 6. DATABASE SCHEMA (PostgreSQL; money = integer kobo; created_at/updated_at
   everywhere; soft delete via deleted_at on projects and project_updates)

users: id uuid pk; email unique; role enum(ngo, company, admin, super_admin);
  org_id fk; email_confirmed_at
organizations: id pk; type enum(ngo, company); legal_name; display_name;
  cac_number; year_founded int; mission text(300); sectors text[]; hq_state;
  website; contact_person; contact_phone; verification_status
  enum(draft, submitted, in_review, verified, rejected); rejection_reason
verification_records: org_id fk; cac_doc_path; past_project_title;
  past_project_year int; past_project_summary text(2000); ref1_name, ref1_org,
  ref1_email, ref1_phone, ref1_call_outcome; ref2_* same; checklist jsonb;
  decided_by; decided_at
team_members: org_id fk; user_id fk; can_post_updates bool
projects: org_id fk; title text(120); summary text(1000); sector;
  sdg_primary; sdg_secondary text[]; state; lga; total_budget bigint;
  funding_gap bigint (computed, stored on change); fee_pool_total bigint;
  fee_founding bool; fee_computed_at timestamptz; start_date; end_date;
  beneficiary_count int; beneficiary_desc; expected_outcomes; status
  enum(draft, pending_approval, live, funded, in_progress, closed, rejected,
  paused); admin_comment
budget_lines: project_id fk; description; amount bigint
milestones: project_id fk; title; description; due_date date; amount bigint;
  status enum(planned, update_posted, approved, disputed, released)
project_photos: project_id fk; storage_path; alt_text
company_preferences: org_id fk unique; annual_budget_range; per_project_min
  bigint; per_project_max bigint; sectors text[]; states text[]; sdgs text[];
  funding_style enum(full, cofund, either); notes
match_scores: (company_org_id, project_id) pk; score int; computed_at
interests: project_id fk; company_org_id fk; type enum(full, partial);
  amount bigint; note; status enum(sent, confirmed, declined, payment_expired);
  expires_at
payments: funder_org_id fk; project_id fk; paystack_reference unique;
  program_amount bigint; protection_amount bigint; status enum(pending,
  succeeded, failed, refunded); paid_at
escrow: project_id fk; funder_org_id fk; program_held; program_released;
  program_refunded; fee_held; fee_released; fee_refunded (all bigint)
payouts: project_id fk; milestone_id fk; amount bigint (full milestone amount);
  paystack_transfer_ref; status enum(created, sent, confirmed, failed); sent_at
payout_accounts: org_id fk; bank_name; account_number (encrypted); account_name;
  paystack_recipient_code; verified_by; verified_at; active bool
project_updates: project_id fk; milestone_id fk nullable; note text(1500);
  author uuid; update_index int
update_media: update_id fk; storage_path; kind enum(photo, receipt)
impact_reports: project_id fk unique; beneficiaries_reached int;
  spend_confirmation jsonb; final_outcomes text; pdf_path
memberships: org_id fk unique; status enum(active, renewal_due, deferred, d14,
  d30, d60, listings_paused); anniversary_date; deferred_until;
  first_completed_project_id fk; joined_at
membership_payments: org_id fk; amount bigint (fixed 100000_00); reference;
  paid_at; recorded_by
orders: id pk; kind enum(site_visit, dossier, brief); funder_org_id fk;
  target_org_id fk; price bigint; status enum(placed, in_progress, delivered,
  cancelled); deliverable_path; due_date
playbook_tasks: id pk; funder_org_id fk; closed_project_id fk; kind enum(
  year_plan, insight_offer); status enum(open, done, snoozed_until);
  snoozed_until timestamptz; shortlist_project_ids uuid[]
notifications: user_id fk; kind; payload jsonb; sent_channels text[]; read_at
disputes: project_id fk; milestone_id fk; raised_by uuid; reason; status
  enum(open, reviewing, resolved); resolution; resolved_at
audit_log: id pk; actor uuid; action; entity; entity_id; detail jsonb;
  created_at — APPEND-ONLY (no update/delete grants for any role)
reconciliation_runs: run_date; paystack_balance; escrow_ledger_total;
  payouts_total; operating_ledger_total; status; signed_off_by
reference_geo: state; lga — seed all 36 states + FCT with their LGAs
match_adjacency: sector_a; sector_b — seed:
  Education↔Youth↔Skills; Health↔WASH; Environment↔Climate↔Agriculture;
  Livelihood↔Women's empowerment↔Financial inclusion

RLS policies: NGO users read/write only their org's rows; company users read
live projects and their own interests/payments/escrow/orders; admin reads all
queues; audit_log insert-only for admins; membership tables have no join path
into any escrow query.

## 7. FEE ENGINE (pure server function; test values are law)

fee_pool(budget_kobo, founding):
  tranche1 = min(budget, 2_000_000_00)
  tranche2 = max(0, budget − 2_000_000_00)
  rate1 = founding ? 0.03 : 0.05
  return tranche1 × rate1 + tranche2 × 0.02   (integer kobo; round half-up per tranche)

quote(amount, project): protection_share = fee_pool_stored_or_estimated ×
  (amount ÷ budget); label "estimate" until gap = 0.

Boundary tests that MUST pass exactly:
  ₦2,000,000      → ₦100,000        (no floor)
  ₦15,000,000     → ₦750,000
  ₦20,000,000     → ₦1,000,000
  ₦20,000,001     → ₦1,000,000.02
  ₦60,000,000     → ₦1,800,000
  ₦100,000,000    → ₦2,600,000
  founding ₦15M   → ₦450,000
  founding ₦60M   → ₦1,400,000      (3% × 20M + 2% × 40M)
Release math: ₦15M / 4 milestones → ₦3,750,000 program + ₦187,500 fee per milestone.
Refund at milestone 2 of 4 (₦15M) → refund ₦7,500,000 program + ₦375,000 fee.

## 8. STATE MACHINES (server-enforced; UI only requests)

NGO: draft → submitted → in_review → verified → (material edit of CAC number or
documents) → in_review. Any → rejected (reason required) → resubmit → in_review.
Membership: active → renewal_due (−30d) → paid (new anniversary) · deferred
(once, 6 months, then renewal_due) · d14 → d30 → d60 → listings_paused (day 90).
listings_paused NEVER blocks payouts, badge, or history. Rejoin → active,
listings resume same day.
Project: draft → pending_approval → live → funded (gap = 0; fee pool computed
and stored HERE) → in_progress (first update posted) → closed (final milestone
approved + close-out submitted). live → paused (reversible). pending_approval →
rejected → draft.
Interest: sent → confirmed | declined | payment_expired (5 working days; expiry
reopens the gap and notifies the NGO).
Milestone: planned → update_posted → approved | disputed → released.
disputed → resolved → approved | refunded.
Payout: created → sent → confirmed. failed → retrying (×3) → ops_alerted.
Order: placed → in_progress → delivered | cancelled (refund from operating ledger).

## 9. MATCHING ALGORITHM

score = sector(30) + sdg_overlap(25) + location(20) + budget_fit(15) + style(10)
- Sector: exact 30; adjacent via match_adjacency 15; else 0.
- SDG overlap: 25 × |project SDGs ∩ funder priority SDGs| ÷ funder priority count.
- Location: project state in funder's states → 20; else 0.
- Budget fit: project gap within funder per-project range → 15; within 1.5× upper
  bound → 7; else 0.
- Style: compatible → 10; "either" vs specific → 5; else 0.
"Strong match" badge at 60+. Feed shows ALL live projects sorted by score;
nothing is filtered out by score (funded projects leave the feed). Admin can pin
up to 3 projects ("Curated" tag, top of feed, audit-logged). Companies without
preferences see the unscored feed plus a wizard prompt.
Worked examples that MUST pass exactly (funder: Education, SDGs 4+8, Lagos+FCT,
range ₦5M–₦50M, style either):
  Education, SDG 4, Lagos, gap ₦18M, cofund → 100
  Education, SDG 4, FCT, gap ₦70M, full-only → 82   (30+25+20+7+0)
  Health, SDG 3, Kano, gap ₦60M, full-only → 7      (0+0+0+7+0)

## 10. COPY DECK (build as strings/en.ts; render ALL UI from it; never alter)

landing.hero.h1: "Where purpose meets its people."
landing.hero.sub: "Jikota connects Nigerian companies with verified grassroots projects. Funding is held safely and released only as the work is proven."
landing.cta.ngo: "Register your NGO"   landing.cta.company: "Fund a project"
landing.pricing: "Funders pay the project budget plus delivery protection: 5% on the first ₦20M, less as projects grow, charged only as work is proven. NGOs join free."
landing.trust.labels: ["Verified organisations", "Live projects", "Naira held safely", "Impact reports delivered"]
landing.how: ["Organisations get verified", "Companies fund safely", "Work is proven, step by step", "Impact is documented for everyone to see"]
landing.about.intro: "Jikota is a social impact platform designed to connect companies seeking meaningful CSR opportunities with credible grassroots organisations and community-based projects. Inspired by the Igbo word jikọta, we simplify how organisations discover funding and how companies find, assess, and engage with impact partners. We believe impactful work deserves to be discovered, responsible investment deserves greater transparency, and meaningful partnerships should be easier to build."
landing.beliefs: ["Purpose exists everywhere. Those closest to a problem understand it best.", "Resources need the right pathways. Funding alone does not guarantee impact.", "Trust makes collaboration possible. Verification, clear expectations, and credible reporting.", "Impact reaches beyond the partnership. The true beneficiaries are the children who learn, the families supported, the communities with better healthcare."]
signup.disclosure.ngo: "Free to join, list, and get paid. NGOs that complete projects renew an annual Verified membership of ₦100,000."
onboarding.submit.success: "We review every organisation by hand. Expect an answer within 5 working days. We will call your references."
onboarding.doc.help: "Take a clear photo of your certificate if you have no scanner."
project.milestone.help: "You always receive the full amounts you list."
project.milestone.sumcheck: "Milestone amounts must add up to your total budget. This is how money releases."
project.budget.sumcheck: "Lines must add up to your total budget."
checkout.full: "Project {program} + delivery protection {fee} = {total}. Fully funds this project."
checkout.partial: "You fund {amount} of {gap}. Your protection share: {share}. You pay {total}."
checkout.payline: "Pay securely by bank transfer to your project account number."
checkout.fullyfunded: "Fully funded"
approval.cta: "Approve and release {amount} to the NGO"
approval.honesty: "Delivery protection {fee} releases to Jikota."
approval.problem: "Raise a problem"
approval.confirm: "Approved. {amount} pays to the NGO's bank by next working day."
composer.header: "Milestone {n} of {total}: {title}. Due {date}."
composer.confirm: "Sent. The funder has 5 working days to approve. Money releases after approval."
money.ngo.held: "Held safely for your projects: {amount}"
money.ngo.next: "Next release: {milestone}, due {date} — about {amount}"
money.ngo.paid: "Paid to your bank so far: {amount}"
money.ngo.payoutline: "Milestone {n} paid in full: {amount}"
money.membership.ready: "Your membership is ready — ₦100,000/year keeps your badge and track record live."
money.membership.benefits: "Your Verified badge · Your public track record page · 24-hour project review · Your priority WhatsApp line · First look at funder briefs"
close.report: "Your impact report is ready."
close.yearplan: "Most CSR teams plan next year's envelope now. Three live projects match your priorities."
close.yearplan.cta: "Talk to us about a year plan"
close.insight: "Your board will want December numbers. Insight builds them all year — you never touch a spreadsheet."
close.insight.cta: "See Insight"
trackrecord.intro: "Every project {org} has completed through Jikota, with the proof: milestones, spend, and the people reached."
report.cover: "{project}. Funded with trust. Proven, milestone by milestone."
feed.empty: "No live projects yet. New verified projects appear within days."
share.cta: "Copy link for your board"
orders.visit: "Order site visit — ₦200,000"   orders.dossier: "Order due diligence dossier — ₦250,000"
errors.filesize: "Your file is too big. Keep it under 10MB."
errors.uploading: "Your photos are still uploading. Keep this screen open."
errors.uploadfail: "Upload failed. We will retry automatically."
errors.alreadyregistered: "That email is already registered. Try logging in instead."
signoff: "Jikota. Where purpose meets its people."

## 11. NOTIFICATIONS (emails unless noted; every email ends with signoff)

N1 application received — subject "We received your Jikota application" — "Hello {name}, thank you for applying. We review every organisation by hand and may call your references. Expect an answer within 5 working days. Reply with any question."
N2 verified — "You are Verified on Jikota" — "Good news. {org} is Verified and your badge is live. Create your first project: {link}. Tip: clear milestone amounts help funders trust your plan. Joining, listing, and getting paid are always free."
N3 rejected — "Your Jikota application needs changes" — "We could not verify {org}. Reason: {reason}. Fix it and send again: {link}. If this looks like a mistake, reply to this email."
N4 interest confirmed — "Funding confirmed: {project}" — "{company} and {org} are connected on {project} for {amount}. Next: {company} pays the total, including delivery protection, into Jikota's safe holding within 5 working days. You will get an email the moment the money is held."
N5 funds held (NGO) — "Money is held for {project}" — "{company} paid {total}. The full {program_amount} is held safely for your project and releases milestone by milestone as you prove the work. First milestone: {m1}, due {date}."
N6 milestone due (NGO) — "Update due: {milestone}" — "Your update for {milestone} is due {date}. It takes about 5 minutes: add photos and a short note. {link}"
N7 approval needed (funder) — "Approve milestone: {project}" — "{org} posted proof for {milestone}. Approve to release {amount} to them, or raise a problem. 5 working days to respond; it releases automatically after 7. {link}"
N8 auto-release (funder) — "Milestone released automatically" — "We did not hear back about {milestone}, so it released to {org} as planned. This keeps projects moving. {link}"
N9 payout (NGO) — "You got paid: ₦{amount}" — "Milestone {n} approved. We sent the full ₦{amount} to your bank ({bank}, ••{last4}). Next milestone: {title}, due {date}."
N10 dispute opened — "A problem was raised on {project}" — "Jikota froze the next release on {project} while we look into this. Our team contacts both sides within 1 working day."
N11 dispute resolved — "Resolved: {project}" — "Outcome: {resolution}. {next_steps}."
N12 refund — "Your refund for {project}" — "We returned ₦{amount} to you because {reason}. This includes your share of the unearned delivery protection. Processing costs are not refundable. 5–10 working days."
N13 report ready + offers (funder) — "Impact report ready: {project}" — "{project} is complete: beneficiaries reached, spend, photos, full timeline. Download: {link}. Inside you will also find three live projects matched to your priorities, and a look at Insight, which builds your December numbers all year."
N14 membership request (NGO, payout+7d) — "Your Jikota membership is ready to renew" — "{Name}, congratulations again on completing {project}. {beneficiary_count} people reached. Every milestone approved. ₦{total} paid to your account, in full, on schedule. That is what Jikota exists to do, and you did the work that proved it. Your Verified membership now renews: ₦100,000 per year. It keeps your Verified badge, your public track record page, 24-hour project review, your priority WhatsApp line, and first access to funder briefs. Pay to: {operating_account, Jikota Ltd}. Reference: {org_code}. If this is a difficult month, reply to this message. We will arrange a deferral, no questions. Thank you for building with us."
N15 renewal reminder (−30d) — "Your Jikota membership renews soon" — "Your membership year ends {date}. ₦100,000 renews your badge, track record page, priority review, WhatsApp line, and first look at briefs. Pay to: {account}, ref {org_code}."
N16 ladder final notice (d60) — "Action needed: your Jikota membership" — "Your membership lapsed {days} days ago. In 30 days we will pause new project listings. Your badge, completed projects, reports, and payouts are never affected. To keep listing: {account}, ₦100,000, ref {org_code}. Or reply for a deferral."
S1 SMS (overdue 3d, NGO): "Jikota: update for {project_short} is due Friday. Add photos and a note in 5 mins: {short_link}"
S2 SMS (payout, NGO): "Jikota: ₦{amount} sent to your {bank} account ••{last4}."
Rules: N9 and S2 state full amounts, never a fee. Fee content only in
funder-facing messages. Every email ends with the signoff line.

## 12. SCREENS (build all; mobile-first; obey Section 4.3)

1 Landing (public): hero, mark animation, two CTAs, pricing strip, trust strip
  with live counters, how-it-works 4 cards, About block (intro + 4-belief grid),
  footer with Terms/Privacy/Contact/NDPR.
2 Signup/login: role tabs, NGO disclosure under the NGO tab, email confirm flow.
3 NGO onboarding: 5 steps with autosave (organisation; CAC document; past work
  [≥1 required]; two references [both required]; review + disclosure repeat).
4 NGO dashboard (Home): verification banner, alerts (interests, milestones due,
  payments, membership), thumb buttons.
5 Project creation: 6 steps with autosave; live sum checks on budget lines and
  milestone amounts; computed funding gap; drafts ("Save and finish later").
6 Preference wizard: 3 steps; completable ≤3 minutes.
7 Discover feed: scored cards, Strong badge, filters (sector, SDG, state, gap,
  search ≤2s), never empty while a live project exists.
8 Project detail: photos, figures row (budget, funded, gap, timeline,
  beneficiaries), milestone table (amount, due date, status), budget breakdown,
  org card (mission, year, past project; NO contacts until payment confirmed),
  checkout modal (fee math live), share link, order buttons for site visit and
  dossier.
9 Money tab NGO: held/next/paid rows, payout history (full amounts only),
  payout account management (Ops-approved), membership card.
10 Money tab company: per-project paid (with protection breakdown), held,
   released, pending approvals, Insight status, orders status.
11 Update composer: one screen, camera-first (≤5 photos, ≤3 receipts, 1500-char
   note), retry queue.
12 Approval screen: update + photos + receipts + milestone plan side by side;
   approve (two release lines) or raise a problem.
13 Close page (funder): report card, Year-Plan card (3 matched projects),
   Insight card.
14 Membership screen (NGO): status, benefits, pay instructions (operating
   account + org reference), one-click deferral, renewal date.
15 Track-record page (public, brand voice): completed projects, beneficiaries
   reached, on-time rate, report links, badge.
16 Admin console: verifications (10-point checklist: CAC readable and RC matches;
   name matches; no tampering signs; registry check; web presence matches
   mission; ref1 called; ref2 called; past work checkable; sanctions/PEP screen;
   sector assigned — reject requires a reason from a dropdown), listings,
   payout accounts (CAC name match), memberships (ladder, deferrals, discretion
   queue for orgs under ₦3M lifetime funding), orders, disputes (freeze one
   milestone; resolve in 5 working days: release, partial, re-plan, refund from
   both pools, de-verify with full refund [super_admin]), reconciliation (two
   ledgers), metrics, audit log.

## 13. BUILD ORDER (say "Execute Module N"; build only that module)

MODULE 0 — Foundation and brand system. Next.js + Supabase + auth + roles + RLS.
Design system components per 4.2 (tokens, mark SVG with joining animation, serif
brand headings, sans UI, buttons, chips, cards, verified badge, form fields with
label-above and errors-that-name-the-fix, timeline with mark motif, toast, modal,
kobo/naira money formatting). strings/en.ts with the FULL copy deck (Section 10)
and a lint blocking banned words and enforcing signoff on outbound templates.
Mobile shell + WhatsApp help button. Sentry + PostHog. Seed: 3 NGOs, 2 companies,
1 admin, all 36 states + FCT with LGAs, match_adjacency.
DONE WHEN: signup with email confirmation works for all roles; cross-role access
blocked at RLS; autosave survives app close; About block renders from strings;
brand lint passes; seed data present.

MODULE 1 — Trust console and listings. Admin verification queue with checklist,
reference call-outcome fields, reason-required decisions, append-only audit_log
(no update/delete grants). Payout account flow with Ops approval + CAC name
match. 6-step project form with autosave, sum checks, server-enforced status
machine, photo uploads to private storage.
DONE WHEN: verification end-to-end works and badge appears only for verified
orgs; oversized/wrong-type files rejected with named fix; bad sums blocked;
returned listings show admin comments; audit log rejects edit/delete.

MODULE 2 — Discovery and the fee engine. Preference wizard; matching engine per
Section 9 (cached in match_scores, recomputed on preference/project change);
feed (all live, score sort, filters ≤2s); project detail with gated contacts and
share link; interest flow (full/partial, duplicate blocked, 5-working-day
payment window, expiry reopens gap). Fee engine per Section 7 as a pure server
function + quote endpoint; fee_pool_total stored once at full funding; fee
exposed ONLY on company surfaces.
DONE WHEN: all Section 9 examples pass exactly; all Section 7 boundary tests
pass; automated test proves zero fee strings on NGO surfaces; interest → confirm
works; duplicate interests blocked.

MODULE 3 — Money. Paystack: per-project virtual accounts (transfer-first),
signature-verified webhooks, idempotency (replays ignored). Both-pool escrow
ledger per project and per funder. Co-funding shares. Checkout displays program
+ protection (copy deck strings). Daily 18:00 payout batch via Transfers to
CAC-matched recipients; 3 retries then Ops alert. Daily reconciliation job
(Paystack vs escrow vs payouts; mismatch alerts Ops) + operating ledger line.
DONE WHEN: sandbox two-funder flow (₦10.5M + ₦5.25M on a ₦15M project) shows
pools ₦15M + ₦750k with correct per-funder shares; one milestone releases
₦3,750,000 exactly with a ₦187,500 fee row; reconciliation matches to the kobo;
payout to unverified or name-mismatched account is blocked.

MODULE 4 — Accountability loop and membership rail. One-screen composer
(camera-first, retry queue); timeline both sides; approval screen with two
release lines; approval clock (day-5 notice N7-follow-up, day-7 auto-release);
disputes freezing only the disputed milestone; refunds from both pools
proportional. Membership rail: request job at final payout +7d (N14); payment
recording against membership_payments; anniversary renewals (N15); ladder
d14/d30/d60/d90 pausing listings ONLY; one-click 6-month deferral (once);
Ops discretion queue (<₦3M lifetime). Isolation enforced: membership tables have
no path into escrow; no membership state blocks payouts. Wire N1–N16 + S1–S2
with signoffs.
DONE WHEN: sandbox lifecycle passes — fund → 2 updates → 2 releases → dispute
freezes → resolve → release; auto-release fires on a timed test; membership
request fires exactly once at simulated completion; a listings-paused NGO with
an active project still receives a full on-time payout; a membership payment
never appears in escrow reconciliation; every email ends with the signoff.

MODULE 5 — Proof, Insight, and the money moment. Close-out (blocked until final
milestone approved); branded PDF impact report (cover line, summary, outputs,
beneficiaries reached, spend per budget line, timeline with photos, funder
names, Verified badge; figures MUST match the ledger exactly); funder analytics
dashboard (paid/held/released, SDGs, beneficiaries; reconciles with ledger);
Insight annual pack (one PDF across a funder's closed projects); close page
cards (report + Year-Plan with 3 matched live projects + Insight); playbook_tasks
created on every close (14-day snooze); orders for site visit/dossier/brief with
admin fulfillment states and deliverable attachment; public track-record pages;
admin metrics pages.
DONE WHEN: closed test project generates a report matching the ledger to the
kobo; close page renders 3 matched projects + Insight card; an order completes
placed → delivered with deliverable visible; track-record page renders for a
completed NGO; backup restore test passes.

MODULE 6 — Hardening and launch. Execute the full QA plan (Section 14); fix
every failure. Rate-limit auth and public endpoints; load-test the feed; verify
no secrets in the client bundle; confirm rollback deployability; 3G performance
pass (first paint ≤3s on feed and detail); UAT script for 3 real NGOs and 2 real
companies.
DONE WHEN: every check in Section 14 passes.

## 14. QA GATES (all must pass before launch; money cases re-run after any
   payments or membership change; brand cases after any string change)

T1  Unconfirmed email blocks login.            T2  Verification with 1 reference blocked, error names it.
T3  15MB CAC upload rejected, data intact.     T4  Admin verify → badge live ≤1 min, N2 sent.
T5  Budget lines ≠ total blocked.              T6  Milestone amounts ≠ total blocked.
T7  Feed never empty while a live project exists. T8 No-preference company sees unscored feed + wizard prompt.
T9  Duplicate interest blocked.                T10 Cross-role data access blocked at RLS.
T11 Contacts hidden before payment (incl. share links). T12 Session timeout preserves autosave.
T13 Double checkout submit → one payment.      T14 Webhook replay ignored.
T15 Ledger = Paystack − payouts (seed data, to the kobo); seeded mismatch alerts.
T16 Release math exact (₦3,750,000 / ₦187,500). T17 Payout to unverified/mismatched account blocked.
T18 Dispute freezes only that milestone.       T19 Auto-approve: notice day 5, release day 7.
T20 Cancellation refunds both pools proportionally to the kobo.
T21 Composer ≤5 min on mid-range Android over 3G; retry on drop.
T22 Reminder cycle (−3d, +7d, +14d) stops after update.
T23 Close-out blocked without final approved milestone.
T24 Report figures = ledger exactly; PDF opens in standard readers.
T25 Share link: full view, no contacts, no documents.
T26 Audit log edit/delete attempts denied.
T27 Project with escrow held > 0 cannot be deleted (soft-delete blocked).
T28 Failed payout: 3 retries then Ops alert; ledger shows pending.
T29 3G first paint ≤3s (feed + detail).
T30 Fee boundaries: ₦20,000,000 → ₦1,000,000.00; ₦20,000,001 → ₦1,000,000.02;
    ₦2,000,000 → ₦100,000 (no floor); ₦60M → ₦1,800,000; ₦100M → ₦2,600,000.
T31 Founding rate: ₦15M → ₦450,000; ₦60M → ₦1,400,000; project 11 reverts to 5%.
T32 Quote endpoint: proportional shares; "estimate" label pre-funding; stored
    pool after full funding; over-funding blocked.
T33 Bracket refund split: ₦60M dies at M2 of 4 → ₦30M + ₦900,000 refunded,
    per-funder shares exact.
T34 Membership isolation: membership payment never in escrow ledger or
    reconciliation.
T35 Lapse vs payout: listings_paused NGO still paid in full, on time.
T36 Ladder sequence d14/30/60/90 fires on schedule; badge/history intact at
    every stage; rejoin resumes listings same day; deferral moves anniversary.
T37 Playbook: every close creates a task; close page renders 3 matches +
    Insight; snooze works.
T38 Signoff lint: every outbound email ends "Jikota. Where purpose meets its people."
T39 Register discipline: banned-word lint on all strings; zero fee strings on
    NGO surfaces; zero mission language in checkout/errors.
T40 Money format: integers in kobo everywhere; no float anywhere in money paths.
T41 Restore: database backup restores and app functions on staging.

## 15. GLOSSARY (use these meanings in code and copy)

Escrow: money Jikota holds for a project, released only on approved milestones.
Program pool: the NGO's budget inside escrow; the NGO always receives 100%.
Fee pool: the project's total delivery protection fee; equal slices per milestone.
Bracket: 5% of first ₦20M, 2% above; custom above ₦100M; no minimum.
Founding rate: 3% first tranche for the first 10 funded projects.
Milestone: a dated, priced, checkable step; money releases when proven.
Membership: NGO's ₦100,000/year after a first completed project; separate
operating rail; lapse pauses new listings only.
Insight: paid company tier (dashboard, annual pack, priority support).
Track record: an NGO's public page of completed projects and proof.
Mark: two interlocking circles; the visual form of jikọta and the progress motif.