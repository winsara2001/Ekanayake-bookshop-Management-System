import { useState, useMemo } from 'react';
import { FiX } from 'react-icons/fi';
import { inventoryService } from '../../../services/inventoryService';

const AdjustStockModal = ({ book, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('ADJUSTMENT_IN');
  const [quantity, setQuantity] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isInitialStock = adjustmentType === 'INITIAL_STOCK';
  const isAdd = adjustmentType === 'ADJUSTMENT_IN';
  const isRemove = adjustmentType === 'ADJUSTMENT_OUT';

  // Available reasons based on type
  const reasons = useMemo(() => {
    if (isInitialStock) return ['Initial Stock'];
    if (isAdd) return ['Stock Count Correction', 'Returned Item', 'Other'];
    if (isRemove) return ['Damaged Book', 'Lost Book', 'Stock Count Correction', 'Other'];
    return [];
  }, [isInitialStock, isAdd, isRemove]);

  // Derived new stock preview
  const newStockPreview = useMemo(() => {
    const q = parseInt(quantity || 0, 10);
    if (isNaN(q) || q < 0) return book.stock;
    
    if (isRemove) return book.stock - q;
    return book.stock + q;
  }, [book.stock, quantity, isRemove]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive integer greater than zero.');
      return;
    }

    if (!reasonCategory) {
      setError('Please select a reason.');
      return;
    }

    if (reasonCategory === 'Other' && !reasonText.trim()) {
      setError('Please provide an explanation for "Other".');
      return;
    }

    if (isRemove && qty > book.stock) {
      setError(`Cannot remove ${qty}. Current stock is only ${book.stock}.`);
      return;
    }

    if (isInitialStock && book.stock > 0) {
      setError('INITIAL_STOCK can only be used when current stock is 0.');
      return;
    }

    setLoading(true);

    const finalReason = reasonCategory === 'Other' || isInitialStock
      ? (reasonText ? `${reasonCategory} - ${reasonText}` : reasonCategory)
      : reasonCategory;

    const res = await inventoryService.adjustBookStock(
      book.id,
      adjustmentType,
      qty,
      finalReason
    );

    if (res.success) {
      setLoading(false);
      onSuccess();
    } else {
      setError(res.error || 'Failed to adjust stock.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <div className="modal-header" style={headerStyle}>
          <h2>Adjust Stock</h2>
          <button onClick={onClose} style={closeBtnStyle}><FiX size={24} /></button>
        </div>

        <div className="modal-body" style={bodyStyle}>
          <div style={bookInfoStyle}>
            {book.cover && <img src={book.cover} alt={book.title} style={coverStyle} />}
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{book.title}</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Current Stock: <strong style={{ color: '#0f172a' }}>{book.stock}</strong></p>
            </div>
          </div>

          {error && <div className="admin-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adjustment Type</label>
              <select 
                className="form-input"
                value={adjustmentType}
                onChange={(e) => {
                  setAdjustmentType(e.target.value);
                  setReasonCategory('');
                  setReasonText('');
                }}
              >
                {book.stock === 0 && <option value="INITIAL_STOCK">Initial Stock</option>}
                <option value="ADJUSTMENT_IN">Add Stock</option>
                <option value="ADJUSTMENT_OUT">Remove Stock</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input 
                type="number"
                className="form-input"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason</label>
              <select
                className="form-input"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                required
              >
                <option value="">Select a reason...</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {reasonCategory === 'Other' && (
              <div className="form-group">
                <label className="form-label">Explanation</label>
                <input
                  type="text"
                  className="form-input"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Provide details..."
                  required
                />
              </div>
            )}

            <div style={previewStyle}>
              <div style={previewItemStyle}>
                <span style={previewLabelStyle}>Current</span>
                <span style={previewValueStyle}>{book.stock}</span>
              </div>
              <div style={previewItemStyle}>
                <span style={previewLabelStyle}>Change</span>
                <span style={{...previewValueStyle, color: isRemove ? '#ef4444' : '#10b981'}}>
                  {isRemove ? '-' : '+'}{quantity || 0}
                </span>
              </div>
              <div style={previewItemStyle}>
                <span style={previewLabelStyle}>New Stock</span>
                <span style={{...previewValueStyle, fontWeight: 'bold'}}>{newStockPreview}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Inline styles for simplicity instead of creating a new CSS file
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const contentStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid #e2e8f0'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#64748b'
};

const bodyStyle = {
  padding: '1.5rem'
};

const bookInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: '#f8fafc',
  borderRadius: '8px'
};

const coverStyle = {
  width: '50px',
  height: '75px',
  objectFit: 'cover',
  borderRadius: '4px'
};

const previewStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#f1f5f9',
  padding: '1rem',
  borderRadius: '8px',
  marginTop: '1.5rem'
};

const previewItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const previewLabelStyle = {
  fontSize: '0.8rem',
  color: '#64748b',
  marginBottom: '0.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const previewValueStyle = {
  fontSize: '1.25rem',
  color: '#334155'
};

export default AdjustStockModal;
