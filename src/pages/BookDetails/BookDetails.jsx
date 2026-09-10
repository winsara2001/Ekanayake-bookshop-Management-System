import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiStar, FiCheck } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useBooks } from '../../hooks/useBooks';
import BookCard from '../../components/BookCard/BookCard';
import './BookDetails.css';

const BookDetails = () => {
  const { id } = useParams();
  const { books, loading, error } = useBooks();
  const [quantity, setQuantity] = useState(1);

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartMessage, setCartMessage] = useState('');

  // Scroll to top when ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1); // Reset quantity when viewing a new book
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '8rem' }}>Loading book details...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '8rem', color: 'red' }}>Error: {error}</div>;

  // Find book by ID
  const book = books.find((b) => b.id === parseInt(id, 10));

  if (!book) {
    return (
      <main className="book-details-page">
        <div className="container">
          <div className="not-found-state">
            <h2>Book Not Found</h2>
            <p>The book you are looking for could not be found.</p>
            <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
          </div>
        </div>
      </main>
    );
  }

  const {
    title,
    author: rawAuthor,
    category: rawCategory,
    price,
    cover,
    rating,
    stock,
    description,
    isbn
  } = book;

  const author = rawAuthor?.name || rawAuthor;
  const category = rawCategory?.name || rawCategory;

  const inStock = stock > 0;
  const isWishlisted = isInWishlist(book.id);
  const formattedPrice = `Rs. ${price.toLocaleString()}`;

  // Quantity controls
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleIncrement = () => setQuantity((prev) => Math.min(stock, prev + 1));

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
      addToCart(book, quantity);
    } else if (action === 'wishlist') {
      toggleWishlist(book);
    }
  };

  // Find related books (same category, exclude current)
  const relatedBooks = books
    .filter((b) => {
      const bCatName = b.category?.name || b.category;
      return bCatName === category && b.id !== book.id;
    })
    .slice(0, 4);

  return (
    <main className="book-details-page">
      <div className="container book-details-container">
        
        {/* Main Book Content */}
        <div className="book-main">
          {/* Left Column: Cover */}
          <div className="book-cover-wrap">
            <img 
              src={cover} 
              alt={`Cover of ${title}`} 
              className="book-cover-image" 
            />
          </div>

          {/* Right Column: Info */}
          <div className="book-info">
            <div className="book-header">
              <h1 className="book-title">{title}</h1>
              <h2 className="book-author">by {author}</h2>
              <div className="book-meta-inline">
                <span className="book-category">{category}</span>
                <div className="book-rating">
                  <FiStar />
                  <span>{rating} / 5.0</span>
                </div>
              </div>
            </div>

            <div className="book-price-stock">
              <span className="book-price">{formattedPrice}</span>
              <span className={`book-stock-status ${!inStock ? 'out-of-stock' : (stock < 5 ? 'low-stock' : 'in-stock')}`}>
                {!inStock ? 'Out of Stock' : (stock < 5 ? `Only ${stock} Left` : 'In Stock')}
              </span>
            </div>

            {/* Actions Form */}
            <div className="book-actions-form">
              <div className="quantity-selector">
                <span className="quantity-label">Quantity:</span>
                <div className="quantity-controls">
                  <button 
                    type="button" 
                    className="quantity-btn" 
                    onClick={handleDecrement}
                    disabled={!inStock || quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="quantity-input" 
                    value={!inStock ? 0 : quantity} 
                    onChange={(e) => {
                      if (!inStock) return;
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        if (val !== '') {
                          const num = parseInt(val, 10);
                          setQuantity(num > stock ? stock : num);
                        } else {
                          setQuantity(''); // Allow intermediate empty state
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (!inStock) return;
                      if (quantity === '' || isNaN(parseInt(quantity, 10)) || quantity < 1) {
                        setQuantity(1);
                      }
                    }}
                    disabled={!inStock}
                  />
                  <button 
                    type="button" 
                    className="quantity-btn" 
                    onClick={handleIncrement}
                    disabled={!inStock || quantity >= stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary add-to-cart-btn"
                  disabled={!inStock}
                  onClick={() => handleAction('cart')}
                >
                  {cartMessage ? (
                    <>
                      <FiCheck /> {cartMessage}
                    </>
                  ) : (
                    <>
                      <FiShoppingCart /> Add to Cart
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-outline wishlist-btn"
                  onClick={() => handleAction('wishlist')}
                >
                  {isWishlisted ? (
                    <>
                      <FaHeart color="var(--color-primary)" /> Remove from Wishlist
                    </>
                  ) : (
                    <>
                      <FiHeart /> Add to Wishlist
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="book-details-sections">
          <div className="section-card">
            <h3>About this Book</h3>
            <p className="about-text">{description || 'Description not available.'}</p>
          </div>

          <div className="section-card">
            <h3>Book Information</h3>
            <ul className="info-list">
              <li>
                <span className="info-label">ISBN</span>
                <span className="info-value">{isbn || 'N/A'}</span>
              </li>
              <li>
                <span className="info-label">Author</span>
                <span className="info-value">{author}</span>
              </li>
              <li>
                <span className="info-label">Category</span>
                <span className="info-value">{category}</span>
              </li>
              <li>
                <span className="info-label">Availability</span>
                <span className={`info-value ${!inStock ? 'text-danger' : ''}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </li>
              <li>
                <span className="info-label">Rating</span>
                <span className="info-value">{rating} / 5</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <div className="related-books-section">
            <div className="section-header">
              <h2>You May Also Like</h2>
            </div>
            <div className="book-grid">
              {relatedBooks.map((relatedBook) => (
                <BookCard key={relatedBook.id} book={relatedBook} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default BookDetails;
