import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiPower, FiX, FiSearch } from 'react-icons/fi';
import { authorService } from '../../services/authorService';
import { validateName } from '../../utils/validation';
import '../AdminBooks/AdminBooks.css';

const AdminAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
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
    const res = await authorService.getAllAuthorsForManagement();
    if (res.success) {
      setAuthors(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (authId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this author?`)) return;
    
    const res = await authorService.setAuthorActiveStatus(authId, !currentStatus);
    if (res.success) {
      alert(`Author ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } else {
      alert(res.error);
    }
  };

  const openAddModal = () => {
    setEditingAuthor(null);
    setFormData({ name: '', bio: '', is_active: true });
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setFormData({ name: author.name, bio: author.bio || '', is_active: author.is_active });
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
    if (editingAuthor) {
      res = await authorService.updateAuthor(editingAuthor.id, formData);
    } else {
      res = await authorService.createAuthor(formData);
    }
    
    if (res.success) {
      alert(`Author ${editingAuthor ? 'updated' : 'added'} successfully.`);
      setIsModalOpen(false);
      fetchData();
    } else {
      setFormError(res.error);
    }
    
    setFormSaving(false);
  };

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="admin-page section">
      <div className="container">
        <div className="admin-header">
          <h1>Author Management</h1>
          <button onClick={openAddModal} className="btn btn-primary">
            <FiPlus /> Add Author
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-filters">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search authors..." 
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
                  <th>Bio</th>
                  <th>Books Linked</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthors.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">No authors found.</td></tr>
                ) : (
                  filteredAuthors.map(author => (
                    <tr key={author.id}>
                      <td>{author.name}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {author.bio || '-'}
                        </div>
                      </td>
                      <td>{author.books_count}</td>
                      <td>
                        <span className={`status-badge ${author.is_active ? 'active' : 'inactive'}`}>
                          {author.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="admin-actions">
                        <button onClick={() => openEditModal(author)} className="btn-icon" title="Edit">
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(author.id, author.is_active)}
                          className={`btn-icon ${author.is_active ? 'text-danger' : 'text-success'}`}
                          title={author.is_active ? 'Deactivate' : 'Activate'}
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
                <h2>{editingAuthor ? 'Edit Author' : 'Add Author'}</h2>
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
                    <label className="form-label" htmlFor="bio">Bio (Optional)</label>
                    <textarea
                      id="bio"
                      name="bio"
                      className="form-input"
                      rows="3"
                      value={formData.bio}
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
                      {formSaving ? 'Saving...' : 'Save Author'}
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

export default AdminAuthors;
