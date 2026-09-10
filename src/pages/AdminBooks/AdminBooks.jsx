import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiPlus, FiEdit, FiPower, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import { bookService } from '../../services/bookService';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import './AdminBooks.css';

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const isInventory = location.pathname.startsWith('/inventory');
  const basePath = isInventory ? '/inventory/books' : '/admin/books';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [authorFilter, setAuthorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [booksRes, catRes, authRes] = await Promise.all([
      bookService.getAllBooksForManagement(),
      categoryService.getAllCategories(),
      authorService.getAllAuthors()
    ]);

    if (booksRes.success) setBooks(booksRes.data);
    else setError(booksRes.error);

    if (catRes.success) setCategories(catRes.data);
    if (authRes.success) setAuthors(authRes.data);

    setLoading(false);
  };

  const handleToggleStatus = async (bookId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this book?`)) return;

    const res = await bookService.setBookActiveStatus(bookId, !currentStatus);
    if (res.success) {
      alert(`Book ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      fetchData(); // Refresh list
    } else {
      alert(res.error);
    }
  };

  const filteredBooks = books.filter(b => {
    // Search
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = b.title.toLowerCase().includes(searchLower);

    // Category
    const bCatName = b.category?.name || b.category;
    const categoryMatch = categoryFilter === 'All' || bCatName === categoryFilter;

    // Author
    const bAuthName = b.author?.name || b.author;
    const authorMatch = authorFilter === 'All' || bAuthName === authorFilter;

    // Status
    let statusMatch = true;
    if (statusFilter === 'Active') statusMatch = b.is_active === true;
    if (statusFilter === 'Inactive') statusMatch = b.is_active === false;

    return titleMatch && categoryMatch && authorMatch && statusMatch;
  });

  return (
    <main className="admin-page section">
      <div className="container">
        <div className="admin-header">
          <h1>Book Management</h1>
          <Link to={`${basePath}/add`} className="btn btn-primary">
            <FiPlus /> Add Book
          </Link>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-filters">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>
            <option value="All">All Authors</option>
            {authors.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="page-loader">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Price (LKR)</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr><td colSpan="8" className="text-center">No books found.</td></tr>
                ) : (
                  filteredBooks.map(book => {
                    const bCatName = book.category?.name || book.category;
                    const bAuthName = book.author?.name || book.author;
                    return (
                      <tr key={book.id}>
                        <td>
                          {book.cover ? (
                            <img src={book.cover} alt="Cover" className="admin-table-img" />
                          ) : (
                            <div className="admin-table-no-img">No Img</div>
                          )}
                        </td>
                        <td>{book.title}</td>
                        <td>{bAuthName}</td>
                        <td>{bCatName}</td>
                        <td>Rs. {book.price.toFixed(2)}</td>
                        <td>{book.stock}</td>
                        <td>
                          <span className={`status-badge ${book.is_active ? 'active' : 'inactive'}`}>
                            {book.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="admin-actions">
                          <Link to={`${basePath}/${book.id}/edit`} className="btn-icon" title="Edit">
                            <FiEdit />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(book.id, book.is_active)}
                            className={`btn-icon ${book.is_active ? 'text-danger' : 'text-success'}`}
                            title={book.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <FiPower />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminBooks;
