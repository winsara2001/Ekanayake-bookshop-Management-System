import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { bookService } from '../../services/bookService';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import { validateTitle, validatePositiveNumber } from '../../utils/validation';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInventory = location.pathname.startsWith('/inventory');
  const basePath = isInventory ? '/inventory/books' : '/admin/books';
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    author_id: '',
    price: '',
    cover: '',
    rating: '0',
    featured: false,
    bestseller: false,
    is_active: true
  });
  
  const [currentStock, setCurrentStock] = useState(0);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const [bookRes, catRes, authRes] = await Promise.all([
      bookService.getBookById(id), // Note: Need to make sure RLS allows viewing inactive if we are staff
      categoryService.getAllCategories(),
      authorService.getAllAuthors()
    ]);
    
    if (catRes.success) setCategories(catRes.data);
    if (authRes.success) setAuthors(authRes.data);
    
    if (bookRes.success && bookRes.data) {
      const b = bookRes.data;
      setFormData({
        title: b.title || '',
        category_id: b.category_id || '',
        author_id: b.author_id || '',
        price: b.price || '',
        cover: b.cover || '',
        rating: b.rating || '0',
        featured: b.featured || false,
        bestseller: b.bestseller || false,
        is_active: b.is_active ?? true
      });
      setCurrentStock(b.stock || 0);
    } else {
      setError(bookRes.error || 'Book not found.');
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const errors = {};
    
    const titleError = validateTitle(formData.title, 'Title');
    if (titleError) errors.title = titleError;
    
    if (!formData.category_id) errors.category_id = 'Category is required.';
    if (!formData.author_id) errors.author_id = 'Author is required.';
    
    const priceError = validatePositiveNumber(formData.price, false);
    if (priceError) errors.price = priceError;
    
    const ratingError = validatePositiveNumber(formData.rating, true);
    if (ratingError) errors.rating = ratingError;
    else if (Number(formData.rating) > 5) errors.rating = 'Rating cannot exceed 5.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSaving(true);
    setError(null);
    
    const selectedAuthor = authors.find(a => a.id === formData.author_id) || { name: formData.author_id ? '(Keep Current)' : '' };
    const selectedCategory = categories.find(c => c.id === formData.category_id) || { name: formData.category_id ? '(Keep Current)' : '' };

    // Note: If they are inactive, we might not have the name, so we only update if we have a real name, or we rely on the previous name.
    // We can just rely on the existing value in the database if it's inactive, but for safety we'll send it if found.
    const res = await bookService.updateBook(id, {
      ...formData,
      price: Number(formData.price),
      rating: Number(formData.rating),
      ...(selectedAuthor.name !== '(Keep Current)' && { author: selectedAuthor.name }),
      ...(selectedCategory.name !== '(Keep Current)' && { category: selectedCategory.name }),
    });
    
    if (res.success) {
      alert('Book updated successfully.');
      navigate(basePath);
    } else {
      setError(res.error);
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader">Loading...</div>;

  return (
    <main className="admin-page section">
      <div className="container">
        <div className="admin-header">
          <h1>Edit Book</h1>
          <Link to={basePath} className="btn btn-outline">
            <FiArrowLeft /> Back to List
          </Link>
        </div>

        <div className="admin-form-container">
          {error && <div className="admin-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              
              <div className="form-group full-width">
                <label className="form-label" htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                />
                {validationErrors.title && <span className="form-error">{validationErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="author_id">Author</label>
                <select
                  id="author_id"
                  name="author_id"
                  className="form-input"
                  value={formData.author_id}
                  onChange={handleChange}
                >
                  <option value="">Select Author...</option>
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                  {/* Handle case where author might be inactive and not in the active list */}
                  {formData.author_id && !authors.find(a => a.id === formData.author_id) && (
                    <option value={formData.author_id} disabled>
                      (Inactive Author - ID: {formData.author_id})
                    </option>
                  )}
                </select>
                {validationErrors.author_id && <span className="form-error">{validationErrors.author_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category_id">Category</label>
                <select
                  id="category_id"
                  name="category_id"
                  className="form-input"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {/* Handle case where category might be inactive */}
                  {formData.category_id && !categories.find(c => c.id === formData.category_id) && (
                    <option value={formData.category_id} disabled>
                      (Inactive Category - ID: {formData.category_id})
                    </option>
                  )}
                </select>
                {validationErrors.category_id && <span className="form-error">{validationErrors.category_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="price">Price (LKR)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                />
                {validationErrors.price && <span className="form-error">{validationErrors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rating">Rating (0-5)</label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.rating}
                  onChange={handleChange}
                />
                {validationErrors.rating && <span className="form-error">{validationErrors.rating}</span>}
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="cover">Cover Image URL</label>
                <input
                  id="cover"
                  name="cover"
                  type="text"
                  className="form-input"
                  value={formData.cover}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group full-width" style={{ display: 'flex', gap: '2rem' }}>
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  Featured Book
                </label>
                
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="bestseller"
                    checked={formData.bestseller}
                    onChange={handleChange}
                  />
                  Best Seller
                </label>
                
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <strong>Current Stock: {currentStock}</strong>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Stock is managed through Inventory Management.
                </p>
              </div>

            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Update Book'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </main>
  );
};

export default EditBook;
