import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, staffProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loader">Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If logged in but not an active admin, redirect to home
  if (!staffProfile || !staffProfile.is_active || staffProfile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
