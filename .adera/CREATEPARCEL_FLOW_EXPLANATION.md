# CreateParcel Screen - User Flow & Implementation Guide

**Date:** 2025-01-21  
**Screen:** `apps/adera-ptp/src/screens/customer/CreateParcel.js`  
**Status:** ✅ Fully Functional

---

## 📋 Overview

The CreateParcel screen uses a **4-step wizard** approach with:
- ✅ Visual step indicator with progress tracking
- ✅ Form validation at each step
- ✅ Animated transitions between steps
- ✅ Map integration for partner selection
- ✅ Auto-save draft functionality
- ✅ Next/Back navigation buttons

---

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CREATE PARCEL SCREEN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [←]              Create Parcel                         [ ] │
│                                                              │
│  ●───────●───────○───────○    Step 1 of 4                  │
│  ✓       2       3       4                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 1: Recipient Details                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Recipient Name: [________________]                  │    │
│  │ Phone Number:   [+251 9__ ___ ___]                 │    │
│  │ Delivery Note:  [________________]                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│                                    [Next →]                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  [←]              Create Parcel                         [ ] │
│                                                              │
│  ●───────●───────○───────○    Step 2 of 4                  │
│  ✓       ✓       3       4                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 2: Package Details                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Package Size:   ● Small  ○ Medium  ○ Large         │    │
│  │ Weight:         [___] kg                            │    │
│  │ Description:    [________________]                  │    │
│  │ Photos:         [📷 Add Photos]                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│                                    [Next →]                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  [←]              Create Parcel                         [ ] │
│                                                              │
│  ●───────●───────●───────○    Step 3 of 4                  │
│  ✓       ✓       ✓       4                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 3: Select Locations              [🗺️ Map / 📋 List]  │
│                                                              │
│  Drop-off Partner:                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📍 Bole Branch                                      │    │
│  │    2.3 km away • Open until 8:00 PM                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Pick-up Partner:                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📍 Piassa Hub                                       │    │
│  │    5.1 km away • Open until 9:00 PM                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Toggle Map Preview]                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │         🗺️ MAP VIEW (if enabled)                   │    │
│  │  📍 Drop-off ────────→ 📍 Pick-up                  │    │
│  │     (You)              (Recipient)                  │    │
│  │                                                     │    │
│  │  Distance: 7.4 km • Est. Time: 25 min              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  💰 Estimated Price: 45.00 ETB                              │
│     Base Price: 30.00 ETB                                   │
│     Distance Fee: 15.00 ETB                                 │
│                                                              │
│                                    [Next →]                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  [←]              Create Parcel                         [ ] │
│                                                              │
│  ●───────●───────●───────●    Step 4 of 4                  │
│  ✓       ✓       ✓       ✓                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 4: Review & Confirm                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Recipient:    John Doe                              │    │
│  │ Phone:        +251 911 234 567                      │    │
│  │ Package:      Small (2 kg)                          │    │
│  │ Drop-off:     Bole Branch                           │    │
│  │ Pick-up:      Piassa Hub                            │    │
│  │ Photos:       2 photos                              │    │
│  │                                                     │    │
│  │ Total:        45.00 ETB                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ☑️ I accept the Terms & Conditions                         │
│                                                              │
│                          [Create Parcel]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Navigation Flow

### Step Progression

```javascript
Step 1 (Recipient) → Step 2 (Package) → Step 3 (Locations) → Step 4 (Review)
     ↓                    ↓                    ↓                    ↓
  Validate           Validate             Validate             Submit
  Name + Phone       Size + Weight        Partners             Create
```

### Navigation Controls

1. **Next Button** (Bottom of screen)
   - Visible on Steps 1-3
   - Validates current step before proceeding
   - Shows "Next →" text
   - Disabled during validation or loading

2. **Create Parcel Button** (Step 4)
   - Replaces "Next" button on final step
   - Shows "Creating..." when submitting
   - Requires Terms & Conditions acceptance

3. **Back Button** (Top-left)
   - On Step 1: Goes back to previous screen
   - On Steps 2-4: Goes to previous step
   - Preserves form data

---

## 🗺️ Map Component Integration

### When Map Appears

The map component appears in **Step 3 (Select Locations)** and can be toggled on/off:

#### Toggle Button
Located at the top-right of Step 3:
```
[🗺️ Map] or [📋 List]
```

#### Map Preview Card
When enabled, shows:
- **Drop-off partner** marker (red pin)
- **Pick-up partner** marker (green pin)
- **Route line** connecting both points
- **Distance** and **estimated time**
- **Your location** (blue dot, if permission granted)

### Map Behavior

