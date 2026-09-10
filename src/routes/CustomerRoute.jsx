import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location.pathname, message: 'Please log in to continue.' }} replace />;
  }

  return children;
};

export default CustomerRoute;
