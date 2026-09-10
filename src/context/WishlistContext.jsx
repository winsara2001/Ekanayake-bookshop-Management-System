import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import './WishlistContext.css';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('mock_wishlist');
      const parsed = savedWishlist ? JSON.parse(savedWishlist) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing wishlist from local storage:', error);
      return [];
    }
  });
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Save wishlist to local storage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0 || user) {
      localStorage.setItem('mock_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  // Clear wishlist on logout - managed globally or via useEffect here
  useEffect(() => {
    if (!user) {
      setWishlist([]); // Clear on logout
      localStorage.removeItem('mock_wishlist');
    }
  }, [user]);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const isInWishlist = (bookId) => {
    return wishlist.some(item => item.id === bookId);
  };

  const addToWishlist = (book) => {
    if (!user) return; // Safeguard
    
    // Only add active books or handle gracefully
    // Using mock data, assume it's active. Duplicate check:
    if (isInWishlist(book.id)) return;

    setWishlist(prev => [...prev, book]);
    showToast('Added to wishlist.');
  };

  const removeFromWishlist = (bookId) => {
    setWishlist(prev => prev.filter(item => item.id !== bookId));
    showToast('Removed from wishlist.');
  };

  const toggleWishlist = (book) => {
    if (isInWishlist(book.id)) {
      removeFromWishlist(book.id);
    } else {
      addToWishlist(book);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    showToast('Wishlist cleared.');
  };

  const wishlistItemCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{
      wishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
      wishlistItemCount
    }}>
      {children}
      
      {/* Global Toast Notification for Wishlist */}
      <div className={`wishlist-toast ${toastVisible ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
