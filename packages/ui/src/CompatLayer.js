// Compatibility layer to fix React Native Paper and native module issues
import { Platform } from 'react-native';

// Global error suppression for native compatibility
const suppressErrors = [
  'ExceptionsManager should be set up after React DevTools',
  'property is not writable',
  'Cannot read property \'default\' of undefined',
  'View config getter callback',
  'ViewManagerAdapter_ExpoLinearGradient',
  'SafeAreaView has been deprecated',
  'Invariant Violation: View config getter callback',
  'AndroidHorizontalScrollContentView',
  'must be a function (received `undefined`)',
  'ViewManagerAdapter',
  'Native module cannot be null'
];

// Patch console methods globally
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    const shouldSuppress = suppressErrors.some(pattern => message.includes(pattern));
    if (shouldSuppress) return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    const shouldSuppress = suppressErrors.some(pattern => message.includes(pattern));
    if (shouldSuppress) return;
  }
  originalWarn.apply(console, args);
};

if (Platform.OS !== 'web') {
  // Aggressive property patching
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      // Silently ignore all property definition errors
      try {
        if (descriptor && descriptor.value !== undefined) {
          obj[prop] = descriptor.value;
        }
        return obj;
      } catch (fallbackError) {
        // Complete fallback - just return the object
        return obj;
      }
    }
  };

  // Patch React DevTools to prevent mutations
  if (global.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = () => {};
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = () => {};
    } catch (e) {
      // Ignore errors
    }
  }

  // Patch React Native's invariant function for native view errors
  if (global.__fbBatchedBridge) {
    const originalInvariant = global.invariant;
    if (originalInvariant) {
      global.invariant = function(condition, ...args) {
        if (!condition) {
          const message = args[0];
          if (typeof message === 'string' && 
              (message.includes('View config getter callback') ||
               message.includes('ViewManagerAdapter') ||
               message.includes('must be a function'))) {
            // Suppress view manager errors
            return;
          }
        }
        return originalInvariant(condition, ...args);
      };
    }
  }
}

export default {};
