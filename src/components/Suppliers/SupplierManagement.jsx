import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiPlus, FiPower, FiX, FiCheckCircle } from 'react-icons/fi';
import { supplierService } from '../../services/supplierService';
import '../../pages/AdminBooks/AdminBooks.css'; // Reusing standard admin styles

const SupplierManagement = ({ role }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const res = await supplierService.getSuppliers();
    if (res.success) {
      setSuppliers(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    setFormError('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setSelectedSupplier(s);
    setFormData({
      name: s.name || '',
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      notes: s.notes || ''
    });
    setFormError('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const closeModals = () => {
    setModalOpen(false);
    setDeactivateModalOpen(false);
    setReactivateModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.name.trim()) {
      setFormError('Supplier Name is required.');
      return;
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormError('Invalid email format.');
      return;
    }
    if (formData.phone && !/^\d[\d\s-]*\d$/.test(formData.phone)) {
      setFormError('Invalid phone format.');
      return;
    }

    setActionLoading(true);
    let res;
    if (selectedSupplier) {
      // Edit
      res = await supplierService.updateSupplier(selectedSupplier.id, formData);
    } else {
      // Create
      res = await supplierService.createSupplier(formData);
    }

    if (res.success) {
      setSuccessMsg(selectedSupplier ? 'Supplier updated successfully.' : 'Supplier added successfully.');
      setTimeout(() => {
        closeModals();
        fetchSuppliers();
      }, 1500);
    } else {
      setFormError(res.error);
    }
    setActionLoading(false);
  };

  const handleDeactivate = async () => {
    if (!selectedSupplier) return;
    setActionLoading(true);
    const res = await supplierService.deactivateSupplier(selectedSupplier.id);
    if (res.success) {
      alert('Supplier deactivated successfully.');
      closeModals();
      fetchSuppliers();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleReactivate = async () => {
    if (!selectedSupplier) return;
    setActionLoading(true);
    const res = await supplierService.reactivateSupplier(selectedSupplier.id);
    if (res.success) {
      alert('Supplier reactivated successfully.');
      closeModals();
      fetchSuppliers();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (s.supplier_code || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'Active') matchStatus = s.is_active === true;
    if (statusFilter === 'Inactive') matchStatus = s.is_active === false;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page section" style={{ padding: '0', minHeight: 'auto' }}>
      <div className="admin-header">
        <h1>Supplier Management</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <FiPlus /> Add Supplier
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-filters">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loader">Loading Suppliers...</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No suppliers found.</td></tr>
              ) : (
                filteredSuppliers.map(s => (
                  <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.6 }}>
                    <td><strong>{s.supplier_code}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.contact_person || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td>
                      <span className={`status-badge ${s.is_active ? 'active' : 'inactive'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button 
                        onClick={() => openEditModal(s)} 
                        className="btn-icon" 
                        title="Edit Supplier"
                      >
                        <FiEdit />
                      </button>
                      
                      {role === 'admin' && (
                        <>
                          {s.is_active ? (
                            <button 
                              onClick={() => { setSelectedSupplier(s); setDeactivateModalOpen(true); }}
                              className="btn-icon text-danger"
                              title="Deactivate Supplier"
                            >
                              <FiPower />
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setSelectedSupplier(s); setReactivateModalOpen(true); }}
                              className="btn-icon text-success"
                              title="Reactivate Supplier"
                            >
                              <FiCheckCircle />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <h2>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            
            <div className="admin-modal-body">
              {successMsg && (
                <div style={{ padding: '1rem', background: '#dcfce7', color: '#16a34a', borderRadius: '4px', marginBottom: '1rem' }}>
                  {successMsg}
                </div>
              )}
              {formError && <div className="admin-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
              
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Supplier Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Address</label>
                  <textarea 
                    className="form-input" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-input" 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {deactivateModalOpen && selectedSupplier && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Deactivate Supplier?</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Are you sure you want to deactivate <strong>{selectedSupplier.name} ({selectedSupplier.supplier_code})</strong>?
                <br /><br />
                Inactive suppliers will not be available for new purchase orders.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleDeactivate} className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={actionLoading}>
                  {actionLoading ? 'Deactivating...' : 'Deactivate Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {reactivateModalOpen && selectedSupplier && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Reactivate Supplier?</h2>
              <button onClick={closeModals} className="btn-icon"><FiX /></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Are you sure you want to reactivate <strong>{selectedSupplier.name} ({selectedSupplier.supplier_code})</strong>?
                This supplier will become available for new purchase orders again.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={closeModals} className="btn btn-outline" disabled={actionLoading}>Cancel</button>
                <button onClick={handleReactivate} className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }} disabled={actionLoading}>
                  {actionLoading ? 'Reactivating...' : 'Reactivate Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
