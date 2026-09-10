import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import StatusBadge from '../../components/Badges/StatusBadge';
import './OrderDetails.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    const res = await orderService.getMyOrderById(orderId);
    if (res.success && res.data) {
      setOrder(res.data);
    } else {
      console.error("Error loading order:", res.error);
      setNotFound(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancelClick = async () => {
    if (window.confirm('Are you sure you want to cancel this order? Reserved stock will be returned to inventory.')) {
      setCancelling(true);
      const res = await orderService.cancelOrder(order.id);
      if (res.success) {
        alert('Order cancelled successfully.');
        fetchOrder();
      } else {
        alert('Failed to cancel order: ' + res.error);
      }
      setCancelling(false);
    }
  };

  if (isLoading) {
    return <div className="orders-loading">Loading order details...</div>;
  }

  if (notFound || !order) {
    return (
      <main className="order-details-page empty-orders-page">
        <div className="empty-orders-container">
          <div className="empty-orders-icon">
            <FiAlertCircle />
          </div>
          <h1 className="empty-orders-title">Order Not Found</h1>
          <p className="empty-orders-subtitle">We couldn't find this order. It may have been deleted or belongs to another account.</p>
          <Link to="/orders" className="btn btn-primary">
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isCancelable = order.status === 'PENDING';
  const displayPaymentMethod = order.payment_method === 'PAY_AT_SHOP' ? 'Pay at Shop' : 'Mock Card \u2014 Demo Only';
  
  let statusMessage = '';
  switch(order.status) {
    case 'PENDING': statusMessage = 'Your order is awaiting confirmation.'; break;
    case 'CONFIRMED': statusMessage = 'Your order has been confirmed.'; break;
    case 'READY_FOR_COLLECTION': statusMessage = 'Your books are ready for collection at Ekanayake Book Shop.'; break;
    case 'COMPLETED': statusMessage = 'Order completed.'; break;
    case 'CANCELLED': statusMessage = 'This order has been cancelled.'; break;
  }

  return (
    <main className="order-details-page">
      <div className="container">
        <div className="orders-header">
          <Link to="/orders" className="back-to-orders">
            <FiArrowLeft /> Back to My Orders
          </Link>
          <div className="order-title-row">
            <h1 className="orders-title">Order {order.order_number}</h1>
            <StatusBadge status={order.status} type="order" />
          </div>
          <p className="orders-subtitle">Placed on {date}</p>
        </div>

        <div className="order-details-layout">
          <div className="order-main-content">
            {/* Timeline */}
            <div className="order-timeline-card">
              <h2 className="section-title">Order Status</h2>
              <p className="status-message">{statusMessage}</p>
              
              {order.status === 'CANCELLED' ? (
                <div className="timeline-cancelled">
                  This order was cancelled.
                </div>
              ) : (
                <div className="timeline" style={{ marginTop: '1rem' }}>
                  <div className={`timeline-step ${['PENDING', 'CONFIRMED', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(order.status) ? 'active' : ''}`}>
                    <div className="step-indicator"></div>
                    <div className="step-label">Pending</div>
                  </div>
                  <div className="timeline-connector"></div>
                  <div className={`timeline-step ${['CONFIRMED', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(order.status) ? 'active' : ''}`}>
                    <div className="step-indicator"></div>
                    <div className="step-label">Confirmed</div>
                  </div>
                  <div className="timeline-connector"></div>
                  <div className={`timeline-step ${['READY_FOR_COLLECTION', 'COMPLETED'].includes(order.status) ? 'active' : ''}`}>
                    <div className="step-indicator"></div>
                    <div className="step-label">Ready for Collection</div>
                  </div>
                  <div className="timeline-connector"></div>
                  <div className={`timeline-step ${order.status === 'COMPLETED' ? 'active' : ''}`}>
                    <div className="step-indicator"></div>
                    <div className="step-label">Completed</div>
                  </div>
                </div>
              )}
            </div>

            {/* Items Snapshot */}
            <div className="order-items-card">
              <h2 className="section-title">Order Items</h2>
              <div className="order-items-list">
                {order.order_items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-image">
                      {item.book?.cover ? <img src={item.book.cover} alt={item.book_title_snapshot} /> : <div className="no-cover">No Cover</div>}
                    </div>
                    <div className="order-item-info">
                      <Link to={`/books/${item.book_id}`} className="order-item-title">{item.book_title_snapshot}</Link>
                      <div className="order-item-qty-price">
                        <span className="qty-badge">Qty: {item.quantity}</span>
                        <span className="unit-price">Rs. {Number(item.unit_price).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="order-item-subtotal">
                      Rs. {Number(item.line_total).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-sidebar">
            <div className="order-summary-card">
              <h2 className="section-title">Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {Number(order.subtotal).toLocaleString()}</span>
              </div>
              
              {order.loyalty_discount_amount > 0 && (
                <div className="summary-row" style={{ color: '#059669' }}>
                  <span>Loyalty Discount (-{order.loyalty_points_redeemed} pts)</span>
                  <span>- Rs. {Number(order.loyalty_discount_amount).toLocaleString()}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span>Total</span>
                <span>Rs. {Number(order.total_amount).toLocaleString()}</span>
              </div>

              {order.loyalty_points_earned > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 'bold' }}>Loyalty Points Earned: +{order.loyalty_points_earned}</div>
                </div>
              )}
            </div>

            <div className="order-info-card">
              <h2 className="section-title">Payment Info</h2>
              <div className="info-block">
                <div className="info-label">Payment Method</div>
                <div className="info-value">{displayPaymentMethod}</div>
                {order.payment_method === 'MOCK_CARD' && (
                  <>
                    <div className="demo-note" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Demo payment only</div>
                    <div className="demo-note-desc" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No real financial transaction was processed.</div>
                  </>
                )}
              </div>
              <div className="info-block">
                <div className="info-label">Payment Status</div>
                <StatusBadge status={order.payment_status} type="payment" />
              </div>
            </div>

            <div className="order-info-card">
              <h2 className="section-title">Customer Details</h2>
              <div className="info-block">
                <div className="info-label">Name</div>
                <div className="info-value">{user.firstName} {user.lastName}</div>
              </div>
            </div>

            {isCancelable && (
              <div className="cancellation-section" style={{ marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={handleCancelClick}
                  disabled={cancelling}
                  style={{ width: '100%', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderDetails;
