// Supabase "Send Email" hook for brendanwhitaker.com: every account email for the site, its subdomains
// and its apps (Diplomacy, Vote, Dipsgiving, …) goes out through Resend using the general auth-* templates
// stored there. The app the person was signing in from is named at the top of the email; anywhere else
// gets the template's fallback ("Your account"). Wording lives in Resend and is edited there.
//
// Secrets: SEND_EMAIL_HOOK_SECRET (the hook's secret in Supabase, "v1,whsec_…") and RESEND_API_KEY
// (a send-only key for mail.brendanwhitaker.com). SUPABASE_URL is provided by Supabase.
import { Webhook } from "npm:standardwebhooks@1.0.0";

const FROM = "Brendan Whitaker <noreply@mail.brendanwhitaker.com>";
const HOME = "https://www.brendanwhitaker.com";

type Payload = {
  user: { id?: string; email: string; new_email?: string; email_new?: string };
  email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string; token_new?: string; token_hash_new?: string };
};

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: status, message } }), { status, headers: { "Content-Type": "application/json" } });

/** The app named at the top of the email, from where the person was signing in. */
export function appFor(redirectTo: string | undefined): string | undefined {
  try {
    if (!redirectTo) return undefined;
    const u = new URL(redirectTo);
    if (!/(^|\.)brendanwhitaker\.com$/.test(u.hostname) && !u.hostname.startsWith("dipsgiving")) return undefined;
    if (u.hostname.startsWith("dipsgiving") || /^\/vote\/dipsgiving(\/|$)/.test(u.pathname)) return "Dipsgiving";
    if (/^\/(entente|diplomacy)(\/|$)/.test(u.pathname)) return "Entente";
    if (/^\/vote(\/|$)/.test(u.pathname)) return "Vote";
    return undefined;
  } catch {
    return undefined;
  }
}

const NOTICE: Record<string, string> = {
  password_changed_notification: "Your password was changed.",
  email_changed_notification: "Your email address was changed.",
  phone_changed_notification: "Your phone number was changed.",
  identity_linked_notification: "A new sign-in method was added.",
  identity_unlinked_notification: "A sign-in method was removed.",
  mfa_factor_enrolled_notification: "Two-step verification was turned on.",
  mfa_factor_unenrolled_notification: "Two-step verification was turned off.",
};

const TEMPLATE: Record<string, string> = {
  signup: "auth-confirm-signup", magiclink: "auth-sign-in", email: "auth-sign-in",
  recovery: "auth-reset-password", invite: "auth-invite", email_change: "auth-email-change",
};

function verifyLink(hash: string, type: string, redirect: string) {
  const u = new URL("/auth/v1/verify", Deno.env.get("SUPABASE_URL")!);
  u.searchParams.set("token", hash);
  u.searchParams.set("type", type);
  if (redirect) u.searchParams.set("redirect_to", redirect);
  return u.toString();
}

type Send = { to: string; template: string; variables: Record<string, string>; key: string };

export function plan(p: Payload): Send[] {
  const { user, email_data: d } = p;
  const kind = d.email_action_type;
  const app = appFor(d.redirect_to);
  const base = app ? { APP: app } : {};
  const key = (to: string, h: string) => `auth-email/${kind}/${h}/${to}`.slice(0, 256);

  if (kind === "reauthentication") return [{ to: user.email, template: "auth-code", variables: { ...base, CODE: d.token }, key: key(user.email, d.token) }];
  if (kind.endsWith("_notification")) {
    return [{ to: user.email, template: "auth-notice", variables: { ...base, WHAT: NOTICE[kind] ?? "Your account settings changed.", LINK: d.redirect_to || HOME },
      key: key(user.email, `${kind}-${d.token || user.id || Date.now()}`) }];
  }
  const template = TEMPLATE[kind] ?? "auth-sign-in";
  const make = (to: string, hash: string, extra: Record<string, string> = {}): Send =>
    ({ to, template, variables: { ...base, LINK: verifyLink(hash, kind, d.redirect_to), ...extra }, key: key(to, hash) });

  if (kind === "email_change") {
    // Supabase's names are swapped for backward compatibility: token_hash_new goes with the CURRENT address,
    // token_hash with the NEW one. With Secure Email Change off, only the new address gets an email.
    const next = user.new_email ?? user.email_new ?? "";
    if (next && d.token_hash && d.token_hash_new) {
      return [
        make(user.email, d.token_hash_new, { NEW_ADDRESS: next, WHICH_NOTE: "This is your current address. We’ve also emailed the new one; confirm both to finish." }),
        make(next, d.token_hash, { NEW_ADDRESS: next, WHICH_NOTE: "This is your new address. We’ve also emailed your current one; confirm both to finish." }),
      ];
    }
    return [make(next || user.email, d.token_hash || d.token_hash_new || "", { NEW_ADDRESS: next || user.email, WHICH_NOTE: "Tap the button to confirm." })];
  }
  return [make(user.email, d.token_hash)];
}

async function send(s: Send) {
  // Supabase waits about 5 seconds for this hook: two tries, short pause, only for rate limits and server errors.
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": s.key },
      body: JSON.stringify({ from: FROM, to: [s.to], template: { id: s.template, variables: s.variables } }),
    });
    if (r.ok) return;
    const text = await r.text();
    if (r.status !== 429 && r.status < 500) throw new Error(`Resend ${r.status}: ${text}`);
    if (attempt === 1) throw new Error(`Resend ${r.status}: ${text}`);
    await new Promise((res) => setTimeout(res, 300));
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, "POST only");
  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secret || !Deno.env.get("RESEND_API_KEY")) return fail(500, "Email hook isn't configured yet");

  const body = await req.text();
  let p: Payload;
  try {
    p = new Webhook(secret.replace(/^v1,whsec_/, "")).verify(body, Object.fromEntries(req.headers)) as Payload;
  } catch {
    return fail(401, "Bad signature");
  }
  try {
    for (const s of plan(p)) {
      await send(s);
      console.log("auth email sent", { type: p.email_data.email_action_type, template: s.template });
    }
  } catch (e) {
    console.error("auth email failed", { type: p.email_data.email_action_type, error: String(e) });
    return fail(500, "Couldn't send the email");
  }
  return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
});
