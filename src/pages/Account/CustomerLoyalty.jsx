import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { loyaltyService } from '../../services/loyaltyService';
import { Link } from 'react-router-dom';

const CustomerLoyalty = () => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    const [accRes, txRes, setRes] = await Promise.all([
      loyaltyService.getMyLoyaltyAccount(),
      loyaltyService.getMyLoyaltyTransactions(),
      loyaltyService.getLoyaltySettings()
    ]);

    if (accRes.success) setAccount(accRes.data);
    else setError(accRes.error);

    if (txRes.success) setTransactions(txRes.data);
    if (setRes.success) setSettings(setRes.data);
    
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading loyalty information...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  const currentRedemptionValue = account?.points_balance * (settings?.redemption_value_per_point || 0);

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Loyalty Points</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <FiStar style={{ color: '#f59e0b' }} /> {account?.points_balance || 0}
          </div>
        </div>
        
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Redemption Value</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669', marginTop: '0.75rem' }}>
            Rs. {currentRedemptionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Lifetime Earned</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', marginTop: '1rem' }}>{account?.lifetime_points_earned || 0} pts</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Lifetime Redeemed</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', marginTop: '1rem' }}>{account?.lifetime_points_redeemed || 0} pts</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">Loyalty History</h2>
      </div>

      {transactions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          No loyalty transactions found. Complete orders to earn points!
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Points</th>
                <th>Order</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      tx.transaction_type === 'EARN' ? 'completed' : 
                      tx.transaction_type === 'REDEEM' ? 'cancelled' : 'confirmed'
                    }`}>
                      {tx.transaction_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: 'bold',
                    color: tx.points > 0 ? '#059669' : '#dc2626'
                  }}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </td>
                  <td>
                    {tx.orders?.order_number ? (
                      <Link to={`/orders/${tx.order_id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {tx.orders.order_number}
                      </Link>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {tx.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerLoyalty;
