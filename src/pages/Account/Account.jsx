import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiShoppingBag, 
  FiHeart, 
  FiShoppingCart, 
  FiStar,
  FiLogOut,
  FiEdit2,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { validateName, validatePhone } from '../../utils/validation';
import CustomerLoyalty from './CustomerLoyalty';
import './Account.css';

const Account = () => {
  const { user, customerProfile, logout, updateProfile } = useAuth();
  const { cartItemCount } = useCart();
  const { wishlistItemCount } = useWishlist();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (customerProfile) {
      setFormData({
        firstName: customerProfile.first_name || '',
        lastName: customerProfile.last_name || '',
        phone: customerProfile.phone || ''
      });
    }
  }, [customerProfile]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for field when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Reset to current user data
    setFormData({
      firstName: customerProfile?.first_name || '',
      lastName: customerProfile?.last_name || '',
      phone: customerProfile?.phone || ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newErrors = {};

    const firstNameError = validateName(formData.firstName, 'First Name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, 'Last Name');
    if (lastNameError) newErrors.lastName = lastNameError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = updateProfile({
      ...user,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim()
    });

    if (result.success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!user) return null; // handled by CustomerRoute

  return (
    <main className="account-page">
      <div className="container">
        <div className="account-header">
          <h1 className="account-title">My Account</h1>
          <p className="account-subtitle">Manage your personal information and access your shopping activity.</p>
        </div>

        <div className="account-layout">
          {/* Sidebar Navigation */}
          <aside className="account-sidebar">
            <nav className="account-nav">
              <button 
                className={`account-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiUser className="nav-icon" /> Profile
              </button>
              <Link to="/orders" className="account-nav-link">
                <FiShoppingBag className="nav-icon" /> My Orders
              </Link>
              <Link to="/wishlist" className="account-nav-link">
                <FiHeart className="nav-icon" /> Wishlist
              </Link>
              <Link to="/cart" className="account-nav-link">
                <FiShoppingCart className="nav-icon" /> Cart
              </Link>
              <button 
                className={`account-nav-link ${activeTab === 'loyalty' ? 'active' : ''}`}
                onClick={() => setActiveTab('loyalty')}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiStar className="nav-icon" /> Loyalty Points
              </button>
            </nav>
            <button className="btn-logout-sidebar" onClick={handleLogout}>
              <FiLogOut className="nav-icon" /> Logout
            </button>
          </aside>

          {/* Main Content */}
          <div className="account-content">
            {saveSuccess && (
              <div className="success-banner">
                Profile updated successfully!
              </div>
            )}

            <section className="profile-section">
              {activeTab === 'profile' ? (
                <>
                  <div className="section-header">
                    <h2 className="section-title">Profile Information</h2>
                    {!isEditing && (
                      <button className="btn-edit" onClick={() => setIsEditing(true)}>
                        <FiEdit2 /> Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="profile-card">
                    {!customerProfile ? (
                      <div className="profile-loading" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Loading profile information...
                      </div>
                    ) : !isEditing ? (
                      <div className="profile-view">
                        <div className="profile-row">
                          <div className="profile-label">First Name</div>
                          <div className="profile-value">{customerProfile.first_name || <span className="not-provided">Not provided</span>}</div>
                        </div>
                        <div className="profile-row">
                          <div className="profile-label">Last Name</div>
                          <div className="profile-value">{customerProfile.last_name || <span className="not-provided">Not provided</span>}</div>
                        </div>
                        <div className="profile-row">
                          <div className="profile-label">Email</div>
                          <div className="profile-value">{user.email}</div>
                        </div>
                        <div className="profile-row">
                          <div className="profile-label">Phone Number</div>
                          <div className="profile-value">{customerProfile.phone || <span className="not-provided">Not provided</span>}</div>
                        </div>
                      </div>
                    ) : (
                      <form className="profile-edit-form" onSubmit={handleSave}>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label" htmlFor="firstName">First Name</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                              value={formData.firstName}
                              onChange={handleInputChange}
                            />
                            {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="lastName">Last Name</label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                              value={formData.lastName}
                              onChange={handleInputChange}
                            />
                            {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={user.email}
                            disabled
                            readOnly
                          />
                          <span className="form-hint">Email changes will be supported after real account integration.</span>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="phone">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className={`form-input ${errors.phone ? 'input-error' : ''}`}
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="0771234567"
                          />
                          {errors.phone && <span className="form-error">{errors.phone}</span>}
                        </div>

                        <div className="form-actions">
                          <button type="button" className="btn btn-outline" onClick={handleCancel}>
                            <FiX /> Cancel
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save Changes
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              ) : activeTab === 'loyalty' ? (
                <CustomerLoyalty />
              ) : null}
            </section>

            <section className="quick-links-section">
              <h2 className="section-title">Quick Links</h2>
              <div className="quick-links-grid">
                <Link to="/orders" className="quick-link-card">
                  <div className="quick-link-icon"><FiShoppingBag /></div>
                  <div className="quick-link-content">
                    <h3>My Orders</h3>
                    <p>Track, return, or buy things again</p>
                  </div>
                </Link>
                
                <Link to="/wishlist" className="quick-link-card">
                  <div className="quick-link-icon"><FiHeart /></div>
                  <div className="quick-link-content">
                    <h3>My Wishlist</h3>
                    <p>{wishlistItemCount} {wishlistItemCount === 1 ? 'item' : 'items'} saved</p>
                  </div>
                </Link>

                <Link to="/cart" className="quick-link-card">
                  <div className="quick-link-icon"><FiShoppingCart /></div>
                  <div className="quick-link-content">
                    <h3>Shopping Cart</h3>
                    <p>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart</p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Account;
