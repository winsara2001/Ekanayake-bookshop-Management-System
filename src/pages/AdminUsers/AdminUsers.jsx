import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiUserCheck, FiPower, FiX, FiTrash2 } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import '../AdminBooks/AdminBooks.css'; // Reuse generic admin table/modal styles

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Role Modal state
  const [newRole, setNewRole] = useState('inventory_manager');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await adminService.getAllUsers();
    if (res.success) {
      setUsers(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const openAssignModal = (u) => {
    setSelectedUser(u);
    setNewRole('inventory_manager');
    setAssignModalOpen(true);
  };

  const openRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setRoleModalOpen(true);
  };

  const closeModals = () => {
    setAssignModalOpen(false);
    setRoleModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleAssignStaff = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.assignCustomerToStaff(selectedUser.id, newRole);
    if (res.success) {
      alert('Staff role assigned successfully.');
      closeModals();
      fetchUsers();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.updateStaffRole(selectedUser.id, newRole);
    if (res.success) {
      alert('Role updated successfully.');
      closeModals();
      fetchUsers();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleToggleStatus = async (u) => {
    if (u.id === currentUser?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    const actionStr = u.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionStr} this staff account?`)) return;

    const res = await adminService.setStaffActiveStatus(u.id, !u.is_active);
    if (res.success) {
      alert(`Staff account ${u.is_active ? 'deactivated' : 'reactivated'} successfully.`);
      fetchUsers();
    } else {
      alert(res.error);
    }
  };

  const openDeleteModal = (u) => {
    if (u.id === currentUser?.id) {
      alert("You cannot delete your own Admin account.");
      return;
    }
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.deleteStaff(selectedUser.id);
    if (res.success) {
      alert('Staff access removed successfully.');
      closeModals();
      fetchUsers();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    let matchType = false;
    if (typeFilter === 'All') {
      matchType = true;
    } else if (typeFilter === 'Staff') {
      matchType = u.account_type === 'Inventory Manager' || u.account_type === 'Sales Manager';
    } else {
      matchType = u.account_type === typeFilter;
    }
    return matchSearch && matchType;
  });

  return (
    <div className="admin-page section" style={{ padding: '0', minHeight: 'auto' }}>
      <div className="admin-header">
        <h1>User / Staff Management</h1>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-filters">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All Account Types</option>
          <option value="Customer">Customer</option>
          <option value="Staff">Staff</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loader">Loading Users...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} style={isSelf ? { backgroundColor: '#f0f9ff' } : {}}>
                      <td>
                        {u.name} {isSelf && <span style={{ fontSize: '0.75rem', color: '#0284c7', marginLeft: '4px' }}>(You)</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: u.account_type === 'Admin' ? '#f3e8ff' : u.account_type === 'Inventory Manager' ? '#e0f2fe' : u.account_type === 'Sales Manager' ? '#dcfce7' : '#f1f5f9',
                          color: u.account_type === 'Admin' ? '#7e22ce' : u.account_type === 'Inventory Manager' ? '#0369a1' : u.account_type === 'Sales Manager' ? '#16a34a' : '#475569'
                        }}>
                          {u.account_type}
                        </span>
                      </td>
                      <td>
                        {u.account_type !== 'Customer' ? (
                          <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <span className="status-badge active" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>N/A</span>
                        )}
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="admin-actions">
                        {u.account_type === 'Customer' && (
                          <button onClick={() => openAssignModal(u)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            Assign Staff
                          </button>
                        )}
                        {u.account_type !== 'Customer' && (
                          <>
                            <button
                              onClick={() => openRoleModal(u)}
                              className="btn-icon"
                              title="Edit Role"
                              disabled={isSelf} // Don't let admin demote themselves easily here
                              style={{ opacity: isSelf ? 0.3 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`btn-icon ${u.is_active ? 'text-danger' : 'text-success'}`}
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                              disabled={isSelf}
                              style={{ opacity: isSelf ? 0.3 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                            >
                              <FiPower />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="btn-icon text-danger"
                              title="Delete Staff"
                              disabled={isSelf}
                              style={{ opacity: isSelf ? 0.3 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModalOpen && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Assign Staff Role</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Select Role</label>
                  <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleAssignStaff} className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {roleModalOpen && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Edit Staff Role</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Select Role for {selectedUser.name}</label>
                <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleUpdateRole} className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Modal */}
      {deleteModalOpen && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Delete Staff Member?</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Are you sure you want to remove staff access for <strong>{selectedUser.name}</strong>? This user will no longer be able to access Staff features.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleDeleteStaff} className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={actionLoading}>
                  {actionLoading ? 'Deleting...' : 'Delete Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
