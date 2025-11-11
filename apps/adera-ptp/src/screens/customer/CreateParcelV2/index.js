import React, { useState, useMemo } from 'react';
import useDraft from '../../../hooks/useDraft';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import PagerView from '../../../components/PlatformPagerView';
import { useTheme, SafeArea, Button, SegmentedButtons } from '@adera/ui';

// Step components (placeholders for now)
import RecipientStep from './steps/RecipientStep';
import PackageStep from './steps/PackageStep';
import LocationStep from './steps/LocationStep';
import ReviewStep from './steps/ReviewStep';

const steps = [
  { key: 'recipient', icon: 'account', label: 'Recipient' },
  { key: 'package', icon: 'package-variant', label: 'Package' },
  { key: 'locations', icon: 'map-marker', label: 'Locations' },
  { key: 'review', icon: 'clipboard-check', label: 'Review' },
];

const CreateParcelV2 = ({ navigation }) => {
  const { draft, updateDraft, loaded } = useDraft({
    recipientName: '',
    recipientPhone: '',
    description: '',
  });
  const theme = useTheme();

  const stepValid = useMemo(() => {
    if (!loaded) return false;
    switch (currentStep) {
      case 0:
        return draft.recipientName.trim() && draft.recipientPhone.trim().length >= 7;
      case 1:
        return draft.packageSize && draft.weight;
      case 2:
        return draft.dropoffPartner && draft.pickupPartner;
      case 3:
        return draft.termsAccepted;
      default:
        return true;
    }
  }, [currentStep, draft, loaded]);
  const [currentStep, setCurrentStep] = useState(0);
  const pagerRef = React.useRef(null);

  const handleChangeStep = (index) => {
    setCurrentStep(index);
    pagerRef.current?.setPage?.(index);
  };

  const renderStep = (index) => {
    switch (index) {
      case 0:
        return (
          <RecipientStep
            values={draft}
            onChange={updateDraft}
          />
        );
      case 1:
        return (
          <PackageStep
            values={draft}
            onChange={updateDraft}
          />
        );
      case 2:
        return (
          <LocationStep
            values={draft}
            onChange={updateDraft}
          />
        );
      case 3:
        return (
          <ReviewStep
            values={draft}
            onChange={updateDraft}
            onSubmit={() => {
              console.log('Parcel created!', draft);
              // TODO: call Supabase insert
              navigation.navigate('history');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Step Navigation */}
        <SegmentedButtons
          value={String(currentStep)}
          onValueChange={(val) => handleChangeStep(Number(val))}
          buttons={steps.map((s, idx) => ({
            value: String(idx),
            label: s.label,
            icon: s.icon,
          }))}
          style={styles.segmented}
        />

        {/* Content */}
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          scrollEnabled={false}
          onPageSelected={(e) => setCurrentStep(e.nativeEvent.position)}
        >
          {steps.map((_, idx) => (
            <View key={idx.toString()} style={styles.pageContainer}>
              {renderStep(idx)}
            </View>
          ))}
        </PagerView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={currentStep < 3 ? 'Next' : 'Create Parcel'}
            mode="contained"
            onPress={() => handleChangeStep(Math.min(currentStep + 1, 3))}
            disabled={!stepValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  segmented: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default CreateParcelV2;
