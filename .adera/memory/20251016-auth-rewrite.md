# Auth Stack Rewrite — 2025-10-16

Context: Persistent auth issues across apps. Decision: remove and rebuild the auth module with a simpler, robust Supabase integration and a clear state model.

Key changes:
- Rebuilt `packages/auth` provider and client with a minimal state machine: LOADING, AUTHENTICATED, UNAUTHENTICATED.
- Eliminated ad-hoc demo mode and complex email confirmation handler; keep standard Supabase flows only.
- Simplified exports to `AuthProvider`, `useAuth`, `supabase`.
- Updated `apps/adera-ptp/App.js` to remove `EmailConfirmationHandler` and deep-link parsing.

Requirements:
- Environment variables must be present: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Test plan:
- Sign up, confirm via Supabase default email link, restart app → authenticated.
- Sign in, sign out cycles.
- Role-based routing still derives from `users` table when present; gracefully handles missing profile.

Risk:
- Any UI relying on removed `EmailConfirmationHandler` should be adapted; we removed its usage in PTP app.


