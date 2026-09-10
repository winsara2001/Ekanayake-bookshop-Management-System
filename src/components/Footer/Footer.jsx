import { Link } from 'react-router-dom';
import { FiTwitter, FiFacebook, FiYoutube, FiInstagram } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="koparion-footer">
      <div className="footer-main">
        <div className="container footer-main-inner">
          <div className="footer-col">
            <h4>INFORMATION</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>CUSTOMER AREA</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/account">My Account</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>
          </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>Copyright © 2026 Ekanayake Book Shop. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
