import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeArea, Card, TextInput, Button, useTheme, NotificationContainer } from '@adera/ui';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '@adera/auth';
import { usePartners } from '../../hooks/usePartners';
import PartnerSelectionModal from '../../components/PartnerSelectionModal';
import PartnerSelectionMap from '../../components/PartnerSelectionMap';
import PhotoUpload from '../../components/PhotoUpload';
import { validateEthiopianPhone, validateName, formatEthiopianPhone } from '../../utils/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FORM_STORAGE_KEY = '@adera_parcel_draft';

const CreateParcel = ({ navigation }) => {
  const theme = useTheme();
  const { addNotification, notifications, dismissNotification } = useAuth();
  const { partners, loading: partnersLoading, userLocation, error: partnersError } = usePartners();
  
  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CreateParcel] Partners loaded:', {
        count: partners.length,
        loading: partnersLoading,
        hasUserLocation: !!userLocation,
        error: partnersError,
      });
    }
  }, [partners.length, partnersLoading, userLocation, partnersError]);
  
  // Form state
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [packageType, setPackageType] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [dropoffPartner, setDropoffPartner] = useState(null);
  const [pickupPartner, setPickupPartner] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState(null); // 'dropoff' or 'pickup'
  const [locationPermission, setLocationPermission] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Pricing
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  
  const packageSizes = [
    { id: 'document', label: 'Document', icon: 'file-document', basePrice: 50 },
    { id: 'small', label: 'Small (< 2kg)', icon: 'package-variant', basePrice: 100 },
    { id: 'medium', label: 'Medium (2-5kg)', icon: 'package', basePrice: 150 },
    { id: 'large', label: 'Large (5-10kg)', icon: 'package-variant-closed', basePrice: 250 },
  ];

  const packageTypes = [
    { id: 'fragile', label: 'Fragile', icon: 'package-variant' },
    { id: 'electronics', label: 'Electronics', icon: 'laptop' },
    { id: 'clothing', label: 'Clothing', icon: 'tshirt-crew' },
    { id: 'food', label: 'Food', icon: 'food' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal' },
  ];

  const paymentMethods = [
    { id: 'wallet', label: 'Wallet', icon: 'wallet', available: true },
    { id: 'telebirr', label: 'Telebirr', icon: 'cellphone', available: true },
    { id: 'chapa', label: 'Chapa', icon: 'credit-card', available: true },
    { id: 'cod', label: 'Cash on Dropoff', icon: 'cash', available: true },
  ];

  // Load saved form state when partners are loaded (only once)
  const [hasLoadedSavedForm, setHasLoadedSavedForm] = useState(false);

  // Save form state whenever it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormState();
    }, 1000); // Debounce by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [recipientName, recipientPhone, packageSize, packageType, description, dropoffPartner, pickupPartner, paymentMethod, photos]);

  // Calculate price when dependencies change
  useEffect(() => {
    calculatePrice();
  }, [packageSize, dropoffPartner, pickupPartner]);

  // Animate step transitions
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // useEffect(() => {
  //   requestLocationPermission();
  // }, []);

  // useEffect(() => {
  //   calculatePrice();
  // }, [packageSize, dropoffPartner, pickupPartner]);

  // const requestLocationPermission = async () => {
  //   const { status } = await Location.requestForegroundPermissionsAsync();
  //   if (status !== 'granted') {
  //     Alert.alert('Permission Required', 'Location permission is needed to provide accurate partner locations.', [
  //       { text: 'OK', onPress: () => requestLocationPermission() }
  //     ]);
  //   }
  //   setLocationPermission(status === 'granted');
  // };

  
  // Request location permission
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        addNotification('Location permission is needed for accurate partner locations', 'warning', 5000);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      addNotification('Failed to request location permission', 'error', 5000);
    }
  };

  // Save form state to local storage
  const saveFormState = useCallback(async () => {
    try {
      const formData = {
        recipientName,
        recipientPhone,
        packageSize,
        packageType,
        description,
        dropoffPartnerId: dropoffPartner?.id,
        pickupPartnerId: pickupPartner?.id,
        paymentMethod,
        photos: photos.map(p => ({ uri: p.uri, type: p.type, name: p.name })),
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }, [recipientName, recipientPhone, packageSize, packageType, description, dropoffPartner, pickupPartner, paymentMethod, photos]);

  // Load saved form state
  const loadSavedForm = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const formData = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (Date.now() - formData.timestamp < 24 * 60 * 60 * 1000) {
          setRecipientName(formData.recipientName || '');
          setRecipientPhone(formData.recipientPhone || '');
          setPackageSize(formData.packageSize || '');
          setPackageType(formData.packageType || '');
          setDescription(formData.description || '');
          setPaymentMethod(formData.paymentMethod || '');
          setPhotos(formData.photos || []);
          
          // Restore partners if available (wait for partners to load)
          if (formData.dropoffPartnerId && partners.length > 0) {
            const partner = partners.find(p => p.id === formData.dropoffPartnerId);
            if (partner) setDropoffPartner(partner);
          }
          if (formData.pickupPartnerId && partners.length > 0) {
            const partner = partners.find(p => p.id === formData.pickupPartnerId);
            if (partner) setPickupPartner(partner);
          }
          
          addNotification('Restored previous form data', 'info', 3000);
        } else {
          // Clear old data
          await AsyncStorage.removeItem(FORM_STORAGE_KEY);
        }
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error loading form state:', error);
      return Promise.resolve(); // Resolve even on error to prevent hanging
    }
  }, [partners, addNotification]);

  // Call loadSavedForm when partners are loaded (only once)
  useEffect(() => {
    if (!partnersLoading && !hasLoadedSavedForm) {
      loadSavedForm().then(() => setHasLoadedSavedForm(true)).catch(() => setHasLoadedSavedForm(true));
    }
  }, [partnersLoading, hasLoadedSavedForm, loadSavedForm]);

  // Handle network errors
  useEffect(() => {
    if (partnersError) {
      addNotification('Failed to load partners. Please check your connection.', 'error', 5000);
    }
  }, [partnersError, addNotification]);



  const calculatePrice = useCallback(() => {
    if (!packageSize || !dropoffPartner || !pickupPartner) {
      setEstimatedPrice(0);
      return;
    }

    const sizeData = packageSizes.find(s => s.id === packageSize);
    const basePrice = sizeData?.basePrice || 0;
    const dropoffDistance = typeof dropoffPartner.distance === 'number' ? dropoffPartner.distance : 0;
    const pickupDistance = typeof pickupPartner.distance === 'number' ? pickupPartner.distance : 0;
    const avgDistance = (dropoffDistance + pickupDistance) / 2;
    const distancePrice = avgDistance * 20;
    
    setEstimatedPrice(Math.round(basePrice + distancePrice));
  }, [packageSize, dropoffPartner, pickupPartner]);

  const validateStep = (stepNum) => {
    const errors = {};
    
    if (stepNum === 1) {
      const nameValidation = validateName(recipientName);
      if (!nameValidation.valid) {
        errors.recipientName = nameValidation.error;
      }
      
      const phoneValidation = validateEthiopianPhone(recipientPhone);
      if (!phoneValidation.valid) {
        errors.recipientPhone = phoneValidation.error;
      }
    } else if (stepNum === 2) {
      if (!packageSize) {
        errors.packageSize = 'Please select package size';
      }
      if (!packageType) {
        errors.packageType = 'Please select package type';
      }
    } else if (stepNum === 3) {
      if (!dropoffPartner) {
        errors.dropoffPartner = 'Please select drop-off location';
      }
      if (!pickupPartner) {
        errors.pickupPartner = 'Please select pick-up location';
      }
    } else if (stepNum === 4) {
      if (!paymentMethod) {
        errors.paymentMethod = 'Please select a payment method';
      }
      if (!termsAccepted) {
        errors.termsAccepted = 'Please accept terms and conditions';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (!validateStep(step)) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        addNotification(firstError, 'error', 4000);
      }
      return;
    }

    // Clear errors for current step
    setValidationErrors({});
    
    if (step < 4) {
      setStep(step + 1);
      addNotification(`✅ Step ${step} completed`, 'success', 2000);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // TODO: Submit to Supabase
      const trackingId = `ADE${Date.now().toString().slice(-8)}`;
      
      // Clear saved form state
      await AsyncStorage.removeItem(FORM_STORAGE_KEY);
      
      // Show success notification
      addNotification('✅ Parcel created successfully!', 'success', 5000);
      
      // Show alert with tracking ID (critical info)
      Alert.alert(
        'Parcel Created!',
        `Your parcel has been created.\n\nTracking ID: ${trackingId}\n\nPlease save this tracking ID for future reference.`,
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation?.navigate?.('track', { trackingId });
            },
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => {
              // Reset form
              setStep(1);
              setRecipientName('');
              setRecipientPhone('');
              setPackageSize('');
              setPackageType('');
              setDescription('');
              setPhotos([]);
              setDropoffPartner(null);
              setPickupPartner(null);
              setPaymentMethod('');
              setTermsAccepted(false);
              setEstimatedPrice(0);
              setValidationErrors({});
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting parcel:', error);
      addNotification('Failed to create parcel. Please try again.', 'error', 5000);
      Alert.alert('Error', 'Failed to create parcel. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartnerSelect = (partner) => {
    if (partnerModalType === 'dropoff') {
      setDropoffPartner(partner);
      addNotification(`Selected ${partner.name} as drop-off location`, 'success', 3000);
    } else if (partnerModalType === 'pickup') {
      setPickupPartner(partner);
      addNotification(`Selected ${partner.name} as pick-up location`, 'success', 3000);
    }
    setShowPartnerModal(false);
    setPartnerModalType(null);
  };

  const openPartnerModal = (type) => {
    if (partnersLoading) {
      addNotification('Loading partners...', 'info', 2000);
      return;
    }
    if (partnersError) {
      addNotification('Failed to load partners. Please try again.', 'error', 4000);
      return;
    }
    setPartnerModalType(type);
    setShowPartnerModal(true);
  };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)} m away`;
    return `${distance.toFixed(1)} km away`;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorWrapper}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: s <= step ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
            >
              {s < step ? (
                <MaterialCommunityIcons name="check" size={20} color="#FFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: s <= step ? '#FFF' : theme.colors.text.secondary },
                  ]}
                >
                  {s}
                </Text>
              )}
            </View>
            {s < 4 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: s < step ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
        Step {step} of 4
      </Text>
    </View>
  );

  const handlePhoneChange = (text) => {
    // Format phone number as user types
    const formatted = formatEthiopianPhone(text);
    setRecipientPhone(formatted);
    // Clear validation error when user starts typing
    if (validationErrors.recipientPhone) {
      setValidationErrors({ ...validationErrors, recipientPhone: null });
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Recipient Details
      </Text>
      <TextInput
        label="Recipient Name"
        value={recipientName}
        onChangeText={(text) => {
          setRecipientName(text);
          if (validationErrors.recipientName) {
            setValidationErrors({ ...validationErrors, recipientName: null });
          }
        }}
        placeholder="Enter recipient's full name"
        autoCapitalize="words"
        leftIcon="account"
        error={validationErrors.recipientName}
      />
      <TextInput
        label="Phone Number"
        value={recipientPhone}
        onChangeText={handlePhoneChange}
        placeholder="0912345678"
        keyboardType="phone-pad"
        leftIcon="phone"
        error={validationErrors.recipientPhone}
      />
      {validationErrors.recipientPhone && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {validationErrors.recipientPhone}
        </Text>
      )}
      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description of parcel contents"
        multiline
        numberOfLines={3}
        leftIcon="text"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Package Details
      </Text>
      
      <PhotoUpload
        photos={photos}
        onPhotosChange={setPhotos}
        maxPhotos={3}
        label="Parcel Photos"
        description="Upload up to 3 photos of your parcel (optional but recommended)"
      />
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 24 }]}>
        Select Package Size
      </Text>
      <View style={styles.optionsGrid}>
        {packageSizes.map((size) => (
          <TouchableOpacity
            key={size.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: packageSize === size.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: packageSize === size.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPackageSize(size.id)}
          >
            <MaterialCommunityIcons
              name={size.icon}
              size={32}
              color={packageSize === size.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: packageSize === size.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {size.label}
            </Text>
            <Text style={[styles.optionPrice, { color: theme.colors.text.secondary }]}>
              From {size.basePrice} ETB
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 24 }]}>
        Package Type
      </Text>
      <View style={styles.typeList}>
        {packageTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeItem,
              {
                backgroundColor: packageType === type.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: packageType === type.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPackageType(type.id)}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={24}
              color={packageType === type.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.typeLabel,
                {
                  color: packageType === type.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {type.label}
            </Text>
            {packageType === type.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepTitleRow}>
        <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
          Select Locations
        </Text>
        <TouchableOpacity
          style={[styles.mapToggleButton, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={() => setShowMapPreview(!showMapPreview)}
        >
          <MaterialCommunityIcons
            name={showMapPreview ? 'format-list-bulleted' : 'map'}
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.mapToggleText, { color: theme.colors.primary }]}>
            {showMapPreview ? 'List' : 'Map'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Drop-off Partner
      </Text>
      {validationErrors.dropoffPartner && (
        <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>
          {validationErrors.dropoffPartner}
        </Text>
      )}
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => openPartnerModal('dropoff')}
          disabled={partnersLoading}
        >
          {dropoffPartner ? (
            <View style={styles.selectedLocation}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
                  {dropoffPartner.name}
                </Text>
                <Text style={[styles.locationDistance, { color: theme.colors.text.secondary }]}>
                  {formatDistance(dropoffPartner.distance)}
                </Text>
                {dropoffPartner.address && (
                  <Text style={[styles.locationAddress, { color: theme.colors.text.secondary }]}>
                    {dropoffPartner.address}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={24}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.locationPlaceholderText, { color: theme.colors.text.secondary }]}>
                {partnersLoading ? 'Loading partners...' : 'Select drop-off location'}
              </Text>
            </View>
          )}
          {partnersLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text.secondary}
            />
          )}
        </TouchableOpacity>
      </Card>
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Pick-up Partner
      </Text>
      {validationErrors.pickupPartner && (
        <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>
          {validationErrors.pickupPartner}
        </Text>
      )}
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => openPartnerModal('pickup')}
          disabled={partnersLoading}
        >
          {pickupPartner ? (
            <View style={styles.selectedLocation}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.secondary}
              />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
                  {pickupPartner.name}
                </Text>
                <Text style={[styles.locationDistance, { color: theme.colors.text.secondary }]}>
                  {formatDistance(pickupPartner.distance)}
                </Text>
                {pickupPartner.address && (
                  <Text style={[styles.locationAddress, { color: theme.colors.text.secondary }]}>
                    {pickupPartner.address}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={24}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.locationPlaceholderText, { color: theme.colors.text.secondary }]}>
                {partnersLoading ? 'Loading partners...' : 'Select pick-up location'}
              </Text>
            </View>
          )}
          {partnersLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.text.secondary}
            />
          )}
        </TouchableOpacity>
      </Card>

      {/* Map Preview */}
      {showMapPreview && (dropoffPartner || pickupPartner) && (
        <Card style={styles.mapPreviewCard}>
          <View style={styles.mapPreviewHeader}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.colors.primary} />
            <Text style={[styles.mapPreviewTitle, { color: theme.colors.text.primary }]}>
              Route Preview
            </Text>
          </View>
          <PartnerSelectionMap
            partners={[dropoffPartner, pickupPartner].filter(Boolean)}
            userLocation={userLocation}
            selectedPartnerId={null}
            onPartnerSelect={() => {}}
            height={250}
            showUserLocation={true}
          />
          {dropoffPartner && pickupPartner && (
            <View style={styles.routeInfo}>
              <View style={styles.routeInfoRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
                <Text style={[styles.routeInfoText, { color: theme.colors.text.secondary }]}>
                  Drop-off: {dropoffPartner.name}
                </Text>
              </View>
              <View style={styles.routeInfoRow}>
                <MaterialCommunityIcons name="map-marker-check" size={16} color={theme.colors.secondary} />
                <Text style={[styles.routeInfoText, { color: theme.colors.text.secondary }]}>
                  Pick-up: {pickupPartner.name}
                </Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {estimatedPrice > 0 && (
        <Card style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.priceHeader}>
            <MaterialCommunityIcons name="cash" size={24} color={theme.colors.primary} />
            <View style={styles.priceInfo}>
              <Text style={[styles.priceLabel, { color: theme.colors.primary }]}>
                Estimated Price
              </Text>
              <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                {estimatedPrice.toFixed(2)} ETB
              </Text>
            </View>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: theme.colors.primary + '30' }]} />
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceRowLabel, { color: theme.colors.text.secondary }]}>
                Base Price
              </Text>
              <Text style={[styles.priceRowValue, { color: theme.colors.text.primary }]}>
                {packageSizes.find(s => s.id === packageSize)?.basePrice || 0} ETB
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceRowLabel, { color: theme.colors.text.secondary }]}>
                Distance Fee
              </Text>
              <Text style={[styles.priceRowValue, { color: theme.colors.text.primary }]}>
                {(estimatedPrice - (packageSizes.find(s => s.id === packageSize)?.basePrice || 0)).toFixed(2)} ETB
              </Text>
            </View>
          </View>
          <Text style={[styles.priceNote, { color: theme.colors.text.secondary }]}>
            💡 Final price may vary based on actual weight and dimensions
          </Text>
        </Card>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Payment & Confirmation
      </Text>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Payment Method
      </Text>
      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              {
                backgroundColor: paymentMethod === method.id
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: paymentMethod === method.id
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => setPaymentMethod(method.id)}
            disabled={!method.available}
          >
            <MaterialCommunityIcons
              name={method.icon}
              size={24}
              color={paymentMethod === method.id ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.paymentLabel,
                {
                  color: paymentMethod === method.id
                    ? theme.colors.primary
                    : theme.colors.text.primary,
                },
              ]}
            >
              {method.label}
            </Text>
            {paymentMethod === method.id && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text.primary }]}>
          Order Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Recipient
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {recipientName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Package Size
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {packageSizes.find(s => s.id === packageSize)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Drop-off
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {dropoffPartner?.name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            Pick-up
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
            {pickupPartner?.name}
          </Text>
        </View>
        {photos.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
              Photos
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.primary, fontWeight: '700' }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {estimatedPrice.toFixed(2)} ETB
          </Text>
        </View>
      </Card>

      {/* Terms and Conditions */}
      <TouchableOpacity
        style={styles.termsCheckbox}
        onPress={() => setTermsAccepted(!termsAccepted)}
      >
        <MaterialCommunityIcons
          name={termsAccepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={termsAccepted ? theme.colors.primary : theme.colors.text.secondary}
        />
        <Text style={[styles.termsText, { color: theme.colors.text.secondary }]}>
          I accept the{' '}
          <Text
            style={{ color: theme.colors.primary, fontWeight: '600' }}
            onPress={() => setShowTermsModal(true)}
          >
            Terms & Conditions
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeArea edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step > 1 ? handleBack : () => navigation?.goBack?.()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Create Parcel
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <Button
            title={step < 4 ? 'Next' : submitting ? 'Creating...' : 'Create Parcel'}
            onPress={handleNext}
            size="lg"
            style={styles.nextButton}
            disabled={submitting || partnersLoading}
          />
          {partnersLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                Loading partners...
              </Text>
            </View>
          )}
        </View>

        {/* Partner Selection Modal */}
        <PartnerSelectionModal
          visible={showPartnerModal}
          partners={partners}
          userLocation={userLocation}
          filterType={partnerModalType}
          onSelect={handlePartnerSelect}
          onClose={() => {
            setShowPartnerModal(false);
            setPartnerModalType(null);
          }}
          title={partnerModalType === 'dropoff' ? 'Select Drop-off Partner' : 'Select Pick-up Partner'}
        />

        {/* Notification Container */}
        <NotificationContainer
          notifications={notifications}
          onDismiss={dismissNotification}
        />

        {/* Terms Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <SafeArea edges={['top']}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  Terms & Conditions
                </Text>
                <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                <Text style={[styles.termsContent, { color: theme.colors.text.secondary }]}>
                  {`1. Parcel creation requires payment before processing.
                  
2. Prohibited items include weapons, drugs, hazardous materials, and illegal substances.

3. Maximum weight is 10kg. Oversized parcels require special handling.

4. Delivery times are estimated and not guaranteed.

5. Adera is not liable for damage to improperly packaged items.

6. COD requires recipient confirmation within 24 hours.

7. Tracking codes must be kept secure until delivery completion.

8. Disputes must be filed within 7 days of delivery.

9. Refunds are processed within 5-7 business days for canceled parcels.

10. By accepting these terms, you agree to Adera's privacy policy and service agreement.`}
                </Text>
              </ScrollView>
              <View style={[styles.modalFooter, { backgroundColor: theme.colors.surface }]}>
                <Button
                  title="Accept & Continue"
                  onPress={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  size="lg"
                />
              </View>
            </View>
          </SafeArea>
        </Modal>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepIndicatorWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for fixed footer
  },
  stepContent: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionPrice: {
    fontSize: 12,
  },
  typeList: {
    gap: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  typeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  locationCard: {
    padding: 0,
    overflow: 'hidden',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 14,
  },
  locationAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  locationPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationPlaceholderText: {
    fontSize: 16,
  },
  priceCard: {
    padding: 16,
    marginTop: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  priceNote: {
    fontSize: 12,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  nextButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  termsContent: {
    fontSize: 14,
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  mapToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapPreviewCard: {
    padding: 0,
    marginTop: 16,
    overflow: 'hidden',
  },
  mapPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  mapPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeInfo: {
    padding: 16,
    gap: 8,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeInfoText: {
    fontSize: 14,
  },
  priceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priceDivider: {
    height: 1,
    marginVertical: 12,
  },
  priceBreakdown: {
    gap: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRowLabel: {
    fontSize: 14,
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateParcel;
