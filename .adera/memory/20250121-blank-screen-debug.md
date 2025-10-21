# Debug Memory: Blank Screen Issue Resolution

**Date:** 2025-01-21  
**Severity:** P1 (Blocking customer flows)  
**Branch:** main  
**Status:** IN PROGRESS

## Issue Summary
User experiencing blank screens on both web and native after authentication. Auth state shows `TOKEN_REFRESHED` but no UI renders.

## Root Cause Analysis

### Primary Issue: User Role Mismatch
Console logs revealed:
```
[AppContent] Render: {"isAuthenticated": true, "isLoading": false, "role": "partner"}
```

**User is authenticated with role `"partner"` but expecting `"customer"` screens.**

### Secondary Issues Found:
1. **Whitespace text nodes** in `PartnerDashboard.js` causing React Native Web errors
2. **Demo mode flag** was hard-coded to `true`, preventing real Supabase auth
3. **Missing sign-out UI** - user couldn't test fresh login flows
4. **Email confirmation callback** not properly handled

## Fixes Applied

### 1. Demo Mode Control (✅ FIXED)
**File:** `packages/auth/src/AuthProvider.js`
```javascript
// Before
const isDemoMode = true;

// After
const isDemoMode = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true';
```

### 2. Email Confirmation Handler (✅ FIXED)
**Files Created:**
- `apps/adera-ptp/src/screens/Auth/AuthCallbackScreen.js` - Handles `/auth/callback` deep link
- Updated `AuthNavigator.js` to register callback route
- Updated `App.js` with Expo linking config

### 3. Whitespace Text Nodes (✅ FIXED)
**Files Fixed:**
- `LoginScreen.js` - Removed blank lines between TextInput components
- `PartnerDashboard.js` - Removed blank lines between AppBar/ScrollView and Text/View
- `CustomerDashboard.js`, `CreateParcel.js`, `TrackParcel.js`, `ParcelHistory.js` - All fixed previously

### 4. Aggressive Logging (✅ ADDED)
Added console.log statements to trace render path:
- `App.js` - AppContent render state
- `AppNavigator.js` - Role routing decisions
- `CustomerNavigator.js` - Tab navigation
- `CustomerDashboard.js` - Component mount

### 5. Temporary Sign-Out Button (✅ ADDED)
**File:** `apps/adera-ptp/src/screens/customer/CustomerDashboard.js`
- Added logout icon button next to notifications
- Allows testing fresh login without database manipulation

## Current Status

### What's Working:
- ✅ Auth state management (TOKEN_REFRESHED event firing)
- ✅ Real Supabase authentication (demo mode disabled)
- ✅ Email confirmation callback route registered
- ✅ No "Unexpected text node" errors in console
- ✅ Role-based routing logic

### What's NOT Working:
- ❌ Blank screen for `partner` role (whitespace partially fixed, needs verification)
- ❌ User needs to change role to `customer` in database OR fix all partner screens

## Next Steps

### Option A: Change User Role (QUICK FIX)
Run this SQL in Supabase dashboard:
```sql
UPDATE users 
SET role = 'customer' 
WHERE email = 'YOUR_EMAIL_HERE';
```

### Option B: Fix All Partner Screens (COMPREHENSIVE)
1. Remove all remaining whitespace in:
   - `ScanQR.js`
   - `ParcelManagement.js`
   - `Earnings.js`
   - `PartnerProfile.js`
2. Add logging to PartnerNavigator
3. Test partner flow end-to-end

## Commands Run
```bash
# Metro bundler (running in apps/adera-ptp)
pnpm --filter adera-ptp start
```

## Console Output Analysis
```
LOG  [AppContent] Render: {"isAuthenticated": true, "isLoading": false, "role": "partner"}
WARN  "qr-code" is not a valid icon name for family "material-community"
```

**Findings:**
1. Role is `"partner"` - explains why customer screens don't show
2. Invalid icon warning - `qrcode` should be used instead of `qr-code`

## Environment Variables Needed
Create/update `apps/adera-ptp/.env.local`:
```env
EXPO_PUBLIC_ENABLE_DEMO_MODE=false
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Testing Checklist
- [ ] Sign out button works (click logout icon in dashboard)
- [ ] Fresh login redirects to correct role navigator
- [ ] Customer role shows CustomerDashboard with all tabs
- [ ] Partner role shows PartnerDashboard with all tabs
- [ ] Email confirmation link updates `email_confirmed_at` in database
- [ ] No blank screens on web (localhost:8081)
- [ ] No blank screens on native (Expo Go)

## Files Modified
```
packages/auth/src/AuthProvider.js
apps/adera-ptp/App.js
apps/adera-ptp/src/navigation/AuthNavigator.js
apps/adera-ptp/src/navigation/AppNavigator.js
apps/adera-ptp/src/navigation/CustomerNavigator.js
apps/adera-ptp/src/screens/Auth/AuthCallbackScreen.js (NEW)
apps/adera-ptp/src/screens/Auth/index.js
apps/adera-ptp/src/screens/Auth/LoginScreen.js
apps/adera-ptp/src/screens/customer/CustomerDashboard.js
apps/adera-ptp/src/screens/partner/PartnerDashboard.js
```

## Deployment Notes
- Restart Metro bundler after `.env.local` changes
- Clear browser cache if web still shows blank
- On native, shake device → "Reload" to pick up changes

---

**Next Action:** User should either change role to `customer` in Supabase OR we continue fixing all partner screens.
