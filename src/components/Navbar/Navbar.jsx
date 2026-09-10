import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { user, customerProfile, logout } = useAuth();
  const { cartItemCount } = useCart();
  const { wishlistItemCount } = useWishlist();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => { setMenuOpen(false); setDropdownOpen(false); };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const handleCartClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname, message: 'Please log in to view your cart.' } });
    } else {
      navigate('/cart');
      closeMenu();
    }
  };

  const handleWishlistClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname, message: 'Please log in to view your wishlist.' } });
    } else {
      navigate('/wishlist');
      closeMenu();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/shop');
    }
    closeMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Categories', path: '/categories' },
  ];

  return (
    <header className="koparion-header">
      {/* Tier 1: Main Header */}
      <div className="main-bar">
        <div className="container main-bar-inner">
          <Link to="/" className="logo-container" onClick={closeMenu}>
            <span className="logo-text">EKANAYAKE BOOK SHOP</span>
          </Link>

          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <input 
                type="text" 
                placeholder="Search books by title, author, category or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <FiSearch size={20} />
              </button>
            </form>
          </div>

          <div className="user-actions">
            <button className="action-item" onClick={handleWishlistClick} aria-label="Wishlist">
              <FiHeart size={20} className="action-icon" />
              <div className="action-text">
                <span>Wishlist {user && wishlistItemCount > 0 ? `(${wishlistItemCount})` : ''}</span>
              </div>
            </button>
            
            <button className="action-item cart-action" onClick={handleCartClick} aria-label="Cart">
              <FiShoppingCart size={20} className="action-icon" />
              <div className="action-text cart-text">
                <span className="cart-title">Cart {user ? `(${cartItemCount})` : ''}</span>
              </div>
            </button>

            {/* Desktop Auth/Account Controls */}
            <div className="desktop-auth">
              {!user ? (
                <div className="auth-links">
                  <Link to="/login" className="auth-link">Sign In</Link>
                  <span className="auth-divider">|</span>
                  <Link to="/register" className="auth-link">Create Account</Link>
                </div>
              ) : (
                <div className="account-controls">
                  <Link to="/orders" className="auth-link">My Orders</Link>
                  <span className="auth-divider">|</span>
                  <Link to="/account?tab=loyalty" className="auth-link">Loyalty</Link>
                  <span className="auth-divider">|</span>
                  
                  <div className="account-dropdown-wrapper" ref={dropdownRef}>
                    <button 
                      className="account-dropdown-btn" 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      👤 Hi, {customerProfile?.first_name || 'Customer'} <FiChevronDown />
                    </button>
                    {dropdownOpen && (
                      <ul className="account-dropdown-menu">
                        <li><Link to="/account" onClick={closeMenu}>My Profile</Link></li>
                        <li><Link to="/orders" onClick={closeMenu}>My Orders</Link></li>
                        <li><Link to="/account?tab=loyalty" onClick={closeMenu}>Loyalty</Link></li>
                        <li><button onClick={handleLogout} className="logout-btn"><FiLogOut className="logout-icon"/> Logout</button></li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="hamburger-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={toggleMenu}
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Bottom Navigation Bar */}
      <div className="bottom-bar">
        <div className="container bottom-bar-inner">
          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <NavLink 
                key={link.label} 
                to={link.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <nav className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="mobile-nav-link"
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="mobile-nav-divider"></div>

          {!user ? (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>Sign In</Link>
              <Link to="/register" className="mobile-nav-link" onClick={closeMenu}>Create Account</Link>
            </>
          ) : (
            <>
              <Link to="/orders" className="mobile-nav-link" onClick={closeMenu}>My Orders</Link>
              <Link to="/account?tab=loyalty" className="mobile-nav-link" onClick={closeMenu}>Loyalty</Link>
              <Link to="/account" className="mobile-nav-link" onClick={closeMenu}>My Account</Link>
              <button className="mobile-nav-link logout-btn" onClick={handleLogout}>Logout</button>
            </>
          )}
        </nav>
      </div>
      {menuOpen && (
        <div className="mobile-overlay" onClick={closeMenu} aria-hidden="true" />
      )}
    </header>
  );
};

export default Navbar;
