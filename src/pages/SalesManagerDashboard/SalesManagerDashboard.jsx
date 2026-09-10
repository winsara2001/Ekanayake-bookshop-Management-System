import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiShoppingBag, FiCheckCircle, FiPackage, FiTruck } from 'react-icons/fi';
import '../AdminDashboard/AdminDashboard.css';

const SalesManagerDashboard = () => {
  const { staffProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    pending: 0,
    confirmed: 0,
    ready: 0,
    completed: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!staffProfile || (staffProfile.role !== 'admin' && staffProfile.role !== 'sales_manager'))) {
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
      const [pendingRes, confirmedRes, readyRes, completedRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'READY_FOR_COLLECTION'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED')
      ]);

      setMetrics({
        pending: pendingRes.count || 0,
        confirmed: confirmedRes.count || 0,
        ready: readyRes.count || 0,
        completed: completedRes.count || 0
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
        <h1>Sales Dashboard</h1>
        <p>Welcome back, {staffProfile.first_name}!</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card animate-fade-in-up stagger-1">
          <div className="metric-icon" style={{ backgroundColor: '#fef08a', color: '#ca8a04' }}>
            <FiShoppingBag />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Pending Orders</h3>
            <p className="metric-value">{metrics.pending}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-2">
          <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <FiCheckCircle />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Confirmed Orders</h3>
            <p className="metric-value">{metrics.confirmed}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-3">
          <div className="metric-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
            <FiPackage />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Ready for Collection</h3>
            <p className="metric-value">{metrics.ready}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-4">
          <div className="metric-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <FiTruck />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Completed Orders</h3>
            <p className="metric-value">{metrics.completed}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions" style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link to="/sales/orders" className="btn btn-primary">View All Orders</Link>
        </div>
      </div>
    </main>
  );
};

export default SalesManagerDashboard;