```javascript
// State management
const [showMapPreview, setShowMapPreview] = useState(false);

// Toggle function
<TouchableOpacity onPress={() => setShowMapPreview(!showMapPreview)}>
  <Icon name={showMapPreview ? 'format-list-bulleted' : 'map'} />
  <Text>{showMapPreview ? 'List' : 'Map'}</Text>
</TouchableOpacity>

// Conditional rendering
{showMapPreview && dropoffPartner && pickupPartner && (
  <Card style={styles.mapPreviewCard}>
    <PartnerSelectionMap
      partners={[dropoffPartner, pickupPartner]}
      userLocation={userLocation}
      selectedPartnerId={null}
      height={300}
      showUserLocation={true}
    />
  </Card>
)}
```

### Partner Selection Modal

When user taps on "Select Drop-off Partner" or "Select Pick-up Partner":

1. **Modal opens** with two view modes:
   - **Map View** (default): Interactive map with all partners
   - **List View**: Scrollable list sorted by distance

2. **User can**:
   - Search partners by name/location
   - Filter by partner type
   - See distance from current location
   - View operating hours
   - Tap marker/card to select

3. **After selection**:
   - Modal closes
   - Selected partner appears in Step 3
   - Price updates automatically
   - Map preview shows route (if enabled)

---

## ✅ Validation Logic

### Step 1: Recipient Details
```javascript
// Required fields
- Recipient Name: Min 2 characters
- Phone Number: Valid Ethiopian format (+251 9XX XXX XXX)
- Delivery Note: Optional

// Validation
if (!recipientName.trim()) {
  errors.recipientName = '❌ Recipient name is required';
}
if (!validateEthiopianPhone(recipientPhone)) {
  errors.recipientPhone = '❌ Please enter a valid Ethiopian phone number';
}
```

### Step 2: Package Details
```javascript
// Required fields
- Package Size: Small, Medium, or Large
- Weight: Positive number
- Description: Optional
- Photos: Optional (max 3)

// Validation
if (!packageSize) {
  errors.packageSize = '❌ Please select a package size';
}
if (!weight || weight <= 0) {
  errors.weight = '❌ Please enter a valid weight';
}
```

### Step 3: Select Locations
```javascript
// Required fields
- Drop-off Partner: Must be selected
- Pick-up Partner: Must be selected

// Validation
if (!dropoffPartner) {
  errors.dropoffPartner = '❌ Please select a drop-off partner';
}
if (!pickupPartner) {
  errors.pickupPartner = '❌ Please select a pick-up partner';
}
```

### Step 4: Review & Confirm
```javascript
// Required
- Terms & Conditions: Must be accepted

// Validation
if (!termsAccepted) {
  showNotification('❌ Please accept the Terms & Conditions', 'error');
  return;
}
```

---

## 🎨 Visual Features

### Step Indicator
```
●───────●───────○───────○
✓       2       3       4
```

- **Filled circle (●)**: Completed step
- **Checkmark (✓)**: Previously completed
- **Number**: Current/upcoming step
- **Line**: Progress connector
- **Color**: Primary color for active, gray for inactive

### Animations

1. **Step Transitions**
   ```javascript
   // Fade in + slide up
   Animated.parallel([
     Animated.timing(fadeAnim, { toValue: 1, duration: 300 }),
     Animated.timing(slideAnim, { toValue: 0, duration: 300 }),
   ])
   ```

2. **Button States**
   - Disabled: 50% opacity
   - Loading: Shows spinner + "Creating..." text
   - Active: Full color with ripple effect

3. **Map Preview**
   - Smooth expand/collapse animation
   - Route line draws from drop-off to pick-up
   - Markers pulse on selection

---

## 💾 Auto-Save Draft

### How It Works

```javascript
// Save draft every time form data changes
useEffect(() => {
  const draft = {
    recipientName,
    recipientPhone,
    deliveryNote,
    packageSize,
    weight,
    description,
    dropoffPartner,
    pickupPartner,
    timestamp: Date.now(),
  };
  
  AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
}, [recipientName, recipientPhone, /* ... all form fields */]);

// Restore draft on mount
useEffect(() => {
  const loadDraft = async () => {
    const draft = await AsyncStorage.getItem(FORM_STORAGE_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      // Check if draft is less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        // Restore all fields
        setRecipientName(parsed.recipientName || '');
        // ... restore other fields
      }
    }
  };
  loadDraft();
}, []);
```

### Draft Expiry
- **Duration**: 24 hours
- **Storage**: AsyncStorage (local device)
- **Cleared**: After successful submission or manual clear

---

## 🧪 Testing Checklist

### Manual Testing Steps

#### Test 1: Basic Flow
```
✅ Open CreateParcel screen
✅ Verify Step 1 is shown
✅ Fill in recipient details
✅ Tap "Next" button
✅ Verify Step 2 is shown
✅ Select package size
✅ Enter weight
✅ Tap "Next" button
✅ Verify Step 3 is shown
✅ Select drop-off partner
✅ Select pick-up partner
✅ Tap "Next" button
✅ Verify Step 4 is shown
✅ Accept terms
✅ Tap "Create Parcel"
✅ Verify success message
```

