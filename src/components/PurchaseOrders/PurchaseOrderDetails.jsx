import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiPackage } from 'react-icons/fi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import ReceiveBooksModal from './ReceiveBooksModal';
import ReceiptHistory from './ReceiptHistory';

const PurchaseOrderDetails = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [approveModal, setApproveModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);

  useEffect(() => {
    fetchPO();
  }, [id]);

  const fetchPO = async () => {
    setLoading(true);
    const res = await purchaseOrderService.getPurchaseOrderById(id);
    if (res.success) {
      setPo(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    const res = await purchaseOrderService.approvePurchaseOrder(id);
    if (res.success) {
      setApproveModal(false);
      fetchPO(); // Reload data
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    setActionLoading(true);
    const res = await purchaseOrderService.cancelPurchaseOrder(id);
    if (res.success) {
      setCancelModal(false);
      fetchPO(); // Reload data
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="admin-page section"><div className="page-loader">Loading Purchase Order...</div></div>;
  if (error) return <div className="admin-page section"><div className="admin-error">{error}</div></div>;
  if (!po) return null;

  const canReceive = (po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (role === 'inventory_manager' || role === 'admin');

  return (
    <div className="admin-page section">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><FiArrowLeft size={24} /></button>
          <h1>Purchase Order: {po.po_number}</h1>
          <span className={`status-badge ${po.status.toLowerCase()}`}>{po.status.replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {canReceive && (
            <button className="btn btn-primary" onClick={() => setReceiveModal(true)} style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
              <FiPackage /> Receive Books
            </button>
          )}

          {/* Actions based on role and status */}
          {po.status === 'DRAFT' && role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setApproveModal(true)}>
              <FiCheckCircle /> Approve
            </button>
          )}
          
          {(po.status === 'DRAFT' || (po.status === 'APPROVED' && role === 'admin')) && (
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setCancelModal(true)}>
              <FiXCircle /> Cancel PO
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* PO Details Side */}
        <div className="admin-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Details</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Supplier</div>
            <div style={{ fontWeight: '500' }}>{po.suppliers?.name}</div>
            {po.suppliers?.contact_person && <div>Contact: {po.suppliers.contact_person}</div>}
            {po.suppliers?.email && <div>Email: {po.suppliers.email}</div>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Created By</div>
            <div>{po.created_by_user?.first_name} {po.created_by_user?.last_name} on {new Date(po.created_at).toLocaleDateString()}</div>
          </div>

          {po.expected_date && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Expected Date</div>
              <div>{new Date(po.expected_date).toLocaleDateString()}</div>
            </div>
          )}

          {po.supplier_reference && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Supplier Reference</div>
              <div>{po.supplier_reference}</div>
            </div>
          )}

          {po.notes && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Notes</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{po.notes}</div>
            </div>
          )}

          {['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status) && po.approved_by_user && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 'bold' }}>APPROVED</div>
              <div style={{ color: '#166534', fontSize: '0.875rem' }}>
                By {po.approved_by_user.first_name} {po.approved_by_user.last_name} on {new Date(po.approved_at).toLocaleString()}
              </div>
            </div>
          )}

          {po.status === 'RECEIVED' && po.received_at && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 'bold' }}>FULLY RECEIVED</div>
              <div style={{ color: '#065f46', fontSize: '0.875rem' }}>
                Completed on {new Date(po.received_at).toLocaleString()}
              </div>
            </div>
          )}

          {po.status === 'CANCELLED' && po.cancelled_by_user && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 'bold' }}>CANCELLED</div>
              <div style={{ color: '#991b1b', fontSize: '0.875rem' }}>
                By {po.cancelled_by_user.first_name} {po.cancelled_by_user.last_name} on {new Date(po.cancelled_at).toLocaleString()}
              </div>
            </div>
          )}

        </div>

        {/* PO Items & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                {['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status) ? 'Receiving Progress' : 'Line Items'}
              </h2>
            </div>

            <div style={{ flex: 1, overflowX: 'auto' }}>
              <table className="admin-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Ordered</th>
                    
                    {['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status) && (
                      <>
                        <th style={{ width: '80px', textAlign: 'center' }}>Received</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Remaining</th>
                      </>
                    )}

                    <th style={{ width: '100px', textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items && po.items.map((item) => {
                    const remaining = item.quantity - item.received_quantity;
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.books?.title || 'Unknown Book'}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ISBN: {item.books?.isbn || '-'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        
                        {['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status) && (
                          <>
                            <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{item.received_quantity}</td>
                            <td style={{ textAlign: 'center', color: remaining > 0 ? '#b91c1c' : '#6b7280', fontWeight: 'bold' }}>{remaining}</td>
                          </>
                        )}

                        <td style={{ textAlign: 'right' }}>${item.unit_cost.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}><strong>${item.line_total.toFixed(2)}</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px solid #eee', paddingTop: '1rem', marginTop: '1rem', textAlign: 'right', fontSize: '1.5rem' }}>
              <strong>PO Total: <span style={{ color: '#2563eb' }}>${po.total_amount.toFixed(2)}</span></strong>
            </div>
          </div>

          {/* Receiving History Section */}
          {['PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status) && (
            <div className="admin-card">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Receiving History</h2>
              <ReceiptHistory poId={po.id} />
            </div>
          )}

        </div>
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Approve Purchase Order?</h2>
              <button onClick={() => setApproveModal(false)} className="btn-icon">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Approval authorizes the purchase, but stock will not increase until the books are received.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setApproveModal(false)} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleApprove} className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Approving...' : 'Approve Purchase Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Are you sure you want to cancel this Purchase Order?</h2>
              <button onClick={() => setCancelModal(false)} className="btn-icon">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                The purchasing record will be retained for audit purposes.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setCancelModal(false)} className="btn btn-outline" disabled={actionLoading}>Keep Purchase Order</button>
                <button onClick={handleCancel} className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={actionLoading}>
                  {actionLoading ? 'Cancelling...' : 'Cancel Purchase Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {receiveModal && (
        <ReceiveBooksModal 
          po={po} 
          onClose={() => setReceiveModal(false)} 
          onReceived={() => {
            setReceiveModal(false);
            fetchPO();
          }} 
        />
      )}

    </div>
  );
};

export default PurchaseOrderDetails;
