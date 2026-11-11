# NUTTY X-MAS MARKET

Next.js 15 + Supabase Christmas PNG marketplace.

## Vercel environment variables
- NEXT_PUBLIC_SUPABASE_URL — same project used by Marie's Toybox
- SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) — server-only Supabase key
- SESSION_SECRET — unique random string, at least 32 characters
- MARKET_ADMIN_PASSWORD — separate admin password

Import this repository in Vercel with Root Directory set to `.`. Run `supabase/schema.sql` once in the existing Supabase SQL editor, then deploy.

Login verifies existing `event_users` nickname/password hashes (legacy scrypt and bcrypt supported). Market coins are separate from gacha points/tokens. Top-ups require admin approval; checkout debits atomically through a SQL function. Admin PNG uploads are limited to 5MB.
