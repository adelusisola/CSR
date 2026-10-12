// Jikota — Module 0 app root. Hash router: #/ landing, #/signup?role=ngo|company,
// /auth/confirm leg handled here via Supabase detectSessionInUrl. All copy from en.ts.
import { useEffect, useState } from "react";
import { colors } from "./lib/tokens";
import { en } from "./strings/en";
import { Mark, Wordmark } from "./components/Mark";
import { Button, Field, Toast } from "./components/ui";
import { AppShell } from "./components/AppShell";
import { signUpWithEmail, supabase } from "./lib/supabase";

type Route = { name: "landing" | "signup" | "confirm" | "app"; query: URLSearchParams };

function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  const [path, qs] = hash.split("?");
  const query = new URLSearchParams(qs ?? "");
  if (path === "/signup") return { name: "signup", query };
  if (path.startsWith("/auth/confirm")) return { name: "confirm", query };
  if (path.startsWith("/app")) return { name: "app", query };
  return { name: "landing", query };
}

export function App() {
  const [route, setRoute] = useState<Route>(parseRoute());
  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  switch (route.name) {
    case "signup":
      return <SignupPage role={(route.query.get("role") as "ngo" | "company") ?? "ngo"} />;
    case "confirm":
      return <ConfirmPage />;
    case "app":
      return (
        <AppShell role="ngo" activeTab="home" screenName="Home" orgName="Your organisation">
          <p>{en.landing.hero.sub}</p>
        </AppShell>
      );
    default:
      return <LandingPage />;
  }
}

/* --------------------------------------------------------------- landing --- */
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 style={{ fontFamily: "var(--jk-font-brand)", fontSize: "var(--jk-section-title)", color: colors.deepGreen }}>
      {children}
    </h2>
  );
}

function LandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "var(--jk-s5) var(--jk-s4)", lineHeight: 1.5 }}>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--jk-s3)", marginBottom: "var(--jk-s6)" }}>
        <Mark size={40} on="cream" />
        <Wordmark on="cream" />
      </header>

      <section aria-label="Hero">
        <h1 style={{ fontFamily: "var(--jk-font-brand)", fontSize: "var(--jk-hero)", color: colors.deepGreen, marginTop: 0 }}>
          {en.landing.hero.h1}
        </h1>
        <p style={{ fontSize: "var(--jk-body)" }}>{en.landing.hero.sub}</p>
        <div style={{ display: "flex", gap: "var(--jk-s3)", flexWrap: "wrap" }}>
          <Button onClick={() => (window.location.hash = "/signup?role=ngo")}>{en.landing.cta.ngo}</Button>
          <Button variant="secondary" onClick={() => (window.location.hash = "/signup?role=company")}>
            {en.landing.cta.company}
          </Button>
        </div>
      </section>

      <section aria-label="How it works" style={{ marginTop: "var(--jk-s6)" }}>
        <SectionTitle>How it works</SectionTitle>
        <ol>{en.landing.how.map((step) => <li key={step}>{step}</li>)}</ol>
        <p style={{ color: colors.deepGreen }}>{en.landing.pricing}</p>
      </section>

      {/* About block renders from strings (Section 14 QA gate). */}
      <section aria-label="About Jikota" style={{ marginTop: "var(--jk-s6)" }}>
        <SectionTitle>About</SectionTitle>
        <p>{en.landing.about.intro}</p>
        <ul>{en.landing.beliefs.map((b) => <li key={b}>{b}</li>)}</ul>
      </section>

      <footer style={{ marginTop: "var(--jk-s6)", color: colors.deepGreen, fontFamily: "var(--jk-font-brand)", fontStyle: "italic" }}>
        {en.signoff}
      </footer>
    </main>
  );
}

/* ---------------------------------------------------------------- signup --- */
function SignupPage({ role }: { role: "ngo" | "company" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function submit() {
    const next: Record<string, string> = {};
    if (!/.+@.+\..+/.test(email)) next.email = "Enter a valid email like you@organisation.org.";
    if (password.length < 8) next.password = "Use at least 8 characters. Add a number to make it stronger.";
    if (orgName.trim().length < 3) next.orgName = "Enter your organisation's full legal name as on your CAC certificate.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const res = await signUpWithEmail(email, password, role, orgName.trim());
    if (res.error) setErrors({ email: res.error });
    else setDone(true);
  }

  if (done) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--jk-s5)" }}>
        <Toast message="Check your email. Click the link to confirm your account." />
        <p style={{ marginTop: "var(--jk-s4)", color: colors.deepGreen, fontFamily: "var(--jk-font-brand)" }}>{en.signoff}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--jk-s5) var(--jk-s4)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--jk-s3)", marginBottom: "var(--jk-s5)" }}>
        <Mark size={32} on="cream" animateJoin={false} />
        <Wordmark size={16} on="cream" />
      </header>
      <h1 style={{ fontFamily: "var(--jk-font-brand)", fontSize: "var(--jk-page-title)", color: colors.deepGreen }}>
        {role === "ngo" ? en.landing.cta.ngo : en.landing.cta.company}
      </h1>
      {role === "ngo" && <p style={{ fontSize: "var(--jk-secondary)" }}>{en.signup.disclosure.ngo}</p>}
      <Field label="Organisation name" value={orgName} onChange={(e) => setOrgName(e.target.value)} error={errors.orgName} />
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} help="At least 8 characters." />
      <Button onClick={submit}>Create account</Button>
      <p style={{ fontSize: "var(--jk-secondary)", marginTop: "var(--jk-s3)" }}>
        <a href="#/" style={{ color: colors.terracotta }}>Back</a>
      </p>
    </main>
  );
}

/* ---------------------------------------------------------------- confirm --- */
function ConfirmPage() {
  const [state, setState] = useState<"working" | "ok" | "fail">("working");
  useEffect(() => {
    // detectSessionInUrl exchanges the confirmation code for a session on load.
    let settled = false;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (settled) return;
      if (session?.user?.email_confirmed_at) {
        settled = true;
        setState("ok");
        void fetch(`/functions/v1/confirm-signup`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        }).catch(() => undefined); // mirror is idempotent; auth hook also covers this
      }
    });
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setState("fail");
      }
    }, 6000);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--jk-s5)" }}>
      <Mark size={48} on="cream" />
      {state === "working" && <p>Confirming your email…</p>}
      {state === "ok" && (
        <>
          <Toast message="Email confirmed. Welcome to Jikota." />
          <p><a href="#/app" style={{ color: colors.terracotta }}>Continue</a></p>
        </>
      )}
      {state === "fail" && (
        <p role="alert" style={{ color: colors.danger }}>
          That confirmation link has expired. Request a new one from the signup page.
        </p>
      )}
    </main>
  );
}
