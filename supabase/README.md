# Site-wide account emails

`functions/auth-email` is the Supabase "Send Email" hook for every app on brendanwhitaker.com
(Diplomacy, Vote, Dipsgiving, and any future subdomain or app). It sends each account email
through Resend with the `auth-*` templates stored there, naming the app at the top.

- Wording: edit the `auth-*` templates in Resend (sign-in, confirm signup, reset password,
  email change, invite, code, notice). No deploy needed.
- Code: deploy this folder to the shared Supabase project as the `auth-email` function
  (JWT verification off; the function checks the hook's signature itself).
- Secrets (Supabase › Edge Functions › Secrets): `SEND_EMAIL_HOOK_SECRET`, `RESEND_API_KEY`.
- Supabase › Authentication › Hooks › Send Email points at
  `https://cnihjooemzcanelzzvkt.supabase.co/functions/v1/auth-email`.

This folder isn't part of the website itself; `.vercelignore` keeps it out of the site's deploys.
