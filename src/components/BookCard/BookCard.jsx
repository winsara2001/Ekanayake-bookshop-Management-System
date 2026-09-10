import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar, FiEye } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import './BookCard.css';

const BookCard = ({ book }) => {
  const {
    id,
    title,
    author: rawAuthor,
    category: rawCategory,
    price,
    cover,
    rating,
    stock,
  } = book;

  const author = rawAuthor?.name || rawAuthor;
  const category = rawCategory?.name || rawCategory;

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartMessage, setCartMessage] = useState('');

  const formattedPrice = `Rs. ${price.toLocaleString()}`;
  const inStock = stock > 0;
  const isWishlisted = isInWishlist(id);

  const handleAction = (action) => {
    if (!user) {
      const message = action === 'cart' 
        ? 'Please log in to add books to your cart.'
        : 'Please log in to add books to your wishlist.';
        
      navigate('/login', { 
        state: { message, from: location.pathname } 
      });
      return;
    }

    if (action === 'cart') {
      addToCart(book, 1);
      setCartMessage('Added ✓');
      setTimeout(() => setCartMessage(''), 2000);
    } else if (action === 'wishlist') {
      toggleWishlist(book);
    }
  };

  return (
    <article className="book-card">
      {/* Cover Image */}
      <div className="book-card__cover-wrap">
        <Link to={`/books/${id}`}>
          <img
            src={cover}
            alt={`Cover of ${title} by ${author}`}
            className="book-card__cover"
            loading="lazy"
          />
        </Link>
        <button 
          className="book-card__wishlist" 
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => handleAction('wishlist')}
        >
          {isWishlisted ? <FaHeart color="var(--color-primary)" /> : <FiHeart />}
        </button>
        <span className="book-card__category-badge">{category}</span>
      </div>

      {/* Info */}
      <div className="book-card__body">
        <Link to={`/books/${id}`} style={{ textDecoration: 'none' }}>
          <h3 className="book-card__title" title={title}>{title}</h3>
        </Link>
        <p className="book-card__author">{author}</p>

        {/* Rating */}
        <div className="book-card__rating">
          <FiStar className="book-card__star" />
          <span className="book-card__rating-value">{rating}</span>
        </div>

        {/* Price + Stock */}
        <div className="book-card__meta">
          <span className="book-card__price">{formattedPrice}</span>
          <span
            className={`book-card__stock ${inStock ? 'book-card__stock--in' : 'book-card__stock--out'}`}
          >
            {!inStock ? 'Out of Stock' : (stock < 5 ? `Only ${stock} Left` : 'In Stock')}
          </span>
        </div>

        {/* Actions */}
        <div className="book-card__actions">
          <button 
            className={`btn btn-sm book-card__cart-btn ${cartMessage ? 'btn-success animate-fade-in' : 'btn-primary'}`}
            disabled={!inStock || !!cartMessage}
            onClick={() => handleAction('cart')}
          >
            {cartMessage ? (
              <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {cartMessage}
              </span>
            ) : (
              <>
                <FiShoppingCart size={14} className="cart-icon" />
                Add to Cart
              </>
            )}
          </button>
          <Link to={`/books/${id}`} className="btn btn-outline btn-sm book-card__view-btn" aria-label="View details">
            <FiEye size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BookCard;
