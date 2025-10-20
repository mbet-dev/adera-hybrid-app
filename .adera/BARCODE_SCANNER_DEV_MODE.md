# Barcode Scanner - Development Mode Exemption

## Date: 2025-01-19

## Issue
Runtime error: "Cannot find native module 'ExpoBarCodeScanner'"

The `expo-barcode-scanner` package was listed in dependencies but the native module wasn't properly linked, causing the app to crash at runtime when accessing QR scanning features.

## Solution Applied - Development Phase Exemption

### 1. Safe Wrapper Created (`apps/adera-ptp/src/utils/barcodeScannerSafe.js`)

Created a safety wrapper that:
- Attempts to load the native module
- Falls back to a mock implementation if the module is unavailable
- Exports `isBarcodeAvailable` flag to check availability
- Prevents runtime crashes during development

**Key Features:**
```javascript
// Try to import native module
try {
  BarCodeScannerModule = require('expo-barcode-scanner').BarCodeScanner;
  isAvailable = true;
} catch (error) {
  console.warn('[DEV] BarCodeScanner native module not available. Using mock fallback.');
  isAvailable = false;
}

// Mock implementation returns denied permissions
const MockBarCodeScanner = {
  requestPermissionsAsync: async () => ({ status: 'denied', ... }),
  getPermissionsAsync: async () => ({ status: 'denied', ... }),
};
```

### 2. Updated Files

**Screens:**
- ✅ `apps/adera-ptp/src/screens/partner/ScanQR.js` - Shows dev mode placeholder
- ✅ `apps/adera-ptp/src/screens/customer/TrackParcel.js` - Shows scanner unavailable message

**Hooks:**
- ✅ `apps/adera-ptp/src/hooks/useBarcodePermissions.js`
- ✅ `apps/adera-ptp/src/hooks/useCameraPermission.js`

All now import from `barcodeScannerSafe` instead of `expo-barcode-scanner` directly.

### 3. User Experience in Dev Mode

**Partner ScanQR Screen:**
```
┌─────────────────────────────────┐
│        ⚠️ Warning Icon           │
│                                 │
│     Development Mode            │
│                                 │
│  Barcode scanner is currently   │
│  disabled for development.      │
│                                 │
│  To enable scanning, rebuild:   │
│  [ npx expo prebuild --clean ]  │
│                                 │
│      [ Go Back Button ]         │
└─────────────────────────────────┘
```

**Customer TrackParcel QR Button:**
- QR scanner icon still visible (for UI consistency)
- When clicked, shows "Scanner Unavailable" message
- User can go back and manually enter tracking ID

## Why This Approach?

1. **Non-blocking**: Development can continue without fixing native modules
2. **Graceful degradation**: App doesn't crash, shows helpful message
3. **Easy to enable later**: Just run prebuild commands when needed
4. **Clear indication**: Users/testers know it's a dev limitation

## Proper Fix (For Production)

When ready to enable barcode scanning:

### Option 1: EAS Build (Recommended for production)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Option 2: Local Development Build
```bash
# Clean and prebuild native directories
npx expo prebuild --clean

# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

### Option 3: Remove Wrapper (After native modules work)
1. Delete `apps/adera-ptp/src/utils/barcodeScannerSafe.js`
2. Revert all imports back to `expo-barcode-scanner`
3. Remove dev mode checks in screens

## Related Feature: Manual Tracking Input

See `.adera/MANUAL_TRACKING_INPUT.md` for complete documentation on the manual tracking code input feature that serves as the primary fallback when QR scanning is unavailable.

**Key Points**:
- Manual input uses format validation (e.g., AD001234)
- Works identically whether scanner is available or not
- Provides consistent UX across dev and production modes
- Full error handling and user guidance

## Testing Checklist

### Current State (Dev Mode)
- [x] App starts without crashing
- [x] Partner dashboard accessible
- [x] Customer dashboard accessible
- [x] ScanQR screen shows manual input mode
- [x] TrackParcel has both manual input and QR button
- [x] Manual tracking code validation works
- [x] Error messages display correctly

### Future State (With Native Module)
- [ ] Camera permission prompt appears
- [ ] QR codes scan successfully
- [ ] Scanned data populates correctly
- [ ] Error handling works for invalid QR codes

## Files Modified

1. **NEW**: `apps/adera-ptp/src/utils/barcodeScannerSafe.js` - Safe wrapper
2. `apps/adera-ptp/src/screens/partner/ScanQR.js` - Added dev mode UI
3. `apps/adera-ptp/src/screens/customer/TrackParcel.js` - Added availability check
4. `apps/adera-ptp/src/hooks/useBarcodePermissions.js` - Updated import
5. `apps/adera-ptp/src/hooks/useCameraPermission.js` - Updated import

## Notes

- This is a **temporary development solution**
- Do NOT deploy to production with this exemption
- Native modules must be properly built for production release
- Alternative: Use Expo Go for quick testing (barcode scanner works in Expo Go)

---

**Status**: ✅ Development mode exemption active - App runs without crashes
**Next Step**: When ready for production, run EAS build or local prebuild
