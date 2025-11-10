# Adera PTP - Testing Guide

## 🚀 Quick Start

### Start Development Server

**Web:**
```bash
cd apps/adera-ptp
pnpm start --web
```

**Native (iOS/Android):**
```bash
cd apps/adera-ptp
pnpm start
# Then press 'i' for iOS or 'a' for Android
```

## 📋 Testing Checklist

### 1. Create Parcel Flow (Customer Role)

#### Step 1: Recipient Information
- [ ] Enter recipient name (validation: min 2 chars, max 50)
- [ ] Enter Ethiopian phone number (validation: 09XXXXXXXX format)
- [ ] Verify inline error messages appear for invalid inputs
- [ ] Verify phone number auto-formats as you type
- [ ] Click "Next" - should validate and show errors if invalid
- [ ] Verify form state persists if you leave and return

#### Step 2: Package Details
- [ ] Select package size (Document, Small, Medium, Large)
- [ ] Select package type
- [ ] Add description (optional)
- [ ] Upload photos (max 3):
  - [ ] **Web**: Click "Add Photo" - file picker should open
  - [ ] **Native**: Click "Add Photo" - image picker should open
  - [ ] Verify photo preview appears
  - [ ] Verify you can remove photos
  - [ ] Verify max 3 photos limit is enforced
- [ ] Click "Next" - should validate package size and type

#### Step 3: Partner Selection
- [ ] Click "Select Drop-off Location" button
- [ ] **Partner Selection Modal should open:**
  - [ ] Map view displays (web: Leaflet, native: react-native-maps)
  - [ ] Partners shown as markers on map
  - [ ] User location shown (if permission granted)
  - [ ] List view shows partners with distance
  - [ ] Search functionality works
  - [ ] Filter by type (dropoff/pickup) works
  - [ ] Sort by distance/name/rating works
  - [ ] Click partner in list or map - should select
  - [ ] Click "Select" button - modal closes, partner selected
- [ ] Repeat for "Select Pick-up Location"
- [ ] Verify estimated price updates when partners selected
- [ ] Click "Next" - should validate both partners selected

#### Step 4: Payment & Confirmation
- [ ] Review summary (recipient, package, partners, photos count)
- [ ] Select payment method
- [ ] Accept terms and conditions
- [ ] Click "Submit" button
- [ ] Verify loading state during submission
- [ ] Verify success notification appears
- [ ] Verify form data cleared after submission

### 2. Map Functionality

#### Web (Leaflet)
- [ ] Map loads without errors
- [ ] OpenStreetMap tiles display correctly
- [ ] Markers appear for all partners
- [ ] User location marker appears (if permission granted)
- [ ] Click marker - popup shows partner info
- [ ] Click "Select" in popup - partner selected
- [ ] Map zooms/pan works smoothly
- [ ] No console errors related to Leaflet

#### Native (react-native-maps)
- [ ] Map loads without errors
- [ ] Map tiles display correctly
- [ ] Markers appear for all partners
- [ ] User location shown (if permission granted)
- [ ] Tap marker - callout shows partner info
- [ ] Tap callout - partner selected
- [ ] Map gestures work (pinch to zoom, pan)
- [ ] No console errors related to react-native-maps

### 3. Form State Persistence

- [ ] Fill form partially (Step 1-2)
- [ ] Leave screen (navigate away)
- [ ] Return to Create Parcel screen
- [ ] Verify form data restored
- [ ] Verify restored data expires after 24 hours
- [ ] Verify form clears after successful submission

### 4. Error Handling

#### Network Errors
- [ ] Disable network
- [ ] Try to load partners
- [ ] Verify error message appears
- [ ] Verify app doesn't crash

#### Location Permissions
- [ ] Deny location permission
- [ ] Verify app handles gracefully
- [ ] Verify notification/warning appears
- [ ] Verify partners still load (without distance)

#### Photo Upload Errors
- [ ] Try uploading file > 5MB
- [ ] Verify error message
- [ ] Try uploading non-image file
- [ ] Verify error message

### 5. Console Logs to Monitor

#### Expected Logs (Normal Operation)
```
[CreateParcel] Partners loaded: { count: X, loading: false, hasUserLocation: true/false }
[usePartners] Fetching partners...
[usePartners] Partners fetched successfully: X partners
```

#### Warning Logs (Non-Critical)
```
[usePartners] Location timeout on web
[usePartners] Location permission not granted
[WebMapView] react-leaflet not available: (only if leaflet fails to load)
```

#### Error Logs (Should Not Appear)
```
❌ Error fetching partners: ...
❌ Error submitting parcel: ...
❌ Error processing image: ...
❌ Location permission error: ...
```

### 6. Performance Checks

- [ ] Map loads within 2-3 seconds
- [ ] Partner list renders smoothly (no lag)
- [ ] Photo preview appears immediately
- [ ] Form navigation is instant
- [ ] No memory leaks (check with React DevTools)
- [ ] App size remains reasonable

### 7. Cross-Platform Testing

#### Web
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if on Mac)
- [ ] Test responsive design (mobile viewport)
- [ ] Test keyboard navigation

#### iOS (if available)
- [ ] Test on physical device
- [ ] Test on simulator
- [ ] Test location permissions
- [ ] Test photo picker
- [ ] Test map gestures

#### Android (if available)
- [ ] Test on physical device
- [ ] Test on emulator
- [ ] Test location permissions
- [ ] Test photo picker
- [ ] Test map gestures

## 🐛 Common Issues & Solutions

### Issue: Map not loading on web
**Solution:** Check browser console for Leaflet errors. Verify CSS is loaded.

### Issue: Partners not showing
**Solution:** Check Supabase connection. Verify `usePartners` hook is fetching data.

### Issue: Photo upload not working on web
**Solution:** Check browser console. Verify `document` is available.

### Issue: Form state not persisting
**Solution:** Check AsyncStorage permissions. Verify storage key is correct.

### Issue: Location not working
**Solution:** Check location permissions. On web, verify browser geolocation API.

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Platform: Web / iOS / Android

Create Parcel Flow: ✅ / ❌
Map Functionality: ✅ / ❌
Form Persistence: ✅ / ❌
Error Handling: ✅ / ❌
Performance: ✅ / ❌

Issues Found:
1. 
2. 
3. 

Notes:
```

