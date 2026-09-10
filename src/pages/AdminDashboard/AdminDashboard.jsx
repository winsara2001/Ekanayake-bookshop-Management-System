import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { FiBook, FiUsers, FiShield, FiAlertTriangle } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { staffProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    totalCustomers: 0,
    activeStaff: 0
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!staffProfile || (staffProfile.role !== 'admin' && staffProfile.role !== 'staff'))) {
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
    const res = await adminService.getDashboardMetrics();
    if (res.success) {
      setMetrics(res.data);
    }
    setMetricsLoading(false);
  };

  if (authLoading || metricsLoading) return <div className="page-loader">Loading Dashboard...</div>;
  if (!staffProfile) return null;

  return (
    <main className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
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
          <div className="metric-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <FiUsers />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Customers</h3>
            <p className="metric-value">{metrics.totalCustomers}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-3">
          <div className="metric-icon" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
            <FiShield />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Active Staff</h3>
            <p className="metric-value">{metrics.activeStaff}</p>
          </div>
        </div>

        <div className="metric-card animate-fade-in-up stagger-4">
          <div className="metric-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <FiAlertTriangle />
          </div>
          <div className="metric-content">
            <h3 className="metric-title">Low Stock Alerts</h3>
            <p className="metric-value">0</p>
            <small className="metric-subtext">Feature coming soon</small>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
