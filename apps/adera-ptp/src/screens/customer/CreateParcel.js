import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { 
  AppBar, 
  Card, 
  TextInput, 
  Button, 
  useTheme 
} from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const CreateParcel = ({ navigation }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    pickupAddress: '',
    deliveryAddress: '',
    description: '',
    weight: '',
    declaredValue: '',
    paymentMethod: 'telebirr',
    urgentDelivery: false,
    fragileItem: false,
    pickupInstructions: '',
    deliveryInstructions: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Recipient Info
        if (!formData.recipientName.trim()) {
          newErrors.recipientName = 'Recipient name is required';
        }
        if (!formData.recipientPhone.trim()) {
          newErrors.recipientPhone = 'Recipient phone is required';
        } else if (!/^\+251[0-9]{9}$/.test(formData.recipientPhone)) {
          newErrors.recipientPhone = 'Enter valid Ethiopian phone number (+251xxxxxxxxx)';
        }
        break;
        
      case 2: // Addresses
        if (!formData.pickupAddress.trim()) {
          newErrors.pickupAddress = 'Pickup address is required';
        }
        if (!formData.deliveryAddress.trim()) {
          newErrors.deliveryAddress = 'Delivery address is required';
        }
        break;
        
      case 3: // Parcel Details
        if (!formData.description.trim()) {
          newErrors.description = 'Parcel description is required';
        }
        if (!formData.weight || parseFloat(formData.weight) <= 0) {
          newErrors.weight = 'Valid weight is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Calculate delivery fee based on weight and distance
      const deliveryFee = calculateDeliveryFee();
      
      // TODO: Create parcel via Supabase
      console.log('Creating parcel:', { ...formData, deliveryFee });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Parcel Created!',
        `Your parcel has been created. Delivery fee: ${deliveryFee} ETB. Please proceed to payment.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to payment or tracking
              navigation?.navigate?.('track') || console.log('Navigate to tracking');
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create parcel. Please try again.');
      console.error('Create parcel error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeliveryFee = () => {
    const baseRate = 50; // ETB
    const weightRate = parseFloat(formData.weight) * 10; // 10 ETB per kg
    const urgentFee = formData.urgentDelivery ? 25 : 0;
    return baseRate + weightRate + urgentFee;
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderRecipientInfo();
      case 2:
        return renderAddresses();
      case 3:
        return renderParcelDetails();
      case 4:
        return renderReview();
      default:
        return renderRecipientInfo();
    }
  };

  const renderRecipientInfo = () => (
    <Card style={styles.stepCard}>
      <Text variant="titleLarge" style={styles.stepTitle}>
        Recipient Information
      </Text>
      
      <TextInput
        label="Recipient Name"
        value={formData.recipientName}
        onChangeText={(value) => updateFormData('recipientName', value)}
        error={errors.recipientName}
        required
        style={styles.input}
      />
      
      <TextInput
        label="Recipient Phone"
        value={formData.recipientPhone}
        onChangeText={(value) => updateFormData('recipientPhone', value)}
        error={errors.recipientPhone}
        placeholder="+251911234567"
        keyboardType="phone-pad"
        required
        style={styles.input}
      />
    </Card>
  );

  const renderAddresses = () => (
    <Card style={styles.stepCard}>
      <Text variant="titleLarge" style={styles.stepTitle}>
        Pickup & Delivery Addresses
      </Text>
      
      <View style={styles.addressSection}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.addressTitle}>Pickup Address</Text>
        </View>
        <TextInput
          label="Where should we pick up the parcel?"
          value={formData.pickupAddress}
          onChangeText={(value) => updateFormData('pickupAddress', value)}
          error={errors.pickupAddress}
          multiline
          required
          style={styles.input}
        />
        <TextInput
          label="Pickup Instructions (Optional)"
          value={formData.pickupInstructions}
          onChangeText={(value) => updateFormData('pickupInstructions', value)}
          multiline
          style={styles.input}
        />
      </View>

      <View style={styles.addressSection}>
        <View style={styles.addressHeader}>
          <Ionicons name="flag-outline" size={20} color={theme.colors.secondary} />
          <Text variant="titleMedium" style={styles.addressTitle}>Delivery Address</Text>
        </View>
        <TextInput
          label="Where should we deliver the parcel?"
          value={formData.deliveryAddress}
          onChangeText={(value) => updateFormData('deliveryAddress', value)}
          error={errors.deliveryAddress}
          multiline
          required
          style={styles.input}
        />
        <TextInput
          label="Delivery Instructions (Optional)"
          value={formData.deliveryInstructions}
          onChangeText={(value) => updateFormData('deliveryInstructions', value)}
          multiline
          style={styles.input}
        />
      </View>
    </Card>
  );

  const renderParcelDetails = () => (
    <Card style={styles.stepCard}>
      <Text variant="titleLarge" style={styles.stepTitle}>
        Parcel Details
      </Text>
      
      <TextInput
        label="What are you sending?"
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        error={errors.description}
        multiline
        required
        style={styles.input}
      />
      
      <View style={styles.row}>
        <TextInput
          label="Weight (kg)"
          value={formData.weight}
          onChangeText={(value) => updateFormData('weight', value)}
          error={errors.weight}
          keyboardType="decimal-pad"
          required
          style={[styles.input, styles.halfWidth]}
        />
        
        <TextInput
          label="Declared Value (ETB)"
          value={formData.declaredValue}
          onChangeText={(value) => updateFormData('declaredValue', value)}
          keyboardType="decimal-pad"
          helperText="For insurance purposes"
          style={[styles.input, styles.halfWidth]}
        />
      </View>
      
      <View style={styles.checkboxSection}>
        <Text variant="titleMedium" style={styles.checkboxTitle}>Special Handling</Text>
        
        <View style={styles.checkbox}>
          <Text>🚨 Urgent Delivery (+25 ETB)</Text>
        </View>
        
        <View style={styles.checkbox}>
          <Text>📦 Fragile Item</Text>
        </View>
      </View>
    </Card>
  );

  const renderReview = () => {
    const deliveryFee = calculateDeliveryFee();
    
    return (
      <Card style={styles.stepCard}>
        <Text variant="titleLarge" style={styles.stepTitle}>
          Review & Confirm
        </Text>
        
        <View style={styles.reviewSection}>
          <Text variant="titleMedium" style={styles.reviewTitle}>Recipient</Text>
          <Text>{formData.recipientName}</Text>
          <Text>{formData.recipientPhone}</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text variant="titleMedium" style={styles.reviewTitle}>Route</Text>
          <Text>📍 From: {formData.pickupAddress}</Text>
          <Text>🏁 To: {formData.deliveryAddress}</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text variant="titleMedium" style={styles.reviewTitle}>Parcel</Text>
          <Text>{formData.description}</Text>
          <Text>Weight: {formData.weight} kg</Text>
          {formData.declaredValue && <Text>Value: {formData.declaredValue} ETB</Text>}
        </View>
        
        <View style={styles.reviewSection}>
          <Text variant="titleMedium" style={styles.reviewTitle}>Delivery Fee</Text>
          <Text variant="headlineSmall" style={[styles.fee, { color: theme.colors.primary }]}>
            {deliveryFee} ETB
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Send Parcel"
        onBack={currentStep > 1 ? handleBack : () => navigation?.goBack?.()}
      />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(currentStep / totalSteps) * 100}%`,
                backgroundColor: theme.colors.primary 
              }
            ]} 
          />
        </View>
        <Text variant="bodySmall" style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        {renderStep()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          style={styles.nextButton}
        >
          {currentStep === totalSteps ? 'Create Parcel' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepCard: {
    padding: 20,
    marginBottom: 16,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  addressSection: {
    marginBottom: 24,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  addressTitle: {
    fontWeight: '500',
  },
  checkboxSection: {
    marginTop: 16,
  },
  checkboxTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  checkbox: {
    paddingVertical: 8,
  },
  reviewSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reviewTitle: {
    fontWeight: '500',
    marginBottom: 8,
  },
  fee: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  nextButton: {
    paddingVertical: 8,
  },
});

export default CreateParcel;
