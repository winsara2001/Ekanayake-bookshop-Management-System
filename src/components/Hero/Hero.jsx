import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-banner">
      <div className="hero-content">

        <h1 className="hero-title">Books In Store</h1>
        <Link to="/shop" className="btn btn-primary hero-btn">SHOP NOW</Link>
      </div>
      <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&h=400&fit=crop" alt="Books In Store" className="hero-image" />
    </div>
  );
};

export default Hero;
