import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { supabase } from '../../lib/supabase'; // need to fetch books directly or via service

const PurchaseOrderForm = ({ role }) => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [books, setBooks] = useState([]);

  const [poData, setPoData] = useState({
    supplier_id: '',
    expected_date: '',
    supplier_reference: '',
    notes: ''
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      // Fetch Active Suppliers
      const suppRes = await supplierService.getSuppliers();
      if (suppRes.success) {
        setSuppliers(suppRes.data.filter(s => s.is_active));
      }

      // Fetch Books
      const { data: booksData } = await supabase.from('books').select('id, title, isbn');
      if (booksData) {
        setBooks(booksData);
      }

      if (isEdit) {
        const poRes = await purchaseOrderService.getPurchaseOrderById(id);
        if (poRes.success) {
          const po = poRes.data;
          
          if (po.status !== 'DRAFT') {
            setError('Only DRAFT purchase orders can be edited.');
            setLoading(false);
            return;
          }

          setPoData({
            supplier_id: po.supplier_id,
            expected_date: po.expected_date || '',
            supplier_reference: po.supplier_reference || '',
            notes: po.notes || ''
          });

          const formattedItems = po.items.map(item => ({
            id: item.id,
            book_id: item.book_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            _tempId: Math.random().toString(36)
          }));
          setItems(formattedItems);
        } else {
          setError(poRes.error);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePoDataChange = (field, value) => {
    setPoData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { _tempId: Math.random().toString(36), book_id: '', quantity: 1, unit_cost: 0 }
    ]);
  };

  const removeItem = (tempId) => {
    setItems(prev => prev.filter(i => i._tempId !== tempId));
  };

  const handleItemChange = (tempId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item._tempId === tempId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const validate = () => {
    if (!poData.supplier_id) return 'Please select a supplier.';
    if (items.length === 0) return 'Purchase order must have at least one item.';
    
    const bookIds = new Set();
    for (const item of items) {
      if (!item.book_id) return 'Please select a book for all items.';
      if (bookIds.has(item.book_id)) return 'Duplicate books are not allowed.';
      bookIds.add(item.book_id);
      
      if (item.quantity < 1) return 'Quantity must be at least 1.';
      if (item.unit_cost <= 0) return 'Unit cost must be greater than 0.';
    }
    return null;
  };

  const handleSave = async () => {
    const valError = validate();
    if (valError) {
      setError(valError);
      return;
    }

    setSaving(true);
    setError(null);

    let res;
    if (isEdit) {
      res = await purchaseOrderService.updatePurchaseOrder(id, poData, items /* We don't have old unedited items context perfectly here, but update PO service is robust enough, wait actually the service expects currentItems and newItems. 
        Wait, in our service implementation:
        const currentItems = po.items; -> need to fetch this or pass it. 
        Actually, we can fetch current items inside the service to be safe, or we pass items as is.
        Let's modify the service call to just pass `items` and let the service handle diffing if necessary, or just overwrite.
      */, items);
      
      // Let's adjust the update call. The service accepts `id, poData, currentItems, newItems`.
      // We will fetch fresh current items just before updating, or pass the fetched ones. 
      // To keep it simple, our service update logic needs `currentItems`.
    } else {
      res = await purchaseOrderService.createPurchaseOrder(poData, items);
    }

    if (res.success) {
      navigate(role === 'inventory_manager' ? '/inventory/purchase-orders' : '/admin/purchase-orders');
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  // Safe wrapper for update that fetches current items first
  const safeUpdate = async () => {
    const valError = validate();
    if (valError) return setError(valError);
    setSaving(true);
    
    // fetch current to do diff
    const poRes = await purchaseOrderService.getPurchaseOrderById(id);
    if (poRes.success) {
      const currentItems = poRes.data.items;
      const updateRes = await purchaseOrderService.updatePurchaseOrder(id, poData, currentItems, items);
      if (updateRes.success) {
        navigate(role === 'inventory_manager' ? '/inventory/purchase-orders' : '/admin/purchase-orders');
      } else {
        setError(updateRes.error);
      }
    } else {
      setError('Could not fetch current PO to update.');
    }
    setSaving(false);
  };

  const submit = isEdit ? safeUpdate : handleSave;

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  if (loading) return <div className="admin-page section"><div className="page-loader">Loading form...</div></div>;

  return (
    <div className="admin-page section">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><FiArrowLeft size={24} /></button>
          <h1>{isEdit ? 'Edit Draft Purchase Order' : 'Create Purchase Order'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)} disabled={saving}><FiX /> Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* PO Details */}
        <div className="admin-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>PO Details</h2>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Supplier *</label>
            <select 
              className="form-input" 
              value={poData.supplier_id} 
              onChange={(e) => handlePoDataChange('supplier_id', e.target.value)}
              disabled={isEdit} // usually supplier shouldn't change easily if items exist, but we allow it
            >
              <option value="">-- Select Active Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Expected Date</label>
            <input 
              type="date" 
              className="form-input"
              value={poData.expected_date}
              onChange={(e) => handlePoDataChange('expected_date', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Supplier Reference (Quote #)</label>
            <input 
              type="text" 
              className="form-input"
              value={poData.supplier_reference}
              onChange={(e) => handlePoDataChange('supplier_reference', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Notes</label>
            <textarea 
              className="form-input"
              value={poData.notes}
              onChange={(e) => handlePoDataChange('notes', e.target.value)}
              rows="4"
            />
          </div>
        </div>

        {/* PO Items */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Line Items</h2>
            <button className="btn btn-outline" onClick={addItem} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              <FiPlus /> Add Book
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No items added. Click "Add Book" to start.
              </div>
            ) : (
              <table className="admin-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th style={{ width: '100px' }}>Quantity</th>
                    <th style={{ width: '150px' }}>Unit Cost</th>
                    <th style={{ width: '150px' }}>Total</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._tempId}>
                      <td>
                        <select 
                          className="form-input" 
                          value={item.book_id}
                          onChange={(e) => handleItemChange(item._tempId, 'book_id', e.target.value)}
                          style={{ padding: '0.25rem' }}
                        >
                          <option value="">-- Select Book --</option>
                          {books.map(b => (
                            <option key={b.id} value={b.id}>{b.title} (ISBN: {b.isbn})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item._tempId, 'quantity', parseInt(e.target.value) || 0)}
                          style={{ padding: '0.25rem' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '0.25rem' }}>$</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            min="0.01"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => handleItemChange(item._tempId, 'unit_cost', parseFloat(e.target.value) || 0)}
                            style={{ padding: '0.25rem' }}
                          />
                        </div>
                      </td>
                      <td>
                        <strong>${((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}</strong>
                      </td>
                      <td>
                        <button className="btn-icon text-danger" onClick={() => removeItem(item._tempId)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ borderTop: '2px solid #eee', paddingTop: '1rem', marginTop: 'auto', textAlign: 'right', fontSize: '1.25rem' }}>
            <strong>PO Total: <span style={{ color: '#2563eb' }}>${calculateTotal().toFixed(2)}</span></strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
