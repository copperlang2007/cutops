// Input validation utilities
// Provides consistent validation across the application

/**
 * Validates email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates NPN (National Producer Number) format
 * NPNs are typically 7-10 digit numbers
 * @param {string} npn 
 * @returns {boolean}
 */
export const isValidNPN = (npn) => {
  if (!npn || typeof npn !== 'string') return false;
  const npnRegex = /^\d{7,10}$/;
  return npnRegex.test(npn.trim());
};

/**
 * Validates phone number format (US)
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return true; // Phone is optional
  // Accepts various US phone formats
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates SSN last 4 digits
 * @param {string} ssn 
 * @returns {boolean}
 */
export const isValidSSNLastFour = (ssn) => {
  if (!ssn || typeof ssn !== 'string') return true; // SSN is optional
  const ssnRegex = /^\d{4}$/;
  return ssnRegex.test(ssn.trim());
};

/**
 * Validates ZIP code (US)
 * @param {string} zip 
 * @returns {boolean}
 */
export const isValidZip = (zip) => {
  if (!zip || typeof zip !== 'string') return true; // ZIP is optional
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip.trim());
};

/**
 * Validates date string format (YYYY-MM-DD)
 * @param {string} dateStr 
 * @returns {boolean}
 */
export const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return true; // Date is optional
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

/**
 * Sanitizes string input to prevent XSS
 * @param {string} input 
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validates agent form data
 * @param {object} formData 
 * @returns {{ isValid: boolean, errors: object }}
 */
export const validateAgentForm = (formData) => {
  const errors = {};

  if (!formData.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!formData.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.npn?.trim()) {
    errors.npn = 'NPN is required';
  } else if (!isValidNPN(formData.npn)) {
    errors.npn = 'NPN must be 7-10 digits';
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (formData.ssn_last_four && !isValidSSNLastFour(formData.ssn_last_four)) {
    errors.ssn_last_four = 'Must be exactly 4 digits';
  }

  if (formData.zip && !isValidZip(formData.zip)) {
    errors.zip = 'Please enter a valid ZIP code';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates file upload
 * @param {File} file 
 * @param {object} config 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateFileUpload = (file, config = {}) => {
  const maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
  const acceptedTypes = config.acceptedMimeTypes || [
    'application/pdf',
    'image/png',
    'image/jpeg'
  ];

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (!acceptedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not supported' };
  }

  return { isValid: true, error: null };
};