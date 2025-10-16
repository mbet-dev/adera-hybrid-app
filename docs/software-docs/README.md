# docs/software-docs/

This directory contains developer and user documentation for the Adera Hybrid App project.

## Structure
- API documentation
- Developer guides
- Design docs
- User manuals

## Usage
- Update when adding new public APIs, UX flows, or infrastructure changes.
- Keep documentation up to date with project evolution.

## Authentication (2025-10-16 rewrite)

The `@adera/auth` package was simplified for reliability:
- Clear state model: LOADING, AUTHENTICATED, UNAUTHENTICATED
- Removed `EmailConfirmationHandler` dependency; rely on Supabase confirmation links
- Environment variables required:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Usage:

```jsx
import { AuthProvider, useAuth } from '@adera/auth';

export default function App() {
  return (
    <AuthProvider>
      {/* app */}
    </AuthProvider>
  );
}
```