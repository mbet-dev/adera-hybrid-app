# Web Issues Debugging - October 21, 2025

## Critical Fixes Applied

### 1. Fragment Index Prop Error (AGGRESSIVE FIX)
**Error**: `Invalid prop 'index' supplied to React.Fragment`

**Root Cause**: React Native Paper's BottomNavigation passes internal props (index, route, jumpTo) to scene renderers, which were ending up on Fragment components.

**Fix Applied** (`packages/ui/src/BottomNavigation.js`):
```javascript
BottomNavigation.SceneMap = (scenes) => {
  return ({ route }) => {
    const Scene = scenes[route.key];
    // Wrap in View to isolate from RNP's props
    return Scene ? (
      <View style={{ flex: 1 }}>
        <Scene />
      </View>
    ) : null;
  };
};
```

### 2. Theme/Language/Biometric Logging Added
**Issue**: Toggles not responding visibly on web

**Debug Logging Added**:
- `PreferencesProvider.js`: Logs every setThemeMode, setLanguage, enableBiometrics call
- `Profile.js`: Logs handler invocations and current state on render

**Expected Console Output When Working**:
```
[Profile] Render - themeMode: system language: en biometric: false
[Profile] handleThemeModeChange called, current mode: system
[Profile] User selected Light theme
[PreferencesProvider] Setting theme mode to: light
[PreferencesProvider] Theme mode saved to storage: light
[Profile] Render - themeMode: light language: en biometric: false
```

## Testing Instructions

### Step 1: Hard Refresh Web Browser
**CRITICAL**: The module cache might be holding old code.

1. In your browser, open Developer Tools (F12)
2. Right-click the refresh button → Select "Empty Cache and Hard Reload"
3. OR press: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 2: Verify Fragment Error is Gone
1. Navigate to Profile tab
2. Open Console (F12)
3. **Expected**: No more "Invalid prop `index` supplied to `React.Fragment`" errors
4. **If Still Present**: Try stopping the server (`Ctrl+C`) and restarting with `pnpm --filter adera-ptp dev`

### Step 3: Test Theme Toggle
1. Go to Profile → Preferences → Theme Mode
2. Click it → Select "Light Mode"
3. **Watch Console for**:
   ```
   [Profile] handleThemeModeChange called
   [Profile] User selected Light theme
   [PreferencesProvider] Setting theme mode to: light
   [PreferencesProvider] Theme mode saved to storage: light
   ```
4. **Watch UI**: Background should immediately change to light theme
5. **If No Logs Appear**: The click handler isn't firing → Check if Alert.alert works on web

### Step 4: Test Language Toggle
1. Go to Profile → Preferences → Language
2. Click it → Select "አማርኛ (Amharic)"
3. **Watch Console for**:
   ```
   [Profile] handleLanguageChange called
   [Profile] User selected Amharic
   [PreferencesProvider] Setting language to: am
   [PreferencesProvider] Language saved to storage: am
   ```
4. **Verify**: Profile re-renders with language: am

### Step 5: Test Biometric Toggle
1. Go to Profile → Preferences → Biometric Login
2. Try to enable it
3. **Watch Console for**:
   ```
   [Profile] handleBiometricToggle called with enabled: true
   [PreferencesProvider] Enabling biometrics, platform: web
   [PreferencesProvider] Biometrics not supported on web
   [Profile] enableBiometrics result: {success: false, error: 'web_not_supported'}
   ```
4. **Watch UI**: Alert should appear: "Not Available on Web"

## Known Web Platform Limitations

### Alert.alert on Web
React Native's `Alert.alert()` may not work properly on web in some configurations. If preferences don't respond:

**Alternative Fix**: Replace Alert.alert with web-friendly dialogs or direct state updates.

**Quick Test**:
```javascript
// In Profile.js, temporarily change handleThemeModeChange to:
const handleThemeModeChange = () => {
  console.log('[Profile] Direct theme change - bypassing Alert');
  setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
};
```

If this works, then Alert.alert is the issue.

## Troubleshooting Checklist

- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Stopped and restarted dev server
- [ ] Console shows preference logs when clicking toggles
- [ ] Fragment index error is gone
- [ ] Theme changes apply immediately (check background color)
- [ ] Language changes are logged
- [ ] Biometric shows "Not Available on Web" message

## Next Steps if Still Failing

1. **Check if PreferencesProvider is wrapping App**:
   - Open `apps/adera-ptp/App.js`
   - Verify `<PreferencesProvider>` wraps `<ThemeProvider>`

2. **Verify imports are resolving**:
   - Check `packages/preferences/index.js` exports `PreferencesProvider` and `usePreferences`
   - Run `pnpm install` to ensure workspace links are correct

3. **Test on native (Expo Go)**:
   - If web still fails but native works, it's a web-specific platform issue
   - Consider using web-native UI libraries for preferences on web build

## Files Modified (Latest Session)
- `packages/ui/src/BottomNavigation.js` — Wrapped scenes in View to fix Fragment error
- `packages/preferences/src/PreferencesProvider.js` — Added comprehensive logging
- `apps/adera-ptp/src/screens/customer/Profile.js` — Added handler and render logging

---

**Last Updated**: October 21, 2025 6:40 AM
