import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiBook, FiAlertTriangle, FiXCircle, FiActivity } from 'react-icons/fi';
import '../AdminDashboard/AdminDashboard.css';

const InventoryManagerDashboard = () => {
  const { staffProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    lowStock: 0,
    outOfStock: 0,
    recentTransactions: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!staffProfile || (staffProfile.role !== 'admin' && staffProfile.role !== 'inventory_manager'))) {
      navigate('/', { replace: true });
    }
  }, [staffProfile, authLoading, navigate]);

  useEffect(() => {
    if (staffProfile) {
      fetchMetrics();
    }
  }, [staffProfile]);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const [booksRes, lowStockRes, outOfStockRes, transactionsRes] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }).lt('stock', 10).gt('stock', 0),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('stock', 0),
        supabase.from('inventory_transactions').select('*', { count: 'exact', head: true }) // You can filter by date if you want
      ]);

      setMetrics({
        totalBooks: booksRes.count || 0,
        lowStock: lowStockRes.count || 0,
        outOfStock: outOfStockRes.count || 0,
        recentTransactions: transactionsRes.count || 0
      });
    } catch (err) {
      console.error(err);
    }
    setMetricsLoading(false);
  };

  if (authLoading || metricsLoading) return <div className="page-loader">Loading Dashboard...</div>;
  if (!staffProfile) return null;

  return (
    <main className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Inventory Dashboard</h1>
        <p>Welcome back, {staffProfile.first_name}!</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card animate-fade-in-up stagger-1">
          <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <FiBook />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Total Books</h3>
            <p className="metric-value">{metrics.totalBooks}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-2">
          <div className="metric-icon" style={{ backgroundColor: '#fef08a', color: '#ca8a04' }}>
            <FiAlertTriangle />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Low Stock Books</h3>
            <p className="metric-value">{metrics.lowStock}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-3">
          <div className="metric-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <FiXCircle />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Out of Stock</h3>
            <p className="metric-value">{metrics.outOfStock}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-4">
          <div className="metric-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <FiActivity />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Total Transactions</h3>
            <p className="metric-value">{metrics.recentTransactions}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions" style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link to="/inventory/books" className="btn btn-primary">Manage Books</Link>
          <Link to="/inventory/inventory" className="btn btn-secondary">Adjust Stock</Link>
        </div>
      </div>
    </main>
  );
};

export default InventoryManagerDashboard;
