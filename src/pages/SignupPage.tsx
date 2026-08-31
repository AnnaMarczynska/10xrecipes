import { useState } from 'react';
import { authClient } from '../api/authClient';
import { validateSignupForm } from '../utils/validation';
import FormError from '../components/FormError';
import '../styles/auth.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors({ ...errors, email: '' });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors({ ...errors, password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setErrors({ email: '', password: '' });

    const validation = validateSignupForm(email, password);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await authClient.signup(email, password);
      setSuccess(true);
      setEmail('');
      setPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';

      if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already')) {
        setErrors({ email: 'Email already registered', password: '' });
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Account Created!</h1>
          <p className="success-message">You are logged in. Welcome to 10xRecipes!</p>
          <a href="/" className="auth-link">
            Go to recipes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign Up</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          {serverError && (
            <div className="form-server-error" role="alert">
              {serverError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              className={errors.email ? 'input-error' : ''}
              disabled={loading}
            />
            <FormError message={errors.email} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="At least 6 characters"
              className={errors.password ? 'input-error' : ''}
              disabled={loading}
            />
            <FormError message={errors.password} />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
}
