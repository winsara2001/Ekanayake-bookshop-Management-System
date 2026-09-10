import { useState, useEffect } from 'react';
import { inventoryService } from '../../../services/inventoryService';

const InventoryHistory = ({ bookId = null }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [bookId]);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await inventoryService.getInventoryHistory(bookId);
    if (res.success) {
      setHistory(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'INITIAL_STOCK': return 'Initial Stock';
      case 'ADJUSTMENT_IN': return 'Stock Added';
      case 'ADJUSTMENT_OUT': return 'Stock Removed';
      case 'PURCHASE_RECEIPT': return 'Purchase Receipt';
      case 'ORDER_SALE': return 'Order Sale';
      case 'ORDER_CANCEL_RESTORE': return 'Order Cancellation Restore';
      default: return type;
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading history...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (history.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}>No history found.</div>;

  return (
    <div className="table-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            {!bookId && <th>Book Title</th>}
            <th>Transaction Type</th>
            <th>Change</th>
            <th>Previous</th>
            <th>New Stock</th>
            <th>Reason</th>
            <th>Performed By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((tx) => {
            const dateStr = new Date(tx.created_at).toLocaleString();
            const performerName = tx.performer ? `${tx.performer.first_name} ${tx.performer.last_name}` : 'Unknown';
            const changeColor = tx.quantity_change > 0 ? '#10b981' : (tx.quantity_change < 0 ? '#ef4444' : 'inherit');
            const changePrefix = tx.quantity_change > 0 ? '+' : '';
            
            return (
              <tr key={tx.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{dateStr}</td>
                {!bookId && <td>{tx.book?.title || 'Unknown Book'}</td>}
                <td>{getTransactionLabel(tx.transaction_type)}</td>
                <td style={{ color: changeColor, fontWeight: 'bold' }}>
                  {changePrefix}{tx.quantity_change}
                </td>
                <td>{tx.previous_stock}</td>
                <td>{tx.new_stock}</td>
                <td style={{ maxWidth: '200px', whiteSpace: 'normal' }}>{tx.reason}</td>
                <td>{performerName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryHistory;
