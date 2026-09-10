import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import StatusBadge from '../../components/Badges/StatusBadge';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    const res = await orderService.getMyOrders();
    if (res.success) {
      setOrders(res.data);
    } else {
      console.error("Error loading orders:", res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelClick = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? Reserved stock will be returned to inventory.')) {
      cancelOrder(orderId);
    }
  };

  const cancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    const res = await orderService.cancelOrder(orderId);
    if (res.success) {
      alert('Order cancelled successfully.');
      fetchOrders();
    } else {
      alert('Failed to cancel order: ' + res.error);
    }
    setCancellingOrderId(null);
  };

  if (isLoading) {
    return <div className="orders-loading">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <main className="orders-page empty-orders-page">
        <div className="empty-orders-container">
          <div className="empty-orders-icon">
            <FiShoppingBag />
          </div>
          <h1 className="empty-orders-title">No orders yet</h1>
          <p className="empty-orders-subtitle">You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">View your previous purchases and check the status of your orders.</p>
        </div>

        <div className="orders-list">
          {orders.map((order) => {
            const date = new Date(order.created_at).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            });
            const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

            // Map DB enums to display strings if needed
            const displayPaymentMethod = order.payment_method === 'PAY_AT_SHOP' ? 'Pay at Shop' : 'Mock Card Payment';
            
            return (
              <div key={order.order_number} className="order-card">
                <div className="order-card-header">
                  <div className="order-id-group">
                    <span className="order-label">Order ID</span>
                    <span className="order-id">{order.order_number}</span>
                  </div>
                  <div className="order-date-group">
                    <span className="order-label">Date</span>
                    <span className="order-date">{date}</span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-summary-item">
                    <span className="summary-label">Items</span>
                    <span className="summary-value">{itemCount}</span>
                  </div>
                  <div className="order-summary-item">
                    <span className="summary-label">Total</span>
                    <span className="summary-value total-amount">Rs. {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="order-summary-item">
                    <span className="summary-label">Payment</span>
                    <span className="summary-value">{displayPaymentMethod}</span>
                  </div>
                  <div className="order-summary-item">
                    <span className="summary-label">Payment Status</span>
                    <StatusBadge status={order.payment_status} type="payment" />
                  </div>
                  <div className="order-summary-item">
                    <span className="summary-label">Order Status</span>
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </div>

                <div className="order-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {order.status === 'PENDING' ? (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleCancelClick(order.id)}
                      disabled={cancellingOrderId === order.id}
                      style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <Link to={`/orders/${order.order_number}`} className="btn-view-details">
                    View Details <FiChevronRight />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Orders;
