import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeArea, Card, TextInput, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const CreateParcel = ({ navigation }) => {
  const theme = useTheme();
  
  // Form state
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [packageType, setPackageType] = useState('');
  const [description, setDescription] = useState('');
  const [dropoffPartner, setDropoffPartner] = useState(null);
  const [pickupPartner, setPickupPartner] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  
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

  const mockPartners = [
    { id: '1', name: 'Bole Mini Market', distance: 1.2, address: 'Bole, Addis Ababa' },
    { id: '2', name: 'Piassa Shop', distance: 2.5, address: 'Piassa, Addis Ababa' },
    { id: '3', name: 'Mexico Square Store', distance: 3.1, address: 'Mexico, Addis Ababa' },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [packageSize, dropoffPartner, pickupPartner]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  const calculatePrice = () => {
    if (!packageSize || !dropoffPartner || !pickupPartner) {
      setEstimatedPrice(0);
      return;
    }

    const sizeData = packageSizes.find(s => s.id === packageSize);
    const basePrice = sizeData?.basePrice || 0;
    const distance = (dropoffPartner.distance + pickupPartner.distance) / 2;
    const distancePrice = distance * 20;
    
    setEstimatedPrice(basePrice + distancePrice);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!recipientName.trim() || !recipientPhone.trim()) {
        Alert.alert('Required', 'Please fill recipient details');
        return;
      }
      if (recipientPhone.length < 10) {
        Alert.alert('Invalid', 'Please enter a valid phone number');
        return;
      }
    } else if (step === 2) {
      if (!packageSize || !packageType) {
        Alert.alert('Required', 'Please select package size and type');
        return;
      }
    } else if (step === 3) {
      if (!dropoffPartner || !pickupPartner) {
        Alert.alert('Required', 'Please select dropoff and pickup locations');
        return;
      }
    } else if (step === 4) {
      if (!paymentMethod) {
        Alert.alert('Required', 'Please select a payment method');
        return;
      }
      if (!termsAccepted) {
        Alert.alert('Required', 'Please accept terms and conditions');
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Submit to Supabase
    Alert.alert(
      'Parcel Created!',
      `Your parcel has been created. Tracking ID: ADE${Date.now().toString().slice(-8)}`,
      [
        {
          text: 'View Details',
          onPress: () => navigation?.navigate?.('track'),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  };

  const renderStepIndicator = () => (
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
            <Text
              style={[
                styles.stepNumber,
                { color: s <= step ? '#FFF' : theme.colors.text.secondary },
              ]}
            >
              {s}
            </Text>
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
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Recipient Details
      </Text>
      
      <TextInput
        label="Recipient Name"
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder="Enter recipient's full name"
        autoCapitalize="words"
        leftIcon="account"
      />
      
      <TextInput
        label="Phone Number"
        value={recipientPhone}
        onChangeText={setRecipientPhone}
        placeholder="+251 9XX XXX XXX"
        keyboardType="phone-pad"
        leftIcon="phone"
      />
      
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
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
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
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Select Locations
      </Text>
      
      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
        Drop-off Partner
      </Text>
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => {
            // TODO: Open map modal
            setDropoffPartner(mockPartners[0]);
          }}
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
                  {dropoffPartner.distance} km away
                </Text>
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
                Select drop-off location
              </Text>
            </View>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </Card>

      <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Pick-up Partner
      </Text>
      <Card style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => {
            // TODO: Open map modal
            setPickupPartner(mockPartners[1]);
          }}
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
                  {pickupPartner.distance} km away
                </Text>
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
                Select pick-up location
              </Text>
            </View>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </Card>

      {estimatedPrice > 0 && (
        <Card style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.priceHeader}>
            <Text style={[styles.priceLabel, { color: theme.colors.primary }]}>
              Estimated Price
            </Text>
            <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
              {estimatedPrice.toFixed(2)} ETB
            </Text>
          </View>
          <Text style={[styles.priceNote, { color: theme.colors.text.secondary }]}>
            Final price may vary based on actual weight and dimensions
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
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <Button
            title={step < 4 ? 'Next' : 'Create Parcel'}
            onPress={handleNext}
            size="lg"
            style={styles.nextButton}
          />
        </View>

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
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
});

export default CreateParcel;
