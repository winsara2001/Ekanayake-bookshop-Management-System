import { useState, useEffect } from 'react';
import { FiSave, FiAlertCircle } from 'react-icons/fi';
import { loyaltyService } from '../../services/loyaltyService';

const AdminLoyalty = () => {
  const [settings, setSettings] = useState({
    earn_amount_per_point: '',
    redemption_value_per_point: '',
    is_active: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await loyaltyService.getLoyaltySettings();
    if (res.success && res.data) {
      setSettings(res.data);
    } else {
      setError(res.error || 'Failed to load loyalty settings');
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const earnAmount = parseFloat(settings.earn_amount_per_point);
    const redeemValue = parseFloat(settings.redemption_value_per_point);

    if (isNaN(earnAmount) || earnAmount <= 0) {
      setError('Earn amount per point must be greater than 0');
      setSaving(false);
      return;
    }

    if (isNaN(redeemValue) || redeemValue <= 0) {
      setError('Redemption value per point must be greater than 0');
      setSaving(false);
      return;
    }

    const updates = {
      earn_amount_per_point: earnAmount,
      redemption_value_per_point: redeemValue,
      is_active: settings.is_active
    };

    const res = await loyaltyService.updateLoyaltySettings(updates);
    
    if (res.success) {
      setSuccess(true);
      setSettings(res.data);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="admin-page section"><div className="page-loader">Loading Settings...</div></div>;
  }

  return (
    <div className="admin-page section">
      <div className="admin-header">
        <h1>Loyalty Program Settings</h1>
      </div>

      {error && <div className="admin-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      
      {success && (
        <div style={{ padding: '1rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiSave /> Settings saved successfully!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px' }}>
        
        <div className="admin-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Program Configuration
          </h2>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={settings.is_active}
                  onChange={(e) => setSettings({...settings, is_active: e.target.checked})}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                <strong>Loyalty Program Active</strong>
              </label>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', marginLeft: '1.7rem' }}>
                If unchecked, customers will not earn new points or be able to redeem existing points. Balances and history are preserved.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Amount Required to Earn 1 Point (LKR)</label>
              <input 
                type="number" 
                className="form-input" 
                min="0.01"
                step="0.01"
                required
                value={settings.earn_amount_per_point}
                onChange={(e) => setSettings({...settings, earn_amount_per_point: e.target.value})}
              />
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Example: If set to 100, an order of LKR 2,550 earns 25 points.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Discount Value of 1 Point (LKR)</label>
              <input 
                type="number" 
                className="form-input"
                min="0.01" 
                step="0.01"
                required
                value={settings.redemption_value_per_point}
                onChange={(e) => setSettings({...settings, redemption_value_per_point: e.target.value})}
              />
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Example: If set to 1, redeeming 50 points provides a LKR 50 discount.
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><FiSave /> Save Settings</>}
            </button>
          </form>
        </div>

        <div className="admin-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiAlertCircle /> Business Rules
          </h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.6', fontSize: '0.9rem' }}>
            <li>Points are strictly calculated on the <strong>Final Payable Amount</strong> (subtotal minus any discounts).</li>
            <li>Points are automatically awarded exactly once, only when an order status reaches <strong>COMPLETED</strong>.</li>
            <li>If an order containing redeemed points is cancelled while PENDING, the points are automatically restored.</li>
            <li>Cancelled orders do not earn points.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AdminLoyalty;
