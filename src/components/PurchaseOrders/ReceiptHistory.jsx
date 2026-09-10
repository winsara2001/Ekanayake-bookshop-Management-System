import { useState, useEffect } from 'react';
import { purchaseOrderService } from '../../services/purchaseOrderService';

const ReceiptHistory = ({ poId }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, [poId]);

  const fetchReceipts = async () => {
    setLoading(true);
    const res = await purchaseOrderService.getPurchaseOrderReceipts(poId);
    if (res.success) {
      setReceipts(res.data);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-gray-500">Loading receipt history...</div>;
  if (receipts.length === 0) return <div className="text-gray-500">No receipts recorded yet.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {receipts.map((receipt, index) => (
        <div key={receipt.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            <div>
              <strong>Receipt #{receipts.length - index}</strong>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {new Date(receipt.received_at).toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem' }}>Received by: <strong>{receipt.received_by_user?.first_name} {receipt.received_by_user?.last_name}</strong></div>
              {receipt.note && <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>"{receipt.note}"</div>}
            </div>
          </div>
          
          <table className="admin-table" style={{ marginTop: 0, fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Book</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Quantity Received</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Prev Stock</th>
                <th style={{ textAlign: 'center', width: '100px' }}>New Stock</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.map(item => (
                <tr key={item.id}>
                  <td>{item.books?.title} <span className="text-gray-500">({item.books?.isbn})</span></td>
                  <td style={{ textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>+{item.quantity_received}</td>
                  <td style={{ textAlign: 'center' }}>{item.previous_stock}</td>
                  <td style={{ textAlign: 'center' }}>{item.new_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ReceiptHistory;
