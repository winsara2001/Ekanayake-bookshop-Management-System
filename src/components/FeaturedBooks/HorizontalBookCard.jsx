import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const HorizontalBookCard = ({ book }) => {
  const {
    id,
    title,
    author: rawAuthor,
    price,
    cover,
    rating,
    stock,
    description
  } = book;

  const author = rawAuthor?.name || rawAuthor;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const formattedPrice = `Rs. ${price.toLocaleString()}`;
  const inStock = stock > 0;

  const handleCartClick = () => {
    if (!user) {
      navigate('/login', { 
        state: { message: 'Please log in to add books to your cart.', from: location.pathname } 
      });
      return;
    }
    if (inStock) {
      addToCart(book, 1);
    }
  };

  return (
    <article className="horizontal-card">
      <div className="hc-cover-wrapper">
        <Link to={`/books/${id}`}>
          <img
            src={cover}
            alt={`Cover of ${title} by ${author}`}
            className="hc-cover"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="hc-info">
        <Link to={`/books/${id}`} style={{ textDecoration: 'none' }}>
          <h3 className="hc-title" title={title}>{title}</h3>
        </Link>
        <p className="hc-author">By {author}</p>
        
        <p className="hc-desc">
          {description || "A wonderful addition to your reading collection. Get your copy today!"}
        </p>

        <div className="hc-rating">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} fill={i < Math.floor(rating) ? "#F59E0B" : "none"} stroke="#F59E0B" size={14} />
          ))}
        </div>

        <div className="hc-bottom">
          <span className="hc-price">{formattedPrice}</span>
          <button 
            className="hc-cart-btn" 
            onClick={handleCartClick}
            disabled={!inStock}
            aria-label="Add to Cart"
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </article>
  );
};

export default HorizontalBookCard;
