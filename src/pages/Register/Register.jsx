import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validateConfirmPassword,
  sanitizeName,
  sanitizePhone
} from '../../utils/validation';
import '../Login/Login.css'; // Reusing auth styles

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Map register fields back to standard keys
    const stateKey = name.startsWith('register') 
      ? name.charAt(8).toLowerCase() + name.slice(9) 
      : name;
    
    let processedValue = value;
    if (stateKey === 'firstName' || stateKey === 'lastName') {
      processedValue = sanitizeName(value);
    } else if (stateKey === 'phone') {
      processedValue = sanitizePhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [stateKey]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const validate = () => {
    const errors = {};
    
    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'Please accept the terms and conditions.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    try {
      const result = await register(formData);
      if (result.success) {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          agreeTerms: false
        });
        // If session is null, email confirmation is required
        if (result.data?.session === null) {
          setVerificationSent(true);
        } else {
          // If somehow logged in immediately
          navigate(from, { replace: true });
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (verificationSent) {
    return (
      <main className="auth-page">
        <div className="auth-container register-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 className="auth-title" style={{ marginBottom: '1rem' }}>Check Your Email</h1>
          <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>
            We sent a verification link to <strong>{formData.email}</strong>.<br/>
            Please verify your email before logging in.
          </p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Join Ekanayake Book Shop and enjoy a better shopping experience.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="registerFirstName">First Name</label>
              <div className="form-input-wrapper">
                <input
                  id="registerFirstName"
                  name="registerFirstName"
                  type="text"
                  autoComplete="given-name"
                  className={`form-input ${validationErrors.firstName ? 'input-error' : ''}`}
                  placeholder="Nimal"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.firstName && <span className="form-error">{validationErrors.firstName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerLastName">Last Name</label>
              <div className="form-input-wrapper">
                <input
                  id="registerLastName"
                  name="registerLastName"
                  type="text"
                  autoComplete="family-name"
                  className={`form-input ${validationErrors.lastName ? 'input-error' : ''}`}
                  placeholder="Perera"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.lastName && <span className="form-error">{validationErrors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="registerEmail">Email Address</label>
              <div className="form-input-wrapper">
                <input
                  id="registerEmail"
                  name="registerEmail"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.email && <span className="form-error">{validationErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerPhone">Phone Number</label>
              <div className="form-input-wrapper">
                <input
                  id="registerPhone"
                  name="registerPhone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
                  placeholder="0771234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.phone && <span className="form-error">{validationErrors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="registerPassword">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="registerPassword"
                  name="registerPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {validationErrors.password && <span className="form-error">{validationErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerConfirmPassword">Confirm Password</label>
              <div className="form-input-wrapper">
                <input
                  id="registerConfirmPassword"
                  name="registerConfirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {validationErrors.confirmPassword && <span className="form-error">{validationErrors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="remember-me terms-checkbox">
              <input 
                type="checkbox" 
                name="registerAgreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              <span>I agree to the Terms and Conditions and Privacy Policy</span>
            </label>
            {validationErrors.agreeTerms && <span className="form-error">{validationErrors.agreeTerms}</span>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Create Account
          </button>
        </form>

        <div className="auth-footer" style={{marginTop: '0'}}>
          Already have an account? 
          <Link to="/login" className="auth-link">Login</Link>
        </div>

        <div className="social-login-text">or sign up with</div>
        <div className="social-login" style={{marginTop: '1rem'}}>
          <button type="button" className="social-btn" aria-label="Sign up with Facebook">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 320 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
          </button>
          <button type="button" className="social-btn" aria-label="Sign up with Google">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 488 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Register;
