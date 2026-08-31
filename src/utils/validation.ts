export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FormErrors {
  email: string;
  password: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be no more than 128 characters' };
  }
  return { valid: true };
};

export const validateSignupForm = (
  email: string,
  password: string
): { valid: boolean; errors: FormErrors } => {
  const errors: FormErrors = { email: '', password: '' };

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || '';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error || '';
  }

  return {
    valid: errors.email === '' && errors.password === '',
    errors,
  };
};

export const validateLoginForm = (
  email: string,
  password: string
): { valid: boolean; errors: FormErrors } => {
  const errors: FormErrors = { email: '', password: '' };

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error || '';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error || '';
  }

  return {
    valid: errors.email === '' && errors.password === '',
    errors,
  };
};
