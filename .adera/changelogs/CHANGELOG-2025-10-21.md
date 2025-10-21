# Changelog - October 21, 2025

## Theme & Preferences System

### Added
- **Global Theme Management**: Implemented persistent theme mode switching (light/dark/system) across web and native platforms
  - Created `packages/preferences/` package with `PreferencesProvider` for managing user preferences
  - Theme mode persists via AsyncStorage and automatically applies on app launch
  - Profile screen now displays Theme Mode selector with System Default, Light Mode, and Dark Mode options
  
- **Biometric Authentication Support**: 
  - Added biometric login toggle in Profile > Preferences
  - Biometric credentials securely stored via Expo SecureStore
  - Login screen displays "Sign in with biometrics" button when enabled and hardware is available
  - Graceful fallback for devices without biometric hardware or enrollment

- **Language Preferences**: 
  - Language selection (English/Amharic) now managed through preferences provider
  - Preference persists across sessions

### Fixed
- **Web Blank Screen Regression**: Fixed ThemeProvider crash by updating imports from deprecated `DefaultTheme/DarkTheme` to `MD3LightTheme/MD3DarkTheme`
- **Onboarding Flow**: Restored onboarding screens on app launch and after sign-out
  - Users now see onboarding → app selector → auth/guest flow
  - Sign-out properly resets navigation state to show onboarding again
  
- **Parcel History Layout**: Enhanced card layout to prevent text/icon overflow
  - Added `numberOfLines` truncation for long tracking IDs and recipient names
  - Implemented flex wrapping for detail rows to handle narrow screens
  - Added `minWidth: 0` constraints to prevent content overflow

- **Web Console Warnings**: 
  - Removed blank lines between JSX elements in Profile and LoginScreen to eliminate "Unexpected text node" warnings
  - Fixed "Invalid prop `index` supplied to `React.Fragment`" by correcting BottomNavigation.SceneMap implementation
  - Theme and language toggles now respond immediately on web platform

- **Biometric UX Improvements**:
  - Added platform detection (web shows "Not Available on Web" message)
  - Graceful error handling for missing hardware or unenrolled biometrics
  - Clear user guidance for each error scenario

### Changed
- **App Flow Navigation**: 
  - Login/sign-out now routes through onboarding and app selector screens
  - Guests can browse shop without authentication
  - Improved UX for choosing between PTP and Shop experiences

- **Dependencies**:
  - Added `@react-native-async-storage/async-storage` to `apps/adera-ptp` and `packages/preferences`
  - Added `expo-local-authentication` and `expo-secure-store` for biometric support
  - Removed AsyncStorage from `packages/ui` (now managed centrally via preferences)

## Technical Details

### New Files
- `packages/preferences/package.json`
- `packages/preferences/src/PreferencesProvider.js`
- `packages/preferences/index.js`
- `.adera/memory/20251021-blank-screen-final-resolution.md`
- `.adera/changelogs/CHANGELOG-2025-10-21.md`

### Modified Files
- `packages/ui/src/ThemeProvider.js` - Updated to use MD3 theme variants, accept external mode control, use useCallback for updateMode
- `packages/ui/src/BottomNavigation.js` - Fixed SceneMap to prevent invalid Fragment props
- `apps/adera-ptp/App.js` - Integrated PreferencesProvider, restored onboarding flow
- `apps/adera-ptp/src/screens/customer/Profile.js` - Added theme/biometric/language controls, removed blank JSX lines
- `apps/adera-ptp/src/screens/Auth/LoginScreen.js` - Added biometric login button, removed blank JSX lines
- `apps/adera-ptp/src/screens/customer/ParcelHistory.js` - Enhanced card layout
- `apps/adera-ptp/package.json` - Added preferences and biometric dependencies
- `packages/ui/package.json` - Removed AsyncStorage dependency
- `packages/preferences/src/PreferencesProvider.js` - Added web platform detection for biometrics
- `.adera/memory/activeContext.md` - Updated to reflect October 21 session focus
- `.adera/changelogs/CHANGELOG-2025-10-21.md` - Comprehensive changelog with all improvements

## Known Issues
- Biometric login currently shows success message but doesn't complete full authentication flow (placeholder for future implementation)
- Guest mode navigation requires additional work for shop browsing

## Next Steps
1. Complete biometric authentication flow with secure credential storage
2. Implement guest browsing for shop marketplace
3. Add multi-app router to switch between PTP and Shop based on user choice
4. Connect real-time theme updates across all screens
5. Add E2E tests for preferences persistence

---

**Memory Reference**: MEM:20251021-theme-preferences-biometric  
**Branch**: dev  
**Commit Target**: dev, main, Rsv/v4
