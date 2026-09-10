import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';
  const message = location.state?.message || '';

  const validate = () => {
    const errors = {};
    
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    if (!password) {
      errors.password = 'Password is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    const result = await login(email, password);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      if (result.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (result.role === 'inventory_manager') {
        navigate('/inventory/dashboard', { replace: true });
      } else if (result.role === 'sales_manager') {
        navigate('/sales/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container split-layout">
        <div className="auth-left">
          <div className="auth-brand" style={{marginBottom: '2rem'}}>
            <span className="logo-name" style={{fontSize: '1.2rem'}}>Your logo</span>
          </div>

          <div className="auth-header" style={{textAlign: 'left', marginBottom: '1.5rem'}}>
            <h1 className="auth-title" style={{fontSize: '1.5rem', textAlign: 'left'}}>Login</h1>
          </div>

          {message && <div className="auth-message">{message}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group" style={{marginBottom: '0.5rem'}}>
              <label className="form-label" style={{fontSize: '0.75rem'}}>Email</label>
              <div className="form-input-wrapper">
                <input
                  id="loginEmail"
                  name="loginEmail"
                  type="email"
                  autoComplete="username"
                  className="form-input"
                  placeholder="username@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {validationErrors.email && <span className="form-error">{validationErrors.email}</span>}
            </div>

            <div className="form-group" style={{marginBottom: '0.5rem'}}>
              <label className="form-label" style={{fontSize: '0.75rem'}}>Password</label>
              <div className="form-input-wrapper">
                <input
                  id="loginPassword"
                  name="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="Password"
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

            <div className="auth-options" style={{justifyContent: 'flex-start', marginTop: '0'}}>
              <Link to="/forgot-password" className="forgot-password" style={{fontSize: '0.75rem', fontWeight: '400'}}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn auth-submit-btn" style={{marginTop: '1.5rem'}}>
              Sign in
            </button>
          </form>

          <div className="social-login-text" style={{fontSize: '0.75rem', marginTop: '1.5rem', marginBottom: '1rem'}}>or continue with</div>
          <div className="social-login">
            <button type="button" className="social-btn" aria-label="Sign in with Google">
              <svg stroke="currentColor" fill="#DB4437" stroke-width="0" viewBox="0 0 488 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            </button>
          </div>

          <div className="auth-footer" style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.7rem'}}>
            Don't have an account yet? <Link to="/register" style={{fontWeight: 'bold', color: '#fff', textDecoration: 'none'}}>Register for free</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
