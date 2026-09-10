import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import './Wishlist.css';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, cart } = useCart();

  const handleAddToCart = (book) => {
    // Check if adding one more would exceed stock
    const cartItem = cart.find((item) => item.id === book.id);
    const currentQuantity = cartItem ? cartItem.quantity : 0;
    
    if (currentQuantity >= book.stock) {
      // Use standard alert if cart toast isn't exposed properly, or we can just rely on addToCart to show it.
      // Actually addToCart already does this check and shows a toast. We can just call it.
      addToCart(book, 1);
    } else {
      addToCart(book, 1);
    }
  };

  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];

  if (safeWishlist.length === 0) {
    return (
      <main className="wishlist-page empty-wishlist-page">
        <div className="container">
          <div className="empty-wishlist-container">
            <FiHeart className="empty-wishlist-icon" />
            <h2>Your wishlist is empty</h2>
            <p>Save books you love and they will appear here.</p>
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Browse Books
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <div>
            <h1 className="wishlist-title">My Wishlist</h1>
            <p className="wishlist-subtitle">Save your favourite books and come back to them anytime.</p>
          </div>
          {safeWishlist.length > 0 && (
            <button className="btn btn-outline btn-sm clear-wishlist-btn" onClick={clearWishlist}>
              Clear Wishlist
            </button>
          )}
        </div>

        <div className="wishlist-grid">
          {safeWishlist.map((book, index) => {
            const inStock = book.stock > 0;
            const authorName = typeof book.author === 'string' ? book.author : (book.author?.name || 'Unknown Author');
            const categoryName = typeof book.category === 'string' ? book.category : (book.category?.name || 'Uncategorized');
            const price = Number(book.price || 0);
            const coverImage = book.cover || book.cover_url || book.image || '/placeholder-book.png';
            const bookId = book.id || book.book_id || index;

            return (
              <div key={bookId} className="wishlist-item">
                <Link to={`/books/${bookId}`} className="wishlist-item-image">
                  <img src={coverImage} alt={book.title || 'Book cover'} />
                </Link>
                
                <div className="wishlist-item-details">
                  <div className="wishlist-item-header">
                    <Link to={`/books/${bookId}`} className="wishlist-item-title">{book.title || 'Unknown Title'}</Link>
                    <button 
                      className="wishlist-item-remove"
                      onClick={() => removeFromWishlist(bookId)}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  
                  <p className="wishlist-item-author">{authorName}</p>
                  <span className="wishlist-item-category">{categoryName}</span>
                  
                  <div className="wishlist-item-meta">
                    <span className="wishlist-item-price">Rs. {price.toLocaleString()}</span>
                    <span className={`wishlist-item-stock ${inStock ? 'text-success' : 'text-danger'}`}>
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  
                  <div className="wishlist-item-actions">
                    <button 
                      className="btn btn-primary btn-sm add-to-cart-btn"
                      onClick={() => handleAddToCart(book)}
                      disabled={!inStock}
                    >
                      <FiShoppingCart /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
