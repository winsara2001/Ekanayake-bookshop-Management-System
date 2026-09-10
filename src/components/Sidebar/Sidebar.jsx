import React from 'react';
import Categories from '../Categories/Categories';
import BestSellers from '../BestSellers/BestSellers';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Categories />
      
      <div className="sidebar-banner">
        <div className="placeholder-banner" style={{background: 'linear-gradient(45deg, #0ea5e9, #38bdf8)'}}>
          <h3 style={{fontSize: '1.2rem', marginBottom: '10px'}}>Comics Books</h3>
          <p>&gt;</p>
        </div>
      </div>

      <BestSellers />

      <div className="sidebar-news">
        <h3 className="sidebar-title">LATEST NEWS</h3>
        <div className="news-item">
          <div className="news-date">30<br/><span>Nov</span></div>
          <div className="news-content">
            <h4>Summer House: Guarda</h4>
            <p>We're so excited! Our friend Jude...</p>
          </div>
        </div>
      </div>

      <div className="sidebar-newsletter">
        <h3>SIGN UP FOR SEND NEWSLETTER</h3>
        <p>You can be always up to date with our company news!</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email address here..." />
          <button type="submit" className="btn btn-primary">SUBSCRIBE</button>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;
