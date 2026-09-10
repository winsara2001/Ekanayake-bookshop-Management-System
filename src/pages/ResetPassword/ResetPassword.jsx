import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { validatePassword } from '../../utils/validation';
import '../Login/Login.css'; // Reusing login styles

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);
  
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for error in hash or query string indicating invalid link
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);
    
    if (hashParams.get('error') || queryParams.get('error') || hashParams.get('error_description') || queryParams.get('error_description')) {
      setIsLinkInvalid(true);
      setIsReady(true);
      return;
    }

    // Wait for Supabase to process the recovery token and establish session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If we don't have a session immediately, wait a short bit for onAuthStateChange to fire,
        // or just assume invalid if it doesn't resolve shortly.
        // But since Supabase processes the hash synchronously on load often, we might just need to rely on the listener.
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
      }
    });
    
    // Fallback: If no event fires but there's a session, we're ready. 
    // If neither, maybe they just navigated here manually. We'll show the form anyway,
    // and let updateUser fail if they don't have a valid session.
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, [location]);

  const validate = () => {
    const errors = {};
    
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Password updated successfully. Sign out the user so they can log in normally.
      await supabase.auth.signOut();
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Unable to update your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <main className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Verifying reset link...</p>
        </div>
      </main>
    );
  }

  if (isLinkInvalid) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Reset Link Invalid or Expired</h1>
            <p className="auth-subtitle">
              Please request a new password reset link.
            </p>
          </div>
          <div className="auth-form" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/forgot-password" className="btn btn-primary auth-submit-btn" style={{ textDecoration: 'none', display: 'block' }}>
              Request New Link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Password Updated Successfully</h1>
            <p className="auth-subtitle">
              Your password has been changed. You can now log in using your new password.
            </p>
          </div>
          <div className="auth-form" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-primary auth-submit-btn" style={{ textDecoration: 'none', display: 'block' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">Enter your new secure password below.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {validationErrors.password && <span className="form-error">{validationErrors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="form-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {validationErrors.confirmPassword && <span className="form-error">{validationErrors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
