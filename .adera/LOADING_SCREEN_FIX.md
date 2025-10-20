# Loading Screen Hang Fix

## Date: 2025-01-19

## Critical Issue
**App stuck on LoadingScreen** - Loading spinner showed indefinitely, app never progressed to content.

## Root Cause
**Supabase not configured** - The AuthProvider was waiting for `supabase.auth.getSession()` to complete, but without valid credentials, the call was hanging indefinitely, keeping `authState` in `LOADING` state.

### What Was Happening
1. App starts → `authState = LOADING` (line 14 in AuthProvider.js)
2. `useEffect` calls `supabase.auth.getSession()` (line 25)
3. **Supabase credentials are empty** (checked supabase.js line 12)
4. `getSession()` hangs or fails silently
5. `authState` never changes from `LOADING`
6. App.js line 29-31 keeps showing LoadingScreen forever

### Terminal Evidence
```
Auth state changed: TOKEN_REFRESHED
```
This showed auth events were firing, but authState wasn't updating properly.

## Solution

### Temporary Fix: Enable Demo Mode
Changed `isDemoMode = false` to `true` in `AuthProvider.js` line 8.

**Demo mode bypasses Supabase entirely:**
```javascript
// Demo mode enabled for development (Supabase not configured yet)
const isDemoMode = true;
```

This immediately sets `authState = UNAUTHENTICATED` (line 20), allowing the app to show the onboarding flow.

### Permanent Fix: Configure Supabase

When ready to use real authentication:

1. **Create `.env` file** in `apps/adera-ptp/`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Set up Supabase project**:
   - Create account at https://supabase.com
   - Create new project
   - Get URL and anon key from Settings → API
   - Add to `.env` file

3. **Create database tables**:
   - Run schema from `docs/database-schema.sql` (if exists)
   - Or create `users` table manually

4. **Disable demo mode**:
   ```javascript
   const isDemoMode = false;
   ```

5. **Restart app**:
   ```bash
   pnpm run web
   ```

## Files Modified

1. **`packages/auth/src/AuthProvider.js`** (line 8)
   - Changed `isDemoMode = false` → `isDemoMode = true`

## Demo Mode Features

When demo mode is enabled:

- ✅ **No Supabase required** - Bypasses all auth calls
- ✅ **Instant startup** - No hanging on getSession()
- ✅ **Auto-login** - User automatically "authenticated" as demo user
- ✅ **Configurable role** - Change role in fetchUserProfile (line 120):
  ```javascript
  role: 'customer', // Change to: 'partner', 'driver', 'staff', 'admin'
  ```

### Demo User Profile
```javascript
{
  id: 'demo-user',
  role: 'customer',
  first_name: 'Demo',
  last_name: 'User',
  email: 'demo@adera.et',
  business_name: 'Demo Business'
}
```

## Testing Different Roles in Demo Mode

To test different user roles, edit `AuthProvider.js` line 120:

```javascript
setUserProfile({
  id: 'demo-user',
  role: 'partner', // ← Change this
  first_name: 'Demo',
  last_name: 'User',
  email: 'demo@adera.et',
  business_name: 'Demo Business',
});
```

**Available roles:**
- `customer` - See customer dashboard, create parcels, track
- `partner` - See partner dashboard, scan QR codes, manage parcels
- `driver` - See driver dashboard, view routes, complete deliveries
- `staff` - See staff dashboard, oversight, support
- `admin` - Full admin access

## Prevention

To avoid this in future:

1. **Always check env vars** before calling Supabase
2. **Fail fast** - Set authState to UNAUTHENTICATED if config missing
3. **Add timeout** - Don't wait forever for getSession()
4. **Better logging** - Console.log when Supabase is misconfigured

### Improved Error Handling (Future)

```javascript
useEffect(() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured - falling back to UNAUTHENTICATED');
    setAuthState(AuthState.UNAUTHENTICATED);
    return;
  }
  
  // Add timeout
  const timeout = setTimeout(() => {
    console.error('Supabase getSession() timed out');
    setAuthState(AuthState.UNAUTHENTICATED);
  }, 5000);
  
  supabase.auth.getSession().then(({ data, error }) => {
    clearTimeout(timeout);
    // ... rest of logic
  });
}, []);
```

## Related Files

- **`packages/auth/src/supabase.js`** - Supabase client config (line 8-10 warns about missing env vars)
- **`apps/adera-ptp/App.js`** - Main app component (line 29-31 shows LoadingScreen while isLoading)
- **`packages/auth/src/types.js`** - AuthState enum definitions

## Status

✅ **Demo mode enabled** - App now loads correctly  
⏳ **Supabase configuration** - Pending (future milestone)  
📝 **Testing roles** - Available via demo mode  

---

**Impact**: Critical fix - app was completely unusable before this change
