import { useState, useEffect } from 'react';
import { FiShoppingBag, FiSearch, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import StatusBadge from '../../components/Badges/StatusBadge';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    const res = await orderService.getAllOrders();
    if (res.success) {
      setOrders(res.data);
    } else {
      console.error("Failed to fetch all orders:", res.error);
      setError(res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setProcessingId(orderId);
    const res = await orderService.updateOrderStatus(orderId, newStatus);
    if (res.success) {
      fetchOrders();
    } else {
      alert('Failed to update status: ' + res.error);
    }
    setProcessingId(null);
  };

  const handleConfirmPayment = async (orderId) => {
    setProcessingId(orderId);
    const res = await orderService.confirmPayAtShopPayment(orderId);
    if (res.success) {
      fetchOrders();
    } else {
      alert('Failed to confirm payment: ' + res.error);
    }
    setProcessingId(null);
  };

  const filteredOrders = orders.filter(order => {
    const firstName = order.customer_profile?.first_name || '';
    const lastName = order.customer_profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-orders-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Order Management</h1>
          <p className="admin-subtitle">View and manage all customer orders.</p>
        </div>
        <button className="btn btn-outline" onClick={handleRefresh} disabled={isLoading}>
          <FiRefreshCw className={isLoading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="admin-controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="READY_FOR_COLLECTION">Ready for Collection</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading orders...</div>
      ) : error ? (
        <div className="empty-state error-state">
          <FiAlertCircle className="empty-icon" style={{ color: 'var(--danger-color)' }} />
          <h3>Failed to Load Orders</h3>
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FiShoppingBag className="empty-icon" />
          <h3>No Orders Found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                
                const firstName = order.customer_profile?.first_name;
                const lastName = order.customer_profile?.last_name;
                const customerDisplay = `${firstName || ''} ${lastName || ''}`.trim() || (order.customer_id ? `Customer ID: ${order.customer_id.substring(0, 8)}` : 'Unknown');
                
                return (
                  <tr key={order.order_number}>
                    <td className="font-medium">{order.order_number}</td>
                    <td>{date}</td>
                    <td>{customerDisplay}</td>
                    <td>{itemCount}</td>
                    <td className="font-medium">Rs. {Number(order.total_amount).toLocaleString()}</td>
                    <td>
                      <StatusBadge status={order.payment_status} type="payment" />
                    </td>
                    <td>
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {order.status === 'PENDING' && (
                          <button className="btn btn-primary btn-sm" disabled={processingId === order.id} onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}>
                            {processingId === order.id ? 'Processing...' : 'Confirm Order'}
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button className="btn btn-primary btn-sm" disabled={processingId === order.id} onClick={() => handleUpdateStatus(order.id, 'READY_FOR_COLLECTION')}>
                            {processingId === order.id ? 'Processing...' : 'Mark Ready'}
                          </button>
                        )}
                        {order.status === 'READY_FOR_COLLECTION' && order.payment_method === 'PAY_AT_SHOP' && order.payment_status === 'PENDING' && (
                          <button className="btn btn-outline btn-sm" disabled={processingId === order.id} onClick={() => handleConfirmPayment(order.id)}>
                            {processingId === order.id ? 'Processing...' : 'Confirm Payment'}
                          </button>
                        )}
                        {order.status === 'READY_FOR_COLLECTION' && (order.payment_status === 'PAID' || order.payment_status === 'PAID_DEMO') && (
                          <button className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }} disabled={processingId === order.id} onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}>
                            {processingId === order.id ? 'Processing...' : 'Complete Order'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
