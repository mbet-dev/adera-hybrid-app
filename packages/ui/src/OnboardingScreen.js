import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from './Button';
import { useTheme } from './ThemeProvider';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete }) => {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: 'Welcome to Adera',
      subtitle: 'Your all-in-one ecosystem for logistics and e-commerce in Addis Ababa',
      description: 'Connect, deliver, and shop seamlessly with Ethiopia\'s premier hybrid platform.',
      image: '🏢', // Placeholder for market illustration
    },
    {
      title: 'Send & Track Parcels',
      subtitle: 'Adera-PTP Logistics',
      description: 'Create delivery orders, track parcels in real-time, and ensure secure handovers with QR codes.',
      image: '📦',
    },
    {
      title: 'Discover Local Shops',
      subtitle: 'Adera-Shop Marketplace',
      description: 'Browse partner stores, discover local products, and enjoy seamless shopping experiences.',
      image: '🛍️',
    },
    {
      title: 'Ready to Start?',
      subtitle: 'Choose Your Journey',
      description: 'Log in to access full features or continue as a guest to explore our platform.',
      image: '🚀',
    },
  ];
  
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };
  
  const handleSkip = () => {
    onComplete();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentSlide(slideIndex);
          }}
          style={styles.scrollView}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.content}>
                <View style={styles.imageContainer}>
                  <Text style={styles.emoji}>{slide.image}</Text>
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: theme.colors.white }]}>
                    {slide.title}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.colors.white }]}>
                    {slide.subtitle}
                  </Text>
                  <Text style={[styles.description, { color: theme.colors.white }]}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === currentSlide 
                      ? theme.colors.white 
                      : theme.colors.white + '40'
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={styles.buttonContainer}>
            {currentSlide < slides.length - 1 ? (
              <>
                <Button
                  title="Skip"
                  variant="ghost"
                  onPress={handleSkip}
                  style={[styles.button, { borderColor: theme.colors.white }]}
                  textStyle={{ color: theme.colors.white }}
                />
                <Button
                  title="Next"
                  variant="outline"
                  onPress={handleNext}
                  style={[styles.button, { borderColor: theme.colors.white }]}
                  textStyle={{ color: theme.colors.white }}
                />
              </>
            ) : (
              <Button
                title="Get Started"
                variant="outline"
                onPress={handleNext}
                style={[styles.button, { borderColor: theme.colors.white }]}
                textStyle={{ color: theme.colors.white }}
              />
            )}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default OnboardingScreen;
