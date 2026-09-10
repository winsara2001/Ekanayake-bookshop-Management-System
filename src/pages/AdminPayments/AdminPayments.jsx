import { useState, useEffect } from 'react';
import { FiCreditCard, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import StatusBadge from '../../components/Badges/StatusBadge';
import '../AdminOrders/AdminOrders.css'; // Re-use order styling

const AdminPayments = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    const res = await orderService.getAllOrders();
    if (res.success) {
      setOrders(res.data);
    } else {
      console.error("Failed to fetch payments:", res.error);
      setError(res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = () => {
    fetchPayments();
  };

  const filteredOrders = orders.filter(order => {
    const firstName = order.customer_profile?.first_name || '';
    const lastName = order.customer_profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase());
      
    const matchesMethod = methodFilter === 'ALL' || order.payment_method === methodFilter;
    const matchesStatus = statusFilter === 'ALL' || order.payment_status === statusFilter;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="admin-orders-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Payment Monitoring</h1>
          <p className="admin-subtitle">Read-only view of order payment records.</p>
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
            placeholder="Search by Order ID or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={methodFilter} 
            onChange={(e) => setMethodFilter(e.target.value)}
            className="status-filter"
          >
            <option value="ALL">All Methods</option>
            <option value="PAY_AT_SHOP">Pay at Shop</option>
            <option value="MOCK_CARD">Card Payment</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="PAID_DEMO">Paid Demo</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading payments...</div>
      ) : error ? (
        <div className="empty-state error-state">
          <h3>Failed to Load Payments</h3>
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FiCreditCard className="empty-icon" />
          <h3>No Payments Found</h3>
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
                <th>Method</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const firstName = order.customer_profile?.first_name;
                const lastName = order.customer_profile?.last_name;
                const customerDisplay = `${firstName || ''} ${lastName || ''}`.trim() || (order.customer_id ? `Customer ID: ${order.customer_id.substring(0, 8)}` : 'Unknown');
                
                return (
                  <tr key={order.order_number}>
                    <td className="font-medium">{order.order_number}</td>
                    <td>{date}</td>
                    <td>{customerDisplay}</td>
                    <td>
                      {order.payment_method === 'PAY_AT_SHOP' ? 'Pay at Shop' : 
                       order.payment_method === 'MOCK_CARD' ? 'Card Payment' : order.payment_method}
                    </td>
                    <td>
                      <StatusBadge status={order.payment_status} type="payment" />
                    </td>
                    <td>
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="font-medium">Rs. {Number(order.total_amount).toLocaleString()}</td>
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

export default AdminPayments;
