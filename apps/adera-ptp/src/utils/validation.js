/**
 * Validation utilities for form inputs
 */

// Ethiopian phone number validation
export const validateEthiopianPhone = (phone) => {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  
  // Remove spaces, dashes, and plus signs
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Check if it's a valid Ethiopian mobile number
  // Ethiopian mobile numbers: 09XXXXXXXX or 9XXXXXXXX (10 digits starting with 9)
  // Or with country code: 2519XXXXXXXX (12 digits starting with 2519)
  const mobilePattern = /^(09|9|2519)\d{8}$/;
  
  if (!mobilePattern.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Please enter a valid Ethiopian mobile number (e.g., 0912345678)' 
    };
  }
  
  return { valid: true, error: null };
};

// Format Ethiopian phone number for display
export const formatEthiopianPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // If starts with 2519, remove 251
  if (cleaned.startsWith('2519')) {
    return `0${cleaned.slice(3)}`;
  }
  
  // If starts with 9, add 0
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return `0${cleaned}`;
  }
  
  return cleaned;
};

// Validate name
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  return { valid: true, error: null };
};

// Validate required field
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, error: null };
};

