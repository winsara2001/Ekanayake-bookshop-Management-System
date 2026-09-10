import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { validateEmail } from '../../utils/validation';
import '../Login/Login.css'; // Reusing login styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    setIsSubmitting(true);
    try {
      const resetUrl = window.location.origin + '/reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      if (err.status === 429) {
        console.error('Auth email request failed: rate limit exceeded');
        setError('Too many email requests. Please wait a while and try again.');
      } else {
        console.error(err);
        setError('Unable to send the reset email. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              If an account exists for this email address, we've sent a password reset link.
            </p>
          </div>
          <div className="auth-form" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-primary auth-submit-btn" style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>
              Back to Login
            </Link>
            <button 
              onClick={handleSubmit} 
              className="btn btn-outline" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Again'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email address and we'll send you a password reset link.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="form-input-wrapper">
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {validationError && <span className="form-error">{validationError}</span>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
