import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../api/authClient';
import { validateLoginForm } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import FormError from '../components/scaffold/FormError';
import '../styles/auth.css';

export default function LoginPage() {
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

    const validation = validateLoginForm(email, password);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const response = await authClient.login(email, password);
      login(email, response.token);
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';

      if (message.toLowerCase().includes('not found')) {
        setErrors({ email: 'User not found', password: '' });
      } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('wrong')) {
        setErrors({ email: '', password: 'Wrong password' });
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
          <h1>Welcome Back!</h1>
          <p className="success-message">You are logged in.</p>
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
        <h1>Log In</h1>
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
              placeholder="Enter your password"
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
}
