import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../api/authClient';
import { validateSignupForm } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import FormError from '../components/scaffold/FormError';
import '../styles/auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const response = await authClient.signup(email, password);
      login(email, response.token);
      setSuccess(true);
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
          <button onClick={() => navigate('/')} className="auth-link">
            Go to recipes now
          </button>
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
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <FormError message={errors.email} id="email-error" />}
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
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && <FormError message={errors.password} id="password-error" />}
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
