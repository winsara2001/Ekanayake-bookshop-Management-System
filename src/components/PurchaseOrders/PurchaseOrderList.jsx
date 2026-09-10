import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiEdit, FiXCircle, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { useNavigate } from 'react-router-dom';

const PurchaseOrderList = ({ role }) => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    const res = await purchaseOrderService.getPurchaseOrders();
    if (res.success) {
      setPos(res.data);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    if (role === 'inventory_manager') {
      navigate('/inventory/purchase-orders/new');
    } else {
      navigate('/admin/purchase-orders/new');
    }
  };

  const handleView = (id) => {
    if (role === 'inventory_manager') {
      navigate(`/inventory/purchase-orders/${id}`);
    } else {
      navigate(`/admin/purchase-orders/${id}`);
    }
  };

  const handleEdit = (id) => {
    if (role === 'inventory_manager') {
      navigate(`/inventory/purchase-orders/${id}/edit`);
    } else {
      navigate(`/admin/purchase-orders/${id}/edit`);
    }
  };

  const filteredPOs = pos.filter(po => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = (po.po_number || '').toLowerCase().includes(searchLower) ||
                        (po.suppliers?.name || '').toLowerCase().includes(searchLower);
    const matchStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page section" style={{ padding: '0', minHeight: 'auto' }}>
      <div className="admin-header">
        <h1>Purchase Orders</h1>
        {role === 'inventory_manager' && (
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> Create PO
          </button>
        )}
      </div>

      <div className="admin-filters">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by PO number or supplier..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loader">Loading Purchase Orders...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Expected</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No purchase orders found.</td></tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id}>
                    <td><strong>{po.po_number}</strong></td>
                    <td>{po.suppliers?.name || 'Unknown'}</td>
                    <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    <td>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`status-badge ${po.status.toLowerCase()}`}>
                        {po.status}
                      </span>
                    </td>
                    <td>${po.total_amount.toFixed(2)}</td>
                    <td className="admin-actions">
                      <button onClick={() => handleView(po.id)} className="btn-icon text-primary" title="View PO">
                        <FiEye />
                      </button>
                      
                      {po.status === 'DRAFT' && (
                        <button onClick={() => handleEdit(po.id)} className="btn-icon" title="Edit Draft">
                          <FiEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;
