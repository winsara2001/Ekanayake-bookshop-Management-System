import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiShoppingBag, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { loyaltyService } from '../../services/loyaltyService';
import { validateName, validateCardNumber, validateExpiryDate, validateCVV } from '../../utils/validation';
import './Checkout.css';

const Checkout = () => {
  const { user, customerProfile, loading: authLoading } = useAuth();
  const { cart, cartSubtotal, clearCart, syncCartWithLiveStock } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  
  // Loyalty State
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [stockError, setStockError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const safeCart = Array.isArray(cart) ? cart : [];
  
  // Redirect if cart is empty
  useEffect(() => {
    if (safeCart.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [safeCart.length, navigate, orderSuccess]);

  // Fetch Loyalty Data
  useEffect(() => {
    if (user) {
      fetchLoyaltyInfo();
    }
  }, [user]);

  const fetchLoyaltyInfo = async () => {
    setLoyaltyLoading(true);
    const [settingsRes, accountRes] = await Promise.all([
      loyaltyService.getLoyaltySettings(),
      loyaltyService.getMyLoyaltyAccount()
    ]);
    
    if (settingsRes.success && settingsRes.data) {
      setLoyaltySettings(settingsRes.data);
    }
    
    if (accountRes.success && accountRes.data) {
      setLoyaltyAccount(accountRes.data);
    }
    
    setLoyaltyLoading(false);
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').substring(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'name') {
      formattedValue = value.replace(/[^A-Za-z\s-]/g, '');
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    setErrors({}); // Clear errors when switching
  };

  // Calculate totals including loyalty
  let loyaltyDiscount = 0;
  let parsedPointsToRedeem = parseInt(pointsToRedeem, 10);
  if (isNaN(parsedPointsToRedeem) || parsedPointsToRedeem < 0) {
    parsedPointsToRedeem = 0;
  }
  
  if (loyaltySettings?.is_active && loyaltySettings?.redemption_value_per_point) {
    loyaltyDiscount = parsedPointsToRedeem * Number(loyaltySettings.redemption_value_per_point || 0);
    // Cap discount to subtotal
    if (loyaltyDiscount > cartSubtotal) {
      loyaltyDiscount = cartSubtotal;
    }
  }
  const finalTotal = Number(cartSubtotal || 0) - loyaltyDiscount;

  const validateCheckout = () => {
    const newErrors = {};

    if (!paymentMethod) {
      newErrors.payment = 'Please select a payment method.';
    }

    if (parsedPointsToRedeem > 0) {
      if (!loyaltySettings?.is_active) {
        newErrors.loyalty = 'Loyalty program is currently inactive.';
      } else if (loyaltyAccount && parsedPointsToRedeem > loyaltyAccount.points_balance) {
        newErrors.loyalty = 'You cannot redeem more points than your available balance.';
      } else if (loyaltyDiscount > cartSubtotal) {
        newErrors.loyalty = 'Loyalty discount cannot exceed the order subtotal.';
      }
    }

    if (paymentMethod === 'mock_card') {
      const nameError = validateName(cardData.name, 'Cardholder Name');
      if (nameError) newErrors.name = nameError;

      const numberError = validateCardNumber(cardData.number);
      if (numberError) newErrors.number = numberError;

      const expiryError = validateExpiryDate(cardData.expiry);
      if (expiryError) newErrors.expiry = expiryError;

      const cvvError = validateCVV(cardData.cvv);
      if (cvvError) newErrors.cvv = cvvError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyStock = () => {
    // Basic frontend check for Out of Stock items
    for (const item of safeCart) {
      if (item.outOfStock) {
        return `"${item.title}" is out of stock. Please remove it from your cart.`;
      }
      if (item.quantity > item.stock) {
        return `"${item.title}" only has ${item.stock} copies available. Please update your cart.`;
      }
    }
    return null; // All good locally
  };

  const handlePlaceOrder = async () => {
    setStockError('');
    
    if (!validateCheckout()) {
      return;
    }

    const localStockIssue = verifyStock();
    if (localStockIssue) {
      setStockError(localStockIssue);
      return;
    }

    setIsPlacingOrder(true);

    const paymentMethodDb = paymentMethod === 'pay_at_shop' ? 'PAY_AT_SHOP' : 'MOCK_CARD';
    
    // Note for mock card doesn't contain real card details, just a demo note.
    const notes = paymentMethod === 'mock_card' 
      ? `Demo Mock Card Payment by ${cardData.name}` 
      : '';

    const response = await orderService.placeOrder(paymentMethodDb, safeCart, notes, parsedPointsToRedeem);

    if (response.success) {
      clearCart();
      setOrderSuccess({
        orderId: response.data.order_number,
        total: finalTotal,
        paymentMethod: paymentMethod === 'pay_at_shop' ? 'Pay at Shop' : 'Mock Card Payment',
        orderStatus: 'Pending'
      });
    } else {
      // Show error and refresh cart stock since something went wrong (likely stock issue)
      setStockError(response.error || 'Failed to place order.');
      await syncCartWithLiveStock();
    }
    
    setIsPlacingOrder(false);
  };

  if (orderSuccess) {
    return (
      <main className="checkout-page">
        <div className="container">
          <div className="order-success-container">
            <FiCheckCircle className="success-icon" />
            <h1 className="success-title">Order Placed Successfully</h1>
            <p className="success-subtitle">Thank you for your order! Your mock order has been confirmed.</p>
            
            <div className="order-details-card">
              <div className="detail-row">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">{orderSuccess.orderId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value">Rs. {Number(orderSuccess.total || 0).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{orderSuccess.paymentMethod}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value badge-pending">{orderSuccess.orderStatus}</span>
              </div>
            </div>

            <div className="success-actions">
              <Link to="/shop" className="btn btn-outline">
                Continue Shopping
              </Link>
              <Link to="/orders" className="btn btn-primary">
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Link to="/cart" className="back-to-cart">
            <FiArrowLeft /> Back to Cart
          </Link>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Review your order and choose your payment method.</p>
        </div>

        <div className="checkout-layout">
          {/* Left Column: Info & Payment */}
          <div className="checkout-main-section">
            <section className="checkout-section">
              <h2 className="section-title">Customer Information</h2>
              <div className="customer-info-card">
                <div className="info-row">
                  <span className="info-label">Customer:</span>
                  <span className="info-value">
                    {authLoading ? 'Loading...' : (
                      [customerProfile?.first_name, customerProfile?.last_name].filter(Boolean).join(' ').trim() || 'Not provided'
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{authLoading ? 'Loading...' : user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">
                    {authLoading ? 'Loading...' : (customerProfile?.phone || 'Not provided')}
                  </span>
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <h2 className="section-title">Choose Payment Method</h2>
              {errors.payment && <div className="checkout-error-banner"><FiAlertCircle /> {errors.payment}</div>}
              
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'pay_at_shop' ? 'selected' : ''}`}>
                  <div className="payment-option-header">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="pay_at_shop" 
                      checked={paymentMethod === 'pay_at_shop'}
                      onChange={() => handlePaymentChange('pay_at_shop')}
                    />
                    <span className="payment-option-title">Pay at Shop</span>
                  </div>
                  <p className="payment-option-desc">Reserve your order and make the payment when you collect it from the book shop.</p>
                </label>

                <label className={`payment-option ${paymentMethod === 'mock_card' ? 'selected' : ''}`}>
                  <div className="payment-option-header">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="mock_card" 
                      checked={paymentMethod === 'mock_card'}
                      onChange={() => handlePaymentChange('mock_card')}
                    />
                    <span className="payment-option-title">Card Payment</span>
                  </div>
                  <p className="payment-option-desc">Pay securely with your credit or debit card.</p>
                </label>
              </div>

              {/* Mock Card Form */}
              {paymentMethod === 'mock_card' && (
                <div className="mock-card-form">
                  <div className="mock-card-notice">
                    Simulated secure payment for demonstration purposes. No real transaction will be processed.
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="cardName">Cardholder Name</label>
                    <input 
                      type="text" 
                      id="cardName"
                      name="name"
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Nimal Perera"
                      value={cardData.name}
                      onChange={handleCardChange}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="cardNumber">Card Number</label>
                    <div className="card-input-wrapper">
                      <FiCreditCard className="card-icon" />
                      <input 
                        type="text" 
                        id="cardNumber"
                        name="number"
                        className={`form-input has-icon ${errors.number ? 'input-error' : ''}`}
                        placeholder="4111 1111 1111 1111"
                        value={cardData.number}
                        onChange={handleCardChange}
                        maxLength={19}
                      />
                    </div>
                    {errors.number && <span className="form-error">{errors.number}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="cardExpiry">Expiry Date</label>
                      <input 
                        type="text" 
                        id="cardExpiry"
                        name="expiry"
                        className={`form-input ${errors.expiry ? 'input-error' : ''}`}
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={handleCardChange}
                        maxLength={5}
                      />
                      {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="cardCvv">CVV</label>
                      <input 
                        type="password" 
                        id="cardCvv"
                        name="cvv"
                        className={`form-input ${errors.cvv ? 'input-error' : ''}`}
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={handleCardChange}
                        maxLength={4}
                      />
                      {errors.cvv && <span className="form-error">{errors.cvv}</span>}
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            {/* Loyalty Redemption Section */}
            {!loyaltyLoading && loyaltySettings?.is_active && loyaltyAccount && (
              <section className="checkout-section">
                <h2 className="section-title">Loyalty Points</h2>
                <div style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Available Points:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{loyaltyAccount.points_balance}</span>
                  </div>
                  
                  {errors.loyalty && <div className="checkout-error-banner" style={{ marginBottom: '1rem' }}><FiAlertCircle /> {errors.loyalty}</div>}

                  <div className="form-group">
                    <label className="form-label">Points to Redeem</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0" 
                      max={loyaltyAccount.points_balance}
                      value={pointsToRedeem}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = '';
                        if (val < 0) val = 0;
                        setPointsToRedeem(val);
                        setErrors(prev => ({ ...prev, loyalty: null })); // clear loyalty error
                      }}
                      placeholder="0"
                    />
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                      1 Point = Rs. {Number(loyaltySettings.redemption_value_per_point || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} discount
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* Right Column: Order Summary */}
          <div className="checkout-summary-section">
            <div className="order-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              
              <div className="checkout-items">
                {safeCart.map((item, index) => (
                  <div key={item.id || Math.random()} className={`checkout-item animate-fade-in-up stagger-${(index % 6) + 1}`}>
                    <div className="checkout-item-image">
                      <img src={item.cover || ''} alt={item.title || 'Book cover'} />
                      <span className="checkout-item-qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-item-details">
                      <h4 className="checkout-item-title">{item.title}</h4>
                      <p className="checkout-item-author">{item.author?.name || item.author || 'Unknown Author'}</p>
                    </div>
                    <div className="checkout-item-price">
                      Rs. {(Number(item.price || 0) * (parseInt(item.quantity, 10) || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>Rs. {Number(cartSubtotal || 0).toLocaleString()}</span>
                </div>
                
                {loyaltyDiscount > 0 && (
                  <div className="summary-row" style={{ color: '#059669' }}>
                    <span>Loyalty Discount (-{parsedPointsToRedeem} pts)</span>
                    <span>- Rs. {Number(loyaltyDiscount || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span>Total</span>
                <span>Rs. {Number(finalTotal || 0).toLocaleString()}</span>
              </div>
              
              {stockError && (
                <div className="stock-error-banner">
                  <FiAlertCircle /> {stockError}
                  <Link to="/cart" className="stock-error-link">Return to Cart</Link>
                </div>
              )}

              <button 
                className="btn btn-primary btn-place-order" 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  'Placing Order...'
                ) : (
                  <>Place Order <FiArrowRight /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
