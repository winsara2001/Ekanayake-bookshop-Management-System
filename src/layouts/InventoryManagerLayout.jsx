import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiBookOpen, FiGrid, FiFeather, 
  FiBox, FiTruck,
  FiMenu, FiX, FiLogOut, FiHome
} from 'react-icons/fi';

import '../layouts/AdminLayout.css'; // Reusing admin layout styles

const InventoryManagerLayout = ({ children }) => {
  const { staffProfile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <button onClick={toggleSidebar} className="admin-menu-btn">
          <FiMenu />
        </button>
        <div className="admin-mobile-title">Inventory Manager</div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Inventory Portal</h2>
          <button onClick={toggleSidebar} className="admin-close-btn d-md-none">
            <FiX />
          </button>
        </div>

        <div className="admin-user-info">
          <div className="admin-avatar">{staffProfile?.first_name?.charAt(0) || 'I'}</div>
          <div className="admin-details">
            <span className="admin-name">{staffProfile?.first_name} {staffProfile?.last_name}</span>
            <span className="admin-role-badge">Inventory Manager</span>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <h3>Dashboard</h3>
            <NavLink to="/inventory/dashboard" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiHome /> Dashboard
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Catalogue</h3>
            <NavLink to="/inventory/books" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiBookOpen /> Books
            </NavLink>
            <NavLink to="/inventory/categories" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiGrid /> Categories
            </NavLink>
            <NavLink to="/inventory/authors" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiFeather /> Authors
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Inventory</h3>
            <NavLink to="/inventory/inventory" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiBox /> Inventory Management
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Purchasing</h3>
            <NavLink to="/inventory/suppliers" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiTruck /> Suppliers
            </NavLink>
            <NavLink to="/inventory/purchase-orders" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiBookOpen /> Purchase Orders
            </NavLink>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogoutClick} className="admin-logout-btn" disabled={isLoggingOut}>
            <FiLogOut /> {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-content">
        {children || <Outlet />}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default InventoryManagerLayout;
