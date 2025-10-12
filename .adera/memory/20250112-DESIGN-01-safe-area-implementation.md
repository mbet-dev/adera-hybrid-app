---
type: design-rule
category: ui-ux
date: 2025-01-12
status: implemented
priority: critical
---

# Safe Area Implementation - Universal Design Rule

## Context
User reported that Auth screens (Login, SignUp, ForgotPassword) were extending beyond the SafeAreaView on native devices, causing UI elements (like the "Sign Up" button) to be overlapped by device navigation buttons and system UI.

## Root Cause
Screens were using `SafeAreaView` with only `edges={['top']}`, which protected only the top edge (status bar area) but left the bottom edge (navigation bar area) unprotected. This caused content to be obscured by device system UI elements like:
- Android navigation buttons (back, home, recent apps)
- iOS home indicator
- Device notches and camera cutouts
- Rounded screen corners

## Solution Implemented

### 1. AGGRESSIVE Multi-Layer Protection
**Triple-layer protection against device UI overlap:**

1. **SafeAreaView** with all edges: `edges={['top', 'bottom', 'left', 'right']}`
2. **Increased content padding**: 60-80px bottom padding in ScrollViews
3. **Platform-specific buffer padding**: Additional 25px (iOS) / 35px (Android) bottom padding

### 2. Enhanced SafeArea Component
**Bulletproof SafeArea component with multiple protection layers:**
```javascript
<SafeArea aggressive={true}>  // Default: aggressive mode ON
  {/* Your content */}
</SafeArea>
```

### 2. Files Fixed (Auth Screens)
- ✅ `apps/adera-ptp/src/screens/Auth/LoginScreen.js`
- ✅ `apps/adera-ptp/src/screens/Auth/SignUpScreen.js`
- ✅ `apps/adera-ptp/src/screens/Auth/ForgotPasswordScreen.js` (both states)

### 3. Files Fixed (UI Package)
- ✅ `packages/ui/src/OnboardingScreen.js`
- ✅ `packages/ui/src/GatewayScreen.js`
- ✅ `packages/ui/src/AppSelectorScreen.js`

### 4. Files Fixed (Navigation)
- ✅ `apps/adera-ptp/src/navigation/GuestNavigator.js`

### 5. New Components Created
**`packages/ui/src/SafeArea.js`** - BULLETPROOF SafeArea component
- Multiple protection layers (SafeAreaView + additional padding)
- Platform-specific aggressive padding (iOS: 25px, Android: 35px)
- Theme-aware background color
- Aggressive mode enabled by default

**`packages/ui/src/useSafeAreaPadding.js`** - Custom hooks for safe area
- `useSafeAreaPadding()` - Full padding calculation
- `useSafeBottomPadding()` - Bottom-only padding for ScrollViews

```javascript
import { SafeArea, useSafeBottomPadding } from '@adera/ui';

// Bulletproof SafeArea (RECOMMENDED)
<SafeArea aggressive={true}>
  {/* Your screen content */}
</SafeArea>

// Or use hook for custom implementations
const bottomPadding = useSafeBottomPadding(); // Returns 40-70px
```

## Design Rule (MANDATORY)

### For All New Screens:
1. **Always use SafeAreaView** with all edges: `edges={['top', 'bottom', 'left', 'right']}`
2. **Or use the SafeArea component** from `@adera/ui` (preferred)
3. **Increase bottom padding** in ScrollView content: `paddingBottom: 32` (was 24)
4. **Test on physical devices** with different screen configurations

### Edge Cases:
- **Full-screen modals**: May use `edges={['top', 'bottom']}` if horizontal edges interfere
- **Screens with AppBar**: AppBar component handles top edge; use `edges={['bottom', 'left', 'right']}`
- **Web platform**: SafeAreaView gracefully degrades to normal View

## Additional Improvements

### ScrollView Content Padding
Updated all auth screens to have increased bottom padding:
```javascript
scrollContent: {
  flexGrow: 1,
  paddingHorizontal: 24,
  paddingBottom: 32, // Increased from 24
}
```

### GuestNavigator Header
Removed manual `paddingTop: 24` from header since SafeAreaView now handles it:
```javascript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  // paddingTop: 24, ❌ REMOVED - SafeAreaView handles this
}
```

## Testing Checklist
- ✅ Login screen: Bottom button not obscured by navigation bar
- ✅ SignUp screen: Form fields and buttons fully visible
- ✅ ForgotPassword screen: Both states (form and success) properly spaced
- ✅ Onboarding: Slides and navigation buttons accessible
- ✅ Gateway: Auth buttons not cut off
- ✅ AppSelector: Continue button fully visible
- ✅ Guest mode: Back button and content properly spaced

## Impact
- **User Experience**: All interactive elements now accessible on all devices
- **Consistency**: Unified safe area handling across entire app
- **Maintainability**: Reusable SafeArea component prevents future issues
- **Cross-platform**: Works correctly on iOS, Android, and Web

## Related Files
- Auth screens: `apps/adera-ptp/src/screens/Auth/*.js`
- UI components: `packages/ui/src/{OnboardingScreen,GatewayScreen,AppSelectorScreen,SafeArea}.js`
- Navigation: `apps/adera-ptp/src/navigation/GuestNavigator.js`
- Package exports: `packages/ui/index.js`

## Future Recommendations
1. **Audit all existing screens** for SafeAreaView compliance
2. **Use SafeArea component** for new screens instead of raw SafeAreaView
3. **Add to component library docs** with usage examples
4. **Consider adding ESLint rule** to enforce SafeAreaView usage
5. **Test on devices with different aspect ratios** (notched, punch-hole, etc.)

## Commit Message
```
fix(ui): Implement universal SafeArea protection for all screens

- Add SafeArea component to UI package
- Fix Auth screens to use all safe area edges
- Update UI components (Onboarding, Gateway, AppSelector)
- Fix GuestNavigator safe area handling
- Increase ScrollView bottom padding for better spacing
- Prevent content from being obscured by device system UI

Fixes: Content being cut off by device navigation buttons
Affects: iOS home indicator, Android nav bar, notches, rounded corners
Testing: Verified on native devices with various screen configurations

MEM:20250112-DESIGN-01-safe-area-implementation
```

---

**Status**: ✅ Implemented and tested
**Priority**: Critical (affects core UX)
**Next Steps**: Audit remaining screens (Customer, Partner, Driver, Staff dashboards)
