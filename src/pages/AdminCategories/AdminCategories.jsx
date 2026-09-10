import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiPower, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import { categoryService } from '../../services/categoryService';
import { validateName } from '../../utils/validation';
import '../AdminBooks/AdminBooks.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await categoryService.getAllCategoriesForManagement();
    if (res.success) {
      setCategories(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (catId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this category?`)) return;
    
    const res = await categoryService.setCategoryActiveStatus(catId, !currentStatus);
    if (res.success) {
      alert(`Category ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } else {
      alert(res.error);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', is_active: true });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '', is_active: cat.is_active });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const errors = {};
    const nameError = validateName(formData.name, 'Name');
    if (nameError) errors.name = nameError;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setFormSaving(true);
    setFormError(null);
    
    let res;
    if (editingCategory) {
      res = await categoryService.updateCategory(editingCategory.id, formData);
    } else {
      res = await categoryService.createCategory(formData);
    }
    
    if (res.success) {
      alert(`Category ${editingCategory ? 'updated' : 'added'} successfully.`);
      setIsModalOpen(false);
      fetchData();
    } else {
      setFormError(res.error);
    }
    
    setFormSaving(false);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="admin-page section">
      <div className="container">
        <div className="admin-header">
          <h1>Category Management</h1>
          <button onClick={openAddModal} className="btn btn-primary">
            <FiPlus /> Add Category
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-filters">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loader">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Books Linked</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">No categories found.</td></tr>
                ) : (
                  filteredCategories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.description || '-'}
                        </div>
                      </td>
                      <td>{cat.books_count}</td>
                      <td>
                        <span className={`status-badge ${cat.is_active ? 'active' : 'inactive'}`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="admin-actions">
                        <button onClick={() => openEditModal(cat)} className="btn-icon" title="Edit">
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(cat.id, cat.is_active)}
                          className={`btn-icon ${cat.is_active ? 'text-danger' : 'text-success'}`}
                          title={cat.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <FiPower />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={closeFormModal} className="btn-icon"><FiX /></button>
              </div>
              <div className="admin-modal-body">
                {formError && <div className="admin-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={handleFormChange}
                    />
                    {validationErrors.name && <span className="form-error">{validationErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="description">Description (Optional)</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-input"
                      rows="3"
                      value={formData.description}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                    <label className="remember-me">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleFormChange}
                      />
                      Active Status
                    </label>
                  </div>
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={closeFormModal} className="btn btn-outline">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={formSaving}>
                      {formSaving ? 'Saving...' : 'Save Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminCategories;