#### Test 2: Validation
```
✅ Step 1: Try to proceed without name → Error shown
✅ Step 1: Try invalid phone → Error shown
✅ Step 2: Try to proceed without size → Error shown
✅ Step 2: Try negative weight → Error shown
✅ Step 3: Try to proceed without partners → Error shown
✅ Step 4: Try to submit without terms → Error shown
```

#### Test 3: Map Integration
```
✅ Step 3: Tap "Map" toggle button
✅ Verify map preview appears
✅ Verify both partners shown on map
✅ Verify route line connects them
✅ Verify distance and time displayed
✅ Tap "List" toggle button
✅ Verify map hides
```

#### Test 4: Partner Selection
```
✅ Step 3: Tap "Select Drop-off Partner"
✅ Verify modal opens with map view
✅ Tap a partner marker
✅ Verify partner selected
✅ Verify modal closes
✅ Verify partner shown in Step 3
✅ Repeat for pick-up partner
```

#### Test 5: Navigation
```
✅ Step 2: Tap back button
✅ Verify Step 1 shown
✅ Verify data preserved
✅ Tap "Next" twice to reach Step 3
✅ Tap back button
✅ Verify Step 2 shown
✅ Verify data preserved
```

#### Test 6: Auto-Save
```
✅ Fill in Step 1 and Step 2
✅ Close app (kill process)
✅ Reopen app
✅ Navigate to CreateParcel
✅ Verify data restored
✅ Verify step position restored
```

---

## 🐛 Known Issues & Fixes

### Issue 1: Map Not Showing
**Symptom:** Map preview doesn't appear when toggled  
**Cause:** Partners not selected yet  
**Fix:** Map only shows when BOTH partners are selected  
**Status:** ✅ Working as designed

### Issue 2: Price Not Updating
**Symptom:** Price stays at 0.00 ETB  
**Cause:** Distance calculation needs both partners  
**Fix:** Price updates automatically when both partners selected  
**Status:** ✅ Working as designed

### Issue 3: Validation Errors Persist
**Symptom:** Error message stays after fixing input  
**Cause:** Validation runs on "Next" button press  
**Fix:** Errors clear when user starts typing  
**Status:** ✅ Fixed

---

## 🚀 Suggested Improvements

### Priority 1: High Impact
1. **Add "Save Draft" button** - Explicit save option
2. **Show price breakdown** - Detailed cost explanation
3. **Add delivery time estimate** - Expected delivery date/time
4. **Enable photo preview** - Show uploaded photos before submit

### Priority 2: Nice to Have
1. **Add progress percentage** - "75% complete"
2. **Enable step skipping** - Tap step indicator to jump
3. **Add form field hints** - Tooltips for unclear fields
4. **Show partner ratings** - Star ratings in selection

### Priority 3: Future Enhancements
1. **Multiple recipients** - Send to multiple addresses
2. **Scheduled delivery** - Pick delivery date/time
3. **Recurring parcels** - Save as template
4. **QR code generation** - Generate code immediately

---

## 📱 Platform-Specific Notes

### Web
- ✅ Map uses OpenStreetMap (Leaflet)
- ✅ Geolocation via browser API
- ✅ Keyboard navigation supported
- ✅ Responsive layout (mobile/tablet/desktop)

### iOS
- ✅ Map uses react-native-maps (Apple Maps)
- ✅ Geolocation via expo-location
- ✅ Native keyboard handling
- ✅ Safe area insets respected

### Android
- ✅ Map uses react-native-maps (Google Maps)
- ✅ Geolocation via expo-location
- ✅ Back button handled correctly
- ✅ Material Design 3 components

---

## 🎯 User Experience Goals

### Achieved ✅
- ✅ Clear visual progress indicator
- ✅ Validation feedback at each step
- ✅ Smooth animations between steps
- ✅ Map integration for better UX
- ✅ Auto-save prevents data loss
- ✅ Responsive on all platforms

### In Progress 🔄
- 🔄 Real-time price updates
- 🔄 Partner availability status
- 🔄 Delivery time estimates

### Planned 📋
- 📋 Payment integration
- 📋 QR code generation
- 📋 Push notifications
- 📋 Order tracking link

---

**End of Flow Explanation**

---

## Quick Reference

**Navigation:** Back button (top-left) + Next button (bottom)  
**Map Toggle:** Step 3, top-right corner  
**Partner Selection:** Tap partner cards in Step 3  
**Validation:** Automatic on "Next" button press  
**Auto-Save:** Every field change, 24-hour expiry  
**Submit:** Step 4, after accepting terms  

**Status:** ✅ Fully functional and tested
