import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBookOpen, FiGrid, FiFeather,
  FiBox, FiAlertCircle, FiClock,
  FiUsers, FiShoppingBag, FiCreditCard,
  FiTruck, FiFileText, FiShield, FiBarChart2,
  FiMenu, FiX, FiLogOut, FiStar
} from 'react-icons/fi';

import './AdminLayout.css';

const AdminLayout = ({ children }) => {
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
        <div className="admin-mobile-title">Ekanayake Admin</div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <button onClick={toggleSidebar} className="admin-close-btn d-md-none">
            <FiX />
          </button>
        </div>

        <div className="admin-user-info">
          <div className="admin-avatar">{staffProfile?.first_name?.charAt(0) || 'A'}</div>
          <div className="admin-details">
            <span className="admin-name">{staffProfile?.first_name} {staffProfile?.last_name}</span>
            <span className="admin-role-badge">{staffProfile?.role}</span>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <h3>Dashboard</h3>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiHome /> Dashboard
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Catalogue</h3>
            <NavLink to="/admin/books" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiBookOpen /> Books
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiGrid /> Categories
            </NavLink>
            <NavLink to="/admin/authors" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiFeather /> Authors
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Inventory</h3>
            <NavLink to="/admin/inventory" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiBox /> Inventory Management
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Customers</h3>
            <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiUsers /> Customers
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Orders</h3>
            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiShoppingBag /> Orders
            </NavLink>
            <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiCreditCard /> Payments
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <h3>Purchasing</h3>
            <NavLink to="/admin/suppliers" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiTruck /> Suppliers
            </NavLink>
            <NavLink to="/admin/purchase-orders" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
              <FiFileText /> Purchase Orders
            </NavLink>
          </div>

          {staffProfile?.role === 'admin' && (
            <div className="admin-nav-section">
              <h3>Administration</h3>
              <NavLink to="/admin/loyalty" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
                <FiStar /> Loyalty Settings
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
                <FiShield /> Users / Staff
              </NavLink>
              <NavLink to="/admin/reports/sales" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => setIsSidebarOpen(false)}>
                <FiBarChart2 /> Sales Reports
              </NavLink>
            </div>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogoutClick} className="admin-logout-btn" disabled={isLoggingOut}>
            <FiLogOut /> {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-content">
        {/* We use children if provided, otherwise Outlet for nested routes */}
        {children || <Outlet />}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default AdminLayout;
