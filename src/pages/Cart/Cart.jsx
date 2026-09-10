import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { validateInteger } from '../../utils/validation';
import './Cart.css';

const Cart = () => {
  const { cart, increaseQuantity, decreaseQuantity, updateQuantity, removeFromCart, clearCart, cartSubtotal } = useCart();
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const navigate = useNavigate();

  const handleQuantityChange = (id, value, stock) => {
    // Only allow numbers to be typed
    if (value === '' || /^\d+$/.test(value)) {
      // We pass the raw value to context or state, but here we directly call updateQuantity if valid
      // To allow the user to delete everything and type a new number, we don't update context immediately on empty
      if (value !== '') {
        const num = parseInt(value, 10);
        updateQuantity(id, num, stock);
      }
    }
  };

  const handleQuantityBlur = (id, value) => {
    if (value === '' || isNaN(parseInt(value, 10))) {
      updateQuantity(id, 1, 999); // Reset to 1 on invalid blur
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const safeCart = Array.isArray(cart) ? cart : [];
  
  if (safeCart.length === 0) {
    return (
      <main className="cart-page empty-cart-page">
        <div className="empty-cart-container">
          <div className="empty-cart-icon">
            <FiShoppingBag />
          </div>
          <h1 className="empty-cart-title">Your cart is empty</h1>
          <p className="empty-cart-subtitle">Looks like you haven't added any books yet.</p>
          <Link to="/shop" className="btn btn-primary btn-continue">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1 className="cart-title">Your Shopping Cart</h1>
          <p className="cart-subtitle">Review your books before proceeding to checkout.</p>
        </div>

        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items-list">
              {safeCart.map((item, index) => (
                <div key={item.id || Math.random()} className={`cart-item animate-fade-in-up stagger-${(index % 6) + 1}`}>
                  <div className="cart-item-image">
                    <img src={item.cover || ''} alt={item.title || 'Book cover'} />
                  </div>
                  
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <Link to={`/books/${item.id}`} className="cart-item-title">{item.title}</Link>
                      <button 
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    
                    <p className="cart-item-author">{item.author?.name || item.author || 'Unknown Author'}</p>
                    <p className="cart-item-price">Rs. {Number(item.price || 0).toLocaleString()}</p>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-selector">
                        <button 
                          className="qty-btn" 
                          onClick={() => decreaseQuantity(item.id)}
                          disabled={(parseInt(item.quantity, 10) || 1) <= 1}
                        >
                          <FiMinus />
                        </button>
                        <input
                          type="text"
                          className="qty-input"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value, item.stock)}
                          onBlur={(e) => handleQuantityBlur(item.id, e.target.value)}
                        />
                        <button 
                          className="qty-btn" 
                          onClick={() => increaseQuantity(item.id, item.stock)}
                          disabled={(parseInt(item.quantity, 10) || 1) >= (Number(item.stock) || 0)}
                        >
                          <FiPlus />
                        </button>
                      </div>
                      
                      <div className="cart-item-subtotal">
                        Subtotal: <strong>Rs. {(Number(item.price || 0) * (parseInt(item.quantity, 10) || 1)).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-actions-bottom">
              <button className="btn-clear-cart" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="order-summary">
              <h2 className="summary-title">Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {Number(cartSubtotal || 0).toLocaleString()}</span>
              </div>
              
              <div className="summary-row">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span>Estimated Total</span>
                <span>Rs. {Number(cartSubtotal || 0).toLocaleString()}</span>
              </div>
              
              <button 
                className="btn btn-primary btn-checkout" 
                onClick={handleCheckout}
              >
                Proceed to Checkout <FiArrowRight />
              </button>
              
              {checkoutMessage && (
                <div className="checkout-message">
                  {checkoutMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
