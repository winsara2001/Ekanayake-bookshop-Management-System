import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import './CartContext.css';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('mock_cart');
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (e) {
      console.error('Failed to parse cart from local storage', e);
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (cart.length > 0 || user) {
      localStorage.setItem('mock_cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // Clear cart on logout
  useEffect(() => {
    if (!user) {
      setCart([]);
      localStorage.removeItem('mock_cart');
    }
  }, [user]);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const addToCart = (book, quantity = 1) => {
    if (!user) return; // Safeguard

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === book.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > book.stock) {
          showToast(`Only ${book.stock} copies are currently available.`);
          return prevCart;
        }
        showToast('Book added to cart.');
        return prevCart.map(item =>
          item.id === book.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > book.stock) {
          showToast(`Only ${book.stock} copies are currently available.`);
          return prevCart;
        }
        showToast('Book added to cart.');
        return [...prevCart, { ...book, quantity }];
      }
    });
  };

  const removeFromCart = (bookId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== bookId));
  };

  const increaseQuantity = (bookId, stock) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === bookId) {
        if (item.quantity + 1 > stock) {
          showToast(`Only ${stock} copies are currently available.`);
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const decreaseQuantity = (bookId) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === bookId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const updateQuantity = (bookId, newQuantity, stock) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === bookId) {
        if (newQuantity > stock) {
          showToast(`Only ${stock} copies are currently available.`);
          return { ...item, quantity: stock };
        }
        if (newQuantity < 1) {
          showToast('Minimum quantity is 1.');
          return { ...item, quantity: 1 };
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const safeCart = Array.isArray(cart) ? cart : [];
  const cartItemCount = safeCart.reduce((total, item) => total + (parseInt(item.quantity, 10) || 1), 0);

  const cartSubtotal = safeCart.reduce((total, item) => total + (Number(item.price || 0) * (parseInt(item.quantity, 10) || 1)), 0);

  const syncCartWithLiveStock = async () => {
    if (cart.length === 0) return { success: true };

    // Dynamically import to avoid circular dependencies if any, though regular import is fine
    const { orderService } = await import('../services/orderService');
    const res = await orderService.syncCartStock(cart);

    if (res.success && res.data) {
      let hasChanges = false;
      let outOfStockItems = [];
      let reducedItems = [];

      const newCart = cart.map(item => {
        const liveBook = res.data.find(b => b.id === item.id);

        if (!liveBook || !liveBook.is_active || liveBook.stock === 0) {
          hasChanges = true;
          outOfStockItems.push(item.title);
          return { ...item, stock: 0, quantity: 0, outOfStock: true };
        }

        if (item.quantity > liveBook.stock) {
          hasChanges = true;
          reducedItems.push({ title: item.title, stock: liveBook.stock });
          return { ...item, stock: liveBook.stock, quantity: liveBook.stock, outOfStock: false };
        }

        // Just update stock if it changed but quantity is still valid
        if (item.stock !== liveBook.stock) {
          return { ...item, stock: liveBook.stock, outOfStock: false };
        }

        return item;
      });

      if (hasChanges) {
        setCart(newCart);

        if (outOfStockItems.length > 0) {
          showToast(`${outOfStockItems.join(', ')} is out of stock.`);
        } else if (reducedItems.length > 0) {
          showToast(`Stock reduced for ${reducedItems.map(i => i.title).join(', ')}.`);
        }
        return { success: false, message: 'Cart was updated due to stock changes.' };
      }
      return { success: true };
    }
    return { success: false, message: 'Failed to sync stock.' };
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      clearCart,
      cartItemCount,
      cartSubtotal,
      syncCartWithLiveStock
    }}>
      {children}

      {/* Global Toast Notification */}
      <div className={`cart-toast ${toastVisible ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
