/**
 * Frontend validation utility functions.
 * 
 * IMPORTANT: Frontend validation improves user experience. 
 * Critical validation and business rules will also be enforced later 
 * through the backend and Supabase database.
 */

export const sanitizeName = (value) => {
  return value.replace(/[^A-Za-z\s-]/g, '');
};

export const sanitizePhone = (value) => {
  // Return only digits, up to 10 characters max
  return value.replace(/[^\d]/g, '').slice(0, 10);
};

export const validateRequired = (value) => {
  if (value === null || value === undefined) return 'This field is required.';
  if (typeof value === 'string' && value.trim() === '') return 'This field is required.';
  return null; // Valid
};

export const validateName = (name, fieldName = 'Name') => {
  if (!name || name.trim() === '') return `${fieldName} is required.`;
  
  const trimmed = name.trim();
  if (trimmed.length < 2) return `${fieldName} must be at least 2 characters.`;
  if (trimmed.length > 50) return `${fieldName} cannot exceed 50 characters.`;

  // Allow letters, spaces, and hyphens
  const nameRegex = /^[A-Za-z\s-]+$/;
  if (!nameRegex.test(trimmed)) {
    return `${fieldName} can contain letters only.`;
  }
  
  return null;
};

export const validateTitle = (title, fieldName = 'Title') => {
  if (!title || title.trim() === '') return `${fieldName} is required.`;
  
  const trimmed = title.trim();
  if (trimmed.length < 2) return `${fieldName} must be at least 2 characters.`;
  if (trimmed.length > 200) return `${fieldName} cannot exceed 200 characters.`;
  
  return null;
};

export const validateEmail = (email) => {
  if (!email || email.trim() === '') return 'Email address is required.';
  
  const trimmed = email.trim().toLowerCase();
  // Basic robust email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Phone number is required.';
  
  const trimmed = phone.trim();
  // Sri Lankan phone number format: exactly 10 digits starting with 0
  const phoneRegex = /^0\d{9}$/;
  
  if (!/^\d{10}$/.test(trimmed)) {
    return 'Phone number must contain exactly 10 digits.';
  }

  if (!trimmed.startsWith('0')) {
    return 'Phone number must start with 0.';
  }
  
  if (!phoneRegex.test(trimmed)) {
    return 'Please enter a valid phone number.';
  }
  
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  
  if (password.length < 8) return 'Password must contain at least 8 characters.';
  
  // At least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return 'Password must include an uppercase letter, lowercase letter and number.';
  }
  
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
};

export const validatePositiveNumber = (value, allowZero = true) => {
  const num = Number(value);
  if (isNaN(num)) return 'Must be a valid number.';
  if (allowZero && num < 0) return 'Cannot be negative.';
  if (!allowZero && num <= 0) return 'Must be greater than zero.';
  return null;
};

export const validateInteger = (value, fieldName = 'Quantity') => {
  if (value === null || value === undefined || value === '') return `${fieldName} is required.`;
  const num = Number(value);
  if (!Number.isInteger(num)) return `${fieldName} must be a whole number.`;
  return null;
};

export const validateISBN = (isbn) => {
  if (!isbn || isbn.trim() === '') return 'ISBN is required.';
  
  const cleaned = isbn.replace(/[-\s]/g, '');
  if (cleaned.length !== 10 && cleaned.length !== 13) {
    return 'ISBN must be 10 or 13 digits.';
  }
  
  const isbnRegex = /^[0-9xX]+$/;
  if (!isbnRegex.test(cleaned)) {
    return 'Invalid ISBN format.';
  }
  
  return null;
};

// --- Mock Card Validation for Demo Purposes ---

export const validateCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.trim() === '') return 'Card number is required.';
  const cleaned = cardNumber.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(cleaned)) return 'Card number must be exactly 16 digits.';
  return null;
};

export const validateExpiryDate = (expiry) => {
  if (!expiry || expiry.trim() === '') return 'Expiry date is required.';
  // Basic MM/YY format validation
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.trim())) {
    return 'Expiry date must be in MM/YY format.';
  }
  return null;
};

export const validateCVV = (cvv) => {
  if (!cvv || cvv.trim() === '') return 'CVV is required.';
  if (!/^\d{3}$/.test(cvv.trim())) {
    return 'CVV must be exactly 3 digits.';
  }
  return null;
};
