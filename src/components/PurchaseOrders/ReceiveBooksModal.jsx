import { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { purchaseOrderService } from '../../services/purchaseOrderService';

const ReceiveBooksModal = ({ po, onClose, onReceived }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  // Local state for tracking quantities to receive right now
  const [receiveData, setReceiveData] = useState(() => {
    const initialData = {};
    po.items.forEach(item => {
      initialData[item.id] = 0; // Default 0
    });
    return initialData;
  });

  const [confirmStep, setConfirmStep] = useState(false);

  const handleQtyChange = (itemId, val, max) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > max) num = max;
    
    setReceiveData(prev => ({
      ...prev,
      [itemId]: num
    }));
  };

  const handleNext = () => {
    setError(null);
    const hasAnyQty = Object.values(receiveData).some(qty => qty > 0);
    if (!hasAnyQty) {
      setError('Please enter a quantity greater than 0 for at least one item.');
      return;
    }
    setConfirmStep(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    // Format payload
    const itemsPayload = Object.entries(receiveData)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        item_id: id,
        qty: qty
      }));

    const res = await purchaseOrderService.receivePurchaseOrder(po.id, itemsPayload, note);
    
    if (res.success) {
      onReceived(); // Callback to parent to refresh
    } else {
      setError(res.error);
      setConfirmStep(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="admin-modal-header">
          <h2>Receive Books — {po.po_number}</h2>
          <button onClick={onClose} className="btn-icon" disabled={loading}><FiX size={24} /></button>
        </div>
        
        <div className="admin-modal-body">
          {error && <div className="admin-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {!confirmStep ? (
            <>
              <div style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                <p><strong>Supplier:</strong> {po.suppliers?.name}</p>
                <p>Enter the quantities you are receiving now. You can leave items at 0 if they are not in this delivery.</p>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table className="admin-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th style={{ textAlign: 'center' }}>Ordered</th>
                      <th style={{ textAlign: 'center' }}>Already Received</th>
                      <th style={{ textAlign: 'center' }}>Remaining</th>
                      <th style={{ width: '150px' }}>Receive Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map(item => {
                      const remaining = item.quantity - item.received_quantity;
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.books?.title}</strong><br/>
                            <small className="text-gray-500">{item.books?.isbn}</small>
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'center', color: '#059669' }}>{item.received_quantity}</td>
                          <td style={{ textAlign: 'center', color: remaining > 0 ? '#b91c1c' : '#6b7280' }}>
                            {remaining}
                          </td>
                          <td>
                            <input 
                              type="number"
                              className="form-input"
                              min="0"
                              max={remaining}
                              disabled={remaining === 0}
                              value={receiveData[item.id]}
                              onChange={(e) => handleQtyChange(item.id, e.target.value, remaining)}
                              style={{ textAlign: 'center' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Receiving Note (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Delivered via FedEx, tracking #1234"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleNext}>Next: Review</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#92400e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCheck /> Confirm Received Quantities
                </h3>
                <p style={{ color: '#b45309', marginBottom: '1rem' }}>
                  This action will permanently increase inventory for the following books and create <strong>PURCHASE_RECEIPT</strong> records.
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#92400e' }}>
                  {Object.entries(receiveData).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
                    const item = po.items.find(i => i.id === id);
                    return (
                      <li key={id}>
                        <strong>{item.books?.title}</strong>: +{qty}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setConfirmStep(false)} disabled={loading}>Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm Receipt & Update Inventory'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReceiveBooksModal;
